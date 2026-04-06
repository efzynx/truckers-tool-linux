import type { GameData, UploadResponse } from '../types';

let API_BASE = '/api';

// Deteksi apakah sedang berjalan di dalam Electron window yang menggunakan proxy-backend API khusus
if (typeof window !== 'undefined' && 'electronAPI' in window) {
  // Dalam production Desktop (electron/main.ts), contextBridge IPC harus ditunggu
  // Namun, demi sinkronus fetch state react, fallback cepat adalah localhost port statis
  API_BASE = 'http://localhost:8097/api';
}

export async function scanProfiles(path: string) {
  const res = await fetch(`${API_BASE}/scan-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  return res.json();
}

export async function backupProfile(profilePath: string) {
  const res = await fetch(`${API_BASE}/backup-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath }),
  });
  return res.json();
}

export async function compareBackup(profilePath: string, currentSaveName?: string, backupSaveName?: string) {
  const res = await fetch(`${API_BASE}/compare-backup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath, currentSaveName, backupSaveName }),
  });
  return res.json();
}

export async function restoreSaveGranular(profilePath: string, activeSaveName: string, backupSaveName: string) {
  const res = await fetch(`${API_BASE}/restore-save-granular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath, activeSaveName, backupSaveName }),
  });
  return res.json();
}

export async function restoreProfile(profilePath: string) {
  const res = await fetch(`${API_BASE}/restore-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath }),
  });
  return res.json();
}

export async function scanSaves(profilePath: string) {
  const res = await fetch(`${API_BASE}/scan-saves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath }),
  });
  return res.json();
}

export async function decryptSave(savePath: string) {
  const res = await fetch(`${API_BASE}/decrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ savePath }),
  });
  return res.json();
}

export async function parseContent(content: string) {
  const res = await fetch(`${API_BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function getMods(filePath: string) {
  const res = await fetch(`${API_BASE}/save/mods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });
  return res.json();
}

export async function saveChanges(
  filePath: string,
  content: string,
  updates: GameData
) {
  const res = await fetch(`${API_BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, content, updates }),
  });
  return res.json();
}

export async function downloadSave(
  content: string,
  updates: GameData
) {
  const res = await fetch(`${API_BASE}/download-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, updates }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Download gagal');
  }

  // Trigger browser download
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'game.sii';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---- Upload API Functions ----

export async function uploadProfileFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload-profile`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function decryptUploadedSave(savePath: string) {
  const res = await fetch(`${API_BASE}/decrypt-uploaded`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ savePath }),
  });
  return res.json();
}

export async function cleanupUpload(tempDir: string) {
  const res = await fetch(`${API_BASE}/cleanup-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempDir }),
  });
  return res.json();
}

export async function sendSupportReport(data: { name: string; appVersion?: string; gameVersion?: string; version?: string; message: string; logs?: any }) {
  // Format the data mapping to our new Backend standard `version, type, message, os, username, appName`
  const formattedData = {
    username: data.name,
    version: data.appVersion || data.version || 'unknown',
    gameVersion: data.gameVersion || data.version || 'unknown',
    message: data.message,
    logs: data.logs,
    type: 'Bug Tracker',
    appName: 'Truckers Tool Linux'
  };

  if (typeof window !== 'undefined' && 'electronAPI' in window && (window as any).electronAPI.network) {
    // Pass the NEXT_PUBLIC variable down to the Electron IPC since the main process
    // does not automatically load .env.local variables during runtime.
    const ipcPayload = {
      ...formattedData,
      apiKey: process.env.NEXT_PUBLIC_CLIENT_API_KEY || ''
    };
    
    const response = await (window as any).electronAPI.network.sendBugReport(ipcPayload);
    if (!response.success) {
      throw new Error(response.message || 'Gagal mengirim laporan');
    }
    return response.data;
  }

  // Fallback for Web/Browser execution (NextJS directly) using NEXT_PUBLIC Env variables.
  // Production API URL is hardcoded as the default so the report always works
  // even when running from a fresh install without .env.local configured.
  const PRODUCTION_API_URL = 'https://api.ttl.my.id/api/v1';
  const PRODUCTION_API_KEY = 'KXqOVzDyKdz9iAgbhzC3oOdn';
  const externalApiBase = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_CLIENT_API_KEY || PRODUCTION_API_KEY;
  
  const res = await fetch(`${externalApiBase}/report`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(formattedData),
  });
  
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || result.error || 'Gagal mengirim laporan');
  }
  return result.data || result;
}
