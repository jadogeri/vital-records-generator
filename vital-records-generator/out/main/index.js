"use strict";
const electron = require("electron");
const node_path = require("node:path");
const utils = require("@electron-toolkit/utils");
function createWindow() {
  const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new electron.BrowserWindow({
    width: Math.min(1e3, screenWidth),
    height: Math.min(800, screenHeight),
    minWidth: 600,
    minHeight: 500,
    maxWidth: screenWidth / 1.5,
    maxHeight: screenHeight,
    center: true,
    // Set resizable: false if you want to lock the window size like your old version
    resizable: true,
    webPreferences: {
      preload: node_path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.center();
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(node_path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  electron.ipcMain.handle("get-app-version", () => electron.app.getVersion());
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
