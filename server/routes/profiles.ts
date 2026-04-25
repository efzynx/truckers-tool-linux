/**
 * Purpose: Manage profile folders and ETS2/ATS save games operations.
 * Caller: Frontend (useApi.ts) -> Dashboard/ProfileList.
 * Dependencies: fs/promises, path, SIIDecryptor.
 * Main Functions: /scan-profiles, /backup-profile, /restore-profile, /scan-saves.
 * Side Effects: Reads and writes to the local filesystem (game folders).
 */

import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getSettings } from '../utils/settings.js';
import { isSafePath } from '../utils/pathValidator.js';
import { parseGameData, decodeProfileName } from '../utils/parser.js';
import { SIIDecryptor } from '@trucky/sii-decrypt-ts';

const router = Router();
const settings = getSettings();
const allowedBasePaths = [settings.paths.ets2, settings.paths.ats];

/**
 * Helper to find the absolute latest game.sii file in a profile's save directory.
 * Scans all subdirectories (autosave, manual saves, etc.) and picks the newest by mtime.
 */
async function findLatestSaveFile(profilePath: string): Promise<{ path: string; name: string } | null> {
  const saveDir = path.join(profilePath, 'save');
  try {
    await fs.access(saveDir);
  } catch {
    return null;
  }

  try {
    const entries = await fs.readdir(saveDir, { withFileTypes: true });
    const saveFolders = entries.filter(e => e.isDirectory());
    
    const savesWithTime = await Promise.all(
      saveFolders.map(async (folder) => {
        const gameSiiPath = path.join(saveDir, folder.name, 'game.sii');
        try {
          const stats = await fs.stat(gameSiiPath);
          return { 
            path: gameSiiPath, 
            name: folder.name, 
            mtime: stats.mtimeMs 
          };
        } catch {
          return null;
        }
      })
    );

    const validSaves = savesWithTime.filter((s): s is any => s !== null);
    if (validSaves.length === 0) return null;

    // Sort by most recent modification time
    validSaves.sort((a, b) => b.mtime - a.mtime);
    
    return {
      path: validSaves[0].path,
      name: validSaves[0].name
    };
  } catch (err) {
    console.error('Error finding latest save:', err);
    return null;
  }
}

/**
 * POST /api/compare-backup
 * Extracts comprehensive statistics from selected saves in both current profile and backup.
 */
router.post('/compare-backup', async (req, res) => {
  try {
    const { profilePath, currentSaveName, backupSaveName } = req.body as { 
      profilePath: string; 
      currentSaveName?: string;
      backupSaveName?: string; 
    };

    if (!profilePath) {
      res.status(400).json({ success: false, error: 'Profile path tidak boleh kosong' });
      return;
    }

    const backupBasePath = `${profilePath}-backup.bak`;
    const saveDirCurrent = path.join(profilePath, 'save');
    const saveDirBackup = path.join(backupBasePath, 'save');

    // 1. Resolve Current Save
    let currentSavePath = '';
    let currentDisplayName = '';
    if (currentSaveName) {
      currentSavePath = path.join(saveDirCurrent, currentSaveName, 'game.sii');
      currentDisplayName = currentSaveName;
    } else {
      const latest = await findLatestSaveFile(profilePath);
      if (!latest) return res.status(404).json({ success: false, error: 'Save utama tidak ditemukan.' });
      currentSavePath = latest.path;
      currentDisplayName = latest.name;
    }

    // 2. Resolve Backup Save
    let backupSavePath = '';
    let backupDisplayName = '';
    if (backupSaveName) {
      backupSavePath = path.join(saveDirBackup, backupSaveName, 'game.sii');
      backupDisplayName = backupSaveName;
    } else {
      const latest = await findLatestSaveFile(backupBasePath);
      if (!latest) return res.status(404).json({ success: false, error: 'Save backup tidak ditemukan.' });
      backupSavePath = latest.path;
      backupDisplayName = latest.name;
    }

    // 3. Decrypt and Parse both
    const decryptAndParse = (filePath: string) => {
      const decrypted = SIIDecryptor.decrypt(filePath, true);
      if (!decrypted.success) throw new Error(`Gagal mendekripsi file: ${filePath}`);
      return parseGameData(decrypted.string_content);
    };

    const currentData = decryptAndParse(currentSavePath);
    const backupData = decryptAndParse(backupSavePath);

    // 4. Prepare result
    const comparison = {
      saveNames: { current: currentDisplayName, backup: backupDisplayName },
      current: {
        money: currentData.money, xp: currentData.experiencePoints,
        adr: currentData.skills.adr, long_dist: currentData.skills.long_dist,
        heavy: currentData.skills.heavy, fragile: currentData.skills.fragile,
        urgent: currentData.skills.urgent, mechanical: currentData.skills.mechanical,
        trucks: currentData.trucks.length, trailers: currentData.trailers.length,
        garages: currentData.garages.length, drivers: currentData.drivers.length,
        loans: currentData.loans.length, visitedCities: currentData.mapDiscovery.visitedCities,
        unlockedDealers: currentData.mapDiscovery.unlockedDealers,
        unlockedRecruitments: currentData.mapDiscovery.unlockedRecruitments,
        currentJob: currentData.currentJob ? currentData.currentJob.cargo : 'None'
      },
      backup: {
        money: backupData.money, xp: backupData.experiencePoints,
        adr: backupData.skills.adr, long_dist: backupData.skills.long_dist,
        heavy: backupData.skills.heavy, fragile: backupData.skills.fragile,
        urgent: backupData.skills.urgent, mechanical: backupData.skills.mechanical,
        trucks: backupData.trucks.length, trailers: backupData.trailers.length,
        garages: backupData.garages.length, drivers: backupData.drivers.length,
        loans: backupData.loans.length, visitedCities: backupData.mapDiscovery.visitedCities,
        unlockedDealers: backupData.mapDiscovery.unlockedDealers,
        unlockedRecruitments: backupData.mapDiscovery.unlockedRecruitments,
        currentJob: backupData.currentJob ? backupData.currentJob.cargo : 'None'
      }
    };

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/restore-save-granular
 * Restores only a specific save folder from backup to active profile.
 */
router.post('/restore-save-granular', async (req, res) => {
  try {
    const { profilePath, activeSaveName, backupSaveName } = req.body as {
      profilePath: string;
      activeSaveName: string;
      backupSaveName: string;
    };

    if (!profilePath || !activeSaveName || !backupSaveName) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
    }

    const targetFolder = path.join(profilePath, 'save', activeSaveName);
    const sourceFolder = path.join(`${profilePath}-backup.bak`, 'save', backupSaveName);

    // 1. Remove target folder
    await fs.rm(targetFolder, { recursive: true, force: true });
    
    // 2. Copy source to target
    await fs.cp(sourceFolder, targetFolder, { recursive: true });

    console.log(`✅ Granular Restore: Copied ${backupSaveName} to ${activeSaveName}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/scan-profiles
 * Scans the provided directory path and returns a list of profile folders.
 */
router.post('/scan-profiles', async (req, res) => {
  try {
    const { path: profilesPath } = req.body as { path: string };

    if (!profilesPath) {
      res.status(400).json({ success: false, profiles: [], error: 'Path tidak boleh kosong' });
      return;
    }

    // SECURITY: Prevent Directory Traversal
    if (!isSafePath(profilesPath, allowedBasePaths)) {
      console.warn(`[SECURITY] Blocked directory traversal attempt: ${profilesPath}`);
      res.status(403).json({ success: false, profiles: [], error: 'Akses ke direktori ditutup untuk alasan keamanan.' });
      return;
    }

    // Check if path exists
    try {
      await fs.access(profilesPath);
    } catch {
      res.status(404).json({ success: false, profiles: [], error: `Path tidak ditemukan: ${profilesPath}` });
      return;
    }

    // Read directory entries
    const entries = await fs.readdir(profilesPath, { withFileTypes: true });
    const profiles = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        displayName: decodeProfileName(entry.name),
        path: path.join(profilesPath, entry.name),
        isBackup: entry.name.endsWith('-backup.bak'),
      }));

    res.json({ success: true, profiles });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, profiles: [], error: message });
  }
});

/**
 * POST /api/backup-profile
 * Creates a backup copy of the selected profile folder.
 * The backup folder is named [original-name]-backup.bak
 */
router.post('/backup-profile', async (req, res) => {
  try {
    const { profilePath } = req.body as { profilePath: string };

    if (!profilePath) {
      res.status(400).json({ success: false, error: 'Profile path tidak boleh kosong' });
      return;
    }

    // SECURITY: Prevent Directory Traversal
    if (!isSafePath(profilePath, allowedBasePaths)) {
      console.warn(`[SECURITY] Blocked directory traversal attempt on backup: ${profilePath}`);
      res.status(403).json({ success: false, error: 'Akses ditutup untuk alasan keamanan.' });
      return;
    }

    // Check if profile exists
    try {
      await fs.access(profilePath);
    } catch {
      res.status(404).json({ success: false, error: `Profile tidak ditemukan: ${profilePath}` });
      return;
    }

    const backupPath = `${profilePath}-backup.bak`;

    // Check if backup already exists
    try {
      await fs.access(backupPath);
      // If it exists, remove old backup first
      await fs.rm(backupPath, { recursive: true, force: true });
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        // Log the actual error and throw so it's caught by the main catch block
        console.error('Failed to remove existing backup folder:', err);
        throw new Error(`Gagal menghapus folder backup sistem: ${err.message}`);
      }
      // Backup doesn't exist yet — that's fine
    }

    // Copy the profile folder recursively
    await fs.cp(profilePath, backupPath, { recursive: true });

    console.log(`✅ Backup berhasil: ${backupPath}`);
    res.json({ success: true, backupPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/restore-profile
 * Restores a profile folder from its backup copy.
 * The backup folder must be named [original-name]-backup.bak
 */
router.post('/restore-profile', async (req, res) => {
  try {
    const { profilePath } = req.body as { profilePath: string };

    if (!profilePath) {
      res.status(400).json({ success: false, error: 'Profile path tidak boleh kosong' });
      return;
    }

    // SECURITY: Prevent Directory Traversal
    if (!isSafePath(profilePath, allowedBasePaths)) {
      console.warn(`[SECURITY] Blocked directory traversal attempt on restore: ${profilePath}`);
      res.status(403).json({ success: false, error: 'Akses ditutup untuk alasan keamanan.' });
      return;
    }

    const backupPath = `${profilePath}-backup.bak`;

    // Check if backup exists
    try {
      await fs.access(backupPath);
    } catch {
      res.status(404).json({ success: false, error: 'Backup tidak ditemukan untuk profil ini.' });
      return;
    }

    // 1. Remove the current (corrupted or modified) profile folder
    try {
      await fs.rm(profilePath, { recursive: true, force: true });
    } catch (err) {
      console.error('Failed to remove current profile for restore:', err);
    }

    // 2. Copy the backup back to the original location
    // We copy instead of rename so the backup folder remains available for future use
    await fs.cp(backupPath, profilePath, { recursive: true });

    console.log(`✅ Restore berhasil: ${profilePath}`);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/scan-saves
 * Scans the provided profile directory for save games.
 */
router.post('/scan-saves', async (req, res) => {
  try {
    const { profilePath } = req.body as { profilePath: string };

    if (!profilePath) {
      res.status(400).json({ success: false, saves: [], error: 'Profile path tidak boleh kosong' });
      return;
    }

    // SECURITY: Prevent Directory Traversal
    if (!isSafePath(profilePath, allowedBasePaths)) {
      console.warn(`[SECURITY] Blocked directory traversal attempt on save scan: ${profilePath}`);
      res.status(403).json({ success: false, saves: [], error: 'Akses ditutup untuk alasan keamanan.' });
      return;
    }

    const savesDir = path.join(profilePath, 'save');

    try {
      await fs.access(savesDir);
    } catch {
      // It's possible the profile has no saves yet
      res.json({ success: true, saves: [] });
      return;
    }

    const entries = await fs.readdir(savesDir, { withFileTypes: true });
    
    // Process each folder inside the save directory
    const savesPromises = entries
      .filter(entry => entry.isDirectory())
      .map(async (entry) => {
        const saveFolderPath = path.join(savesDir, entry.name);
        const gameSiiPath = path.join(saveFolderPath, 'game.sii');
        
        try {
          const stat = await fs.stat(gameSiiPath);
          return {
            name: entry.name,
            path: saveFolderPath,
            saveTime: new Date(stat.mtimeMs).toISOString(),
            isAutosave: entry.name.startsWith('autosave')
          };
        } catch {
          // game.sii not found, not a valid save folder
          return null;
        }
      });

    const resolvedSaves = await Promise.all(savesPromises);
    const validSaves = resolvedSaves.filter(s => s !== null);

    res.json({ success: true, saves: validSaves });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, saves: [], error: message });
  }
});

export default router;
