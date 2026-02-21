import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

const router = Router();

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
    } catch {
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

export default router;
