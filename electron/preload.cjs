const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  selectVideo: () => ipcRenderer.invoke('studio:select-video'),
  getPolicies: () => ipcRenderer.invoke('studio:get-policies'),
  checkFfmpeg: () => ipcRenderer.invoke('studio:check-ffmpeg'),
  startStream: (config) => ipcRenderer.invoke('studio:start-stream', config),
  stopStream: () => ipcRenderer.invoke('studio:stop-stream'),
  onStatus: (handler) => {
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on('studio:status', wrapped);
    return () => ipcRenderer.removeListener('studio:status', wrapped);
  },
  onLog: (handler) => {
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on('studio:log', wrapped);
    return () => ipcRenderer.removeListener('studio:log', wrapped);
  }
});
