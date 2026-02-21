import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SIIDecryptor } from '@trucky/sii-decrypt-ts';

const router = Router();

/**
 * Find the latest save folder inside a profile's save directory.
 * Looks at save/autosave first, then falls back to the save folder with
 * the most recent modification time.
 */
async function findLatestSave(profilePath: string): Promise<string | null> {
  const savesDir = path.join(profilePath, 'save');

  try {
    await fs.access(savesDir);
  } catch {
    return null;
  }

  // Try autosave first
  const autosavePath = path.join(savesDir, 'autosave', 'game.sii');
  try {
    await fs.access(autosavePath);
    return autosavePath;
  } catch {
    // autosave doesn't exist, look for numbered saves
  }

  // Find the latest numbered save folder
  const entries = await fs.readdir(savesDir, { withFileTypes: true });
  const saveFolders = entries.filter(e => e.isDirectory() && e.name !== 'autosave');

  if (saveFolders.length === 0) return null;

  // Check each folder's modification time
  let latestPath: string | null = null;
  let latestTime = 0;

  for (const folder of saveFolders) {
    const gameSiiPath = path.join(savesDir, folder.name, 'game.sii');
    try {
      const stat = await fs.stat(gameSiiPath);
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestPath = gameSiiPath;
      }
    } catch {
      // game.sii doesn't exist in this folder
    }
  }

  return latestPath;
}

/**
 * POST /api/decrypt
 * Decrypts the game.sii from the latest save in the selected profile.
 */
router.post('/decrypt', async (req, res) => {
  try {
    const { profilePath } = req.body as { profilePath: string };

    if (!profilePath) {
      res.status(400).json({ success: false, error: 'Profile path tidak boleh kosong' });
      return;
    }

    const gameSiiPath = await findLatestSave(profilePath);

    if (!gameSiiPath) {
      res.status(404).json({
        success: false,
        error: 'File game.sii tidak ditemukan. Pastikan profile memiliki save game.',
      });
      return;
    }

    console.log(`🔓 Decrypting: ${gameSiiPath}`);

    // Decrypt using @trucky/sii-decrypt-ts
    // Second parameter `true` returns string output
    const result = SIIDecryptor.decrypt(gameSiiPath, true);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: 'Gagal mendekripsi file game.sii. File mungkin rusak.',
      });
      return;
    }

    console.log(`✅ Decryption berhasil. Type: ${result.type}, Encrypted: ${result.encrypted}`);

    res.json({
      success: true,
      content: result.string_content,
      filePath: gameSiiPath,
      encrypted: result.encrypted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Decrypt error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
