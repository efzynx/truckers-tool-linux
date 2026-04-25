import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const BACKEND_PORT = 8097;

function startBackend() {
  const backendPath = path.join(app.getAppPath(), 'dist-server', 'index.cjs');
  
  const execDir = path.dirname(app.getPath('exe'));
  
  backendProcess = fork(backendPath, [], {
    env: { 
      ...process.env, 
      IS_ELECTRON: 'true', 
      PORT: BACKEND_PORT.toString(),
      USER_DATA_PATH: app.getPath('userData'),
      EXEC_DIR: execDir
    },
    stdio: 'ignore'
  });

  backendProcess.on('error', (err) => {
    console.error("Backend error:", err);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// Gunakan require agar tsup meresolusi modul commonjs ini dengan benar pada runtime Electron
const electronServe = require('electron-serve');
const serve = electronServe.default || electronServe;

const loadURL = serve({ directory: path.join(__dirname, '..', 'out') });

// ...
function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build', 'id.my.ttl.TruckersToolLinux.png')
    : path.join(__dirname, '..', 'build', 'id.my.ttl.TruckersToolLinux.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Dalam pengujian dist lokal, isPackaged sering kali bernilai false meski sebenarnya dieksekusi sebagai production NODE_ENV, mari tambahkan fallback eksplisit
  const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && !process.env.NODE_ENV);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3214');
    mainWindow.webContents.openDevTools();
  } else {
    loadURL(mainWindow);
  }

  // Prevent opening external links directly in the electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle('get-server-port', () => BACKEND_PORT);
  ipcMain.on('open-external-url', (event, url) => {
    shell.openExternal(url);
  });

  // Network Handlers
  ipcMain.handle('network:checkUpdate', async () => {
    try {
      const pkgPath = path.join(app.getAppPath(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const currentVersion = pkg.version;
      const result = {
        stable: null as string | null,
        beta: null as string | null,
        alpha: null as string | null,
        currentVersion,
        stableUrl: null as string | null,
        betaUrl: null as string | null,
        alphaUrl: null as string | null,
      };

      try {
        const stableRes = await fetch(
          `https://api.github.com/repos/efzynx/truckers-tool-linux/releases/latest`,
          { headers: { 'User-Agent': `TruckersToolLinux/${currentVersion}` } }
        );
        if (stableRes.ok) {
          const data = (await stableRes.json()) as { tag_name: string; html_url: string };
          result.stable = data.tag_name.replace(/^[vV]/, '');
          result.stableUrl = data.html_url;
        }
      } catch (e) {
        console.error('Failed to fetch stable release', e);
      }

      try {
        const releasesRes = await fetch(
          `https://api.github.com/repos/efzynx/truckers-tool-linux/releases`,
          { headers: { 'User-Agent': `TruckersToolLinux/${currentVersion}` } }
        );
        if (releasesRes.ok) {
          const releases = await releasesRes.json();
          
          const betaRelease = (releases as any[]).find((r: any) => r.prerelease === true && String(r.tag_name).toLowerCase().includes('beta'));
          if (betaRelease) {
            result.beta = (betaRelease.tag_name as string).replace(/^[vV]/, '');
            result.betaUrl = betaRelease.html_url;
          }
          
          const alphaRelease = (releases as any[]).find((r: any) => r.prerelease === true && String(r.tag_name).toLowerCase().includes('alpha'));
          if (alphaRelease) {
            result.alpha = (alphaRelease.tag_name as string).replace(/^[vV]/, '');
            result.alphaUrl = alphaRelease.html_url;
          }
        }
      } catch (e) {
        console.error('Failed to fetch prerelease', e);
      }
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Update Check Failed:', err);
      return { success: false, error: 'NO_INTERNET', message: err.message };
    }
  });

  ipcMain.handle('network:sendBugReport', async (event, reportData: any) => {
    if (!reportData || !reportData.message) {
      return { success: false, message: 'Invalid payload' };
    }

    try {
      // Forward the bug report payload to the new external backend
      // Replace localhost:3000 with your actual Vercel URL later when deploying
      const externalApiUrl = process.env.EXTERNAL_API_URL || 'https://api.ttl.my.id/api/v1/report';
      
      const apiKey = reportData.apiKey || process.env.CLIENT_API_KEY || '';
      // Remove apiKey from payload before sending it
      delete reportData.apiKey;

      const response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(reportData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: 'API_ERROR', message: result.message || 'Server error' };
      }
      return { success: true, data: result.data };
    } catch (err: any) {
      return { success: false, error: 'NETWORK_ERROR', message: err.message };
    }
  });

  ipcMain.handle('system:selectDirectory', async () => {
    if (!mainWindow) return { success: false, error: 'NO_WINDOW' };
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Game Profiles Folder',
      buttonLabel: 'Select Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'CANCELED' };
    }

    // In Flatpak, the XDG Desktop Portal returns a FUSE-mounted path like
    // /run/flatpak/doc/<hash>/... or /run/user/<uid>/doc/<hash>/...
    // These are not symlinks — they are real FUSE mounts accessible inside the sandbox.
    // The backend path validator (pathValidator.ts) is configured to allow these portal paths.
    return { success: true, path: result.filePaths[0] };
  });

  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopBackend();
});
