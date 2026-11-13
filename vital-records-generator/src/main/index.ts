import { app, BrowserWindow, ipcMain, screen, dialog, Menu } from 'electron'
import { join, basename, extname } from 'node:path'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { is, electronApp } from '@electron-toolkit/utils'
import { channels } from '../shared/channels'
import { readStore, updateStore, removeRecentFile, clearRecentFiles } from './storage'
import type { ExportFormat, InputFile } from '../shared/records'

const formats: ExportFormat[] = ['xlsx', 'csv', 'json', 'pdf']
const directory = () => app.getPath('userData')

async function rememberFiles(files: InputFile[]): Promise<void> {
  await updateStore(directory(), store => {
    files.forEach(file => {
      store.recent = [
        { path: file.path!, name: file.name, importedAt: new Date().toISOString() },
        ...store.recent.filter(r => r.path !== file.path)
      ].slice(0, 10)
    })
  })
}

async function readInput(path: string): Promise<InputFile> {
  if (!['.txt', '.csv'].includes(extname(path).toLowerCase())) {
    throw new Error('Only TXT and CSV files are supported.')
  }
  if ((await stat(path)).size > 25 * 1024 * 1024) {
    throw new Error(`${basename(path)} exceeds the 25 MB file limit.`)
  }
  return { path, name: basename(path), text: await readFile(path, 'utf8') }
}

function registerIPC(): void {
  ipcMain.handle(channels.open, async event => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return []
    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Vital record files', extensions: ['txt', 'csv'] }]
    })
    if (result.canceled) return []
    // Read the entire selection before changing history; partial read failures are visible to the user.
    const files = await Promise.all(result.filePaths.map(readInput))
    await rememberFiles(files)
    return files
  })

  ipcMain.handle(channels.dropped, async (_event, paths: unknown) => {
    if (!Array.isArray(paths) || paths.length > 100 || !paths.every(path => typeof path === 'string' && path.length > 0)) {
      throw new Error('Invalid dropped files.')
    }
    const files = await Promise.all(paths.map(readInput))
    await rememberFiles(files)
    return files
  })

  ipcMain.handle(channels.recent, async () => (await readStore(directory())).recent)
  ipcMain.handle(channels.removeRecent, async (_event, path: unknown) => removeRecentFile(directory(), path))
  ipcMain.handle(channels.clearRecent, async () => clearRecentFiles(directory()))

  ipcMain.handle(channels.reload, async (_event, path: unknown) => {
    const store = await readStore(directory())
    if (typeof path !== 'string' || !store.recent.some(r => r.path === path)) {
      throw new Error('File is not in recent history.')
    }
    return readInput(path)
  })

  ipcMain.handle(channels.activity, async () => (await readStore(directory())).activity)

  ipcMain.handle(channels.log, async (_event, action: unknown, detail: unknown) => {
    if (typeof action !== 'string' || typeof detail !== 'string' || action.length > 80 || detail.length > 500) {
      throw new Error('Invalid activity entry.')
    }
    await updateStore(directory(), store => {
      store.activity = [{ at: new Date().toISOString(), action, detail }, ...store.activity].slice(0, 200)
    })
  })

  ipcMain.handle(channels.save, async (event, name: unknown, format: unknown, bytes: unknown) => {
    if (
      typeof name !== 'string' ||
      !formats.includes(format as ExportFormat) ||
      !Array.isArray(bytes) ||
      bytes.length > 100 * 1024 * 1024 ||
      !bytes.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
    ) {
      throw new Error('Invalid export payload.')
    }
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return false
    const result = await dialog.showSaveDialog(window, {
      defaultPath: `${basename(name).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')}.${format}`,
      filters: [{ name: String(format).toUpperCase(), extensions: [String(format)] }]
    })
    if (result.canceled || !result.filePath) return false
    await writeFile(result.filePath, Buffer.from(bytes))
    return true
  })
}

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  // Load .ico on Windows for crisp title bar & taskbar icons, .png on macOS/Linux
  const appIcon =
    process.platform === 'win32'
      ? join(__dirname, '../../resources/icon.ico')
      : join(__dirname, '../../resources/logo.png')

  const mainWindow = new BrowserWindow({
    width: Math.min(1000, screenWidth),
    height: Math.min(800, screenHeight),
    minWidth: 600,
    minHeight: 500,
    maxWidth: Math.round(screenWidth / 1.5),
    maxHeight: screenHeight,
    center: true,
    // Set resizable: false if you want to lock the window size like your old version
    resizable: true,
    icon: appIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Never navigate the privileged renderer to an external page.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== mainWindow.webContents.getURL().split('#')[0]) event.preventDefault()
  })

  const command = (value: string) => mainWindow.webContents.send(channels.command, value)
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(process.platform === 'darwin'
        ? [{ label: app.name, submenu: [{ role: 'about' as const }, { role: 'quit' as const }] }]
        : []),
      {
        label: 'File',
        submenu: [
          { label: 'Open records…', accelerator: 'CmdOrCtrl+O', click: () => command('open') },
          { label: 'Export Excel…', accelerator: 'CmdOrCtrl+S', click: () => command('export') },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
          { label: 'Find records', accelerator: 'CmdOrCtrl+F', click: () => command('search') }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'toggleDevTools' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' }
        ]
      }
    ])
  )

  // Load Vite dev server in dev, or built HTML file in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.center()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Ensures Windows taskbar groups the window under your app ID instead of default Electron
  electronApp.setAppUserModelId('com.josephadogeri.vitalrecords')

  ipcMain.handle('get-app-version', () => app.getVersion())
  registerIPC()

  createWindow()

  // Re-create window on macOS when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
