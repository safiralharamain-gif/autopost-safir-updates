const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('safir', {
  pickVideo: () => ipcRenderer.invoke('pick-video'),
  pickMedia: (kind) => ipcRenderer.invoke('pick-media', kind),
  probeMedia: (filePath) => ipcRenderer.invoke('probe-media', filePath),
  pickBroll: () => ipcRenderer.invoke('pick-broll'),
  pickLogo: () => ipcRenderer.invoke('pick-logo'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  pickExport: (name) => ipcRenderer.invoke('pick-export', name),
  analyzeVideo: (payload) => ipcRenderer.invoke('analyze-video', payload),
  renderVideo: (payload) => ipcRenderer.invoke('render-video', payload),
  createReels: (payload) => ipcRenderer.invoke('create-reels', payload),
  saveProject: (payload) => ipcRenderer.invoke('save-project', payload),
  openProject: () => ipcRenderer.invoke('open-project'),
  revealFile: (p) => ipcRenderer.invoke('reveal-file', p),
  onProgress: (cb) => ipcRenderer.on('engine-progress', (_, data) => cb(data))
});