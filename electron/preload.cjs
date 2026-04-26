const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  validateConfig: (config) => ipcRenderer.invoke('config:validate', config),
  getEmails: () => ipcRenderer.invoke('email:list'),
  markEmailAcked: (uid) => ipcRenderer.invoke('email:mark-acked', uid),
  getMonitorStatus: () => ipcRenderer.invoke('monitor:status'),
  startMonitor: () => ipcRenderer.invoke('monitor:start'),
  stopMonitor: () => ipcRenderer.invoke('monitor:stop'),
  testOpenCode: (host, port) => ipcRenderer.invoke('opencode:test', host, port),

  getLogs: () => ipcRenderer.invoke('log:list'),
  clearLogs: () => ipcRenderer.invoke('log:clear'),
  selectLogFilePath: () => ipcRenderer.invoke('dialog:save-log'),

  onNewEmail: (cb) => {
    const handler = (_event, email) => cb(email);
    ipcRenderer.on('email:new', handler);
    return () => ipcRenderer.removeListener('email:new', handler);
  },
  onMonitorError: (cb) => {
    const handler = (_event, error) => cb(error);
    ipcRenderer.on('monitor:error', handler);
    return () => ipcRenderer.removeListener('monitor:error', handler);
  },
  onNewLog: (cb) => {
    const handler = (_event, log) => cb(log);
    ipcRenderer.on('log:new', handler);
    return () => ipcRenderer.removeListener('log:new', handler);
  },
});
