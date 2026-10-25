
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fireball", {
  getStatus: () => ipcRenderer.invoke("fireball:get-status"),
  play: () => ipcRenderer.invoke("fireball:play"),

  settings: {
    get: () => ipcRenderer.invoke("fireball:settings:get"),
    save: value => ipcRenderer.invoke("fireball:settings:save", value),
    pickDirectory: () =>
      ipcRenderer.invoke("fireball:settings:pick-directory"),
    pickJava: () =>
      ipcRenderer.invoke("fireball:settings:pick-java"),
    detectJava: () =>
      ipcRenderer.invoke("fireball:settings:detect-java"),
    checkUpdates: () =>
      ipcRenderer.invoke("fireball:settings:checkUpdates")
  }
});
