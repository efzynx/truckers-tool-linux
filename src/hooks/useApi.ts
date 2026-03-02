import type { GameData, UploadResponse } from '../types';

const API_BASE = '/api';

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

export async function sendSupportReport(data: { name: string; version: string; message: string; }) {
  const res = await fetch(`${API_BASE}/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Gagal mengirim laporan');
  }
  return result;
}
