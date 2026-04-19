import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  openExternal: (url: string) => ipcRenderer.send('open-external-url', url),
  network: {
    checkUpdate: () => ipcRenderer.invoke('network:checkUpdate'),
    sendBugReport: (data: any) => ipcRenderer.invoke('network:sendBugReport', data)
  },
  system: {
    selectDirectory: () => ipcRenderer.invoke('system:selectDirectory')
  }
});
