import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const mainWindow = new BrowserWindow({
    width: Math.min(1000, screenWidth),
    height: Math.min(800, screenHeight),
    minWidth: 600,
    minHeight: 500,
    maxWidth: screenWidth / 1.5,
    maxHeight: screenHeight,
    center: true,
    // Set resizable: false if you want to lock the window size like your old version
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Load Vite dev server in dev, or built HTML file in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.center()
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-app-version', () => app.getVersion())

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
