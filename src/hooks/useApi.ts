import type { GameData } from '../types';

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

export async function decryptProfile(profilePath: string) {
  const res = await fetch(`${API_BASE}/decrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profilePath }),
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
