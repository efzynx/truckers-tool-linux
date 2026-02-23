import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SIIDecryptor } from '@trucky/sii-decrypt-ts';

const router = Router();

/**
 * POST /api/decrypt
 * Decrypts the game.sii from the selected save folder.
 */
router.post('/decrypt', async (req, res) => {
  try {
    const { savePath } = req.body as { savePath: string };

    if (!savePath) {
      res.status(400).json({ success: false, error: 'Save path tidak boleh kosong' });
      return;
    }

    const gameSiiPath = path.join(savePath, 'game.sii');

    try {
      await fs.access(gameSiiPath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'File game.sii tidak ditemukan pada folder save tersebut. File mungkin rusak atau tidak ada.',
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
