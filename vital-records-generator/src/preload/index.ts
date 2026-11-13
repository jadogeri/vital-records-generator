import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { channels } from '../shared/channels'
import type { DesktopAPI } from '../shared/records'

const api: DesktopAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openFiles: () => ipcRenderer.invoke(channels.open),
  openDroppedFiles: files => ipcRenderer.invoke(channels.dropped, files.map(file => webUtils.getPathForFile(file))),
  recentFiles: () => ipcRenderer.invoke(channels.recent),
  reloadFile: path => ipcRenderer.invoke(channels.reload, path),
  removeRecentFile: path => ipcRenderer.invoke(channels.removeRecent, path),
  clearRecentFiles: () => ipcRenderer.invoke(channels.clearRecent),
  saveFile: (name, format, bytes) => ipcRenderer.invoke(channels.save, name, format, bytes),
  activity: () => ipcRenderer.invoke(channels.activity),
  logActivity: (action, detail) => ipcRenderer.invoke(channels.log, action, detail),
  onCommand: callback => {
    const handler = (_event: Electron.IpcRendererEvent, command: string) => callback(command)
    ipcRenderer.on(channels.command, handler)
    return () => { ipcRenderer.removeListener(channels.command, handler) }
  }
}
contextBridge.exposeInMainWorld('api', api)
