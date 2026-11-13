import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version')
})
