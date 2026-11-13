"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version")
});
