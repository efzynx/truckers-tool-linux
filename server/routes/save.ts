import { Router } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseGameData, applyUpdates } from '../utils/parser.js';
import { parseModDependencies } from '../utils/modInspector.js';
import { SIIDecryptor } from '@trucky/sii-decrypt-ts';

const router = Router();

/**
 * POST /api/parse
 * Parses the decrypted game.sii content and extracts editable values.
 */
router.post('/parse', async (req, res) => {
  try {
    const { content } = req.body as { content: string };

    if (!content) {
      res.status(400).json({ success: false, error: 'Content tidak boleh kosong' });
      return;
    }

    const gameData = parseGameData(content);
    res.json({ success: true, data: gameData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/save
 * Applies the updates to the game.sii content and overwrites the file.
 * If the original file was encrypted (ScsC), the output is re-encrypted to the same format.
 * If the original was plain text SiiNunit (e.g. autosave), it is saved as plain text.
 */
router.post('/save', async (req, res) => {
  try {
    const { filePath, content, updates } = req.body as {
      filePath: string;
      content: string;
      updates: {
        money?: number;
        experiencePoints?: number;
        skills?: {
          adr?: number;
          long_dist?: number;
          heavy?: number;
          fragile?: number;
          urgent?: number;
          mechanical?: number;
        };
        targetGarages?: Record<string, number>;
        truckRepairAll?: boolean;
        truckRefuelAll?: boolean;
        truckRepairIds?: string[];
        truckRefuelIds?: string[];
        trailerRepairAll?: boolean;
        trailerRepairIds?: string[];
        discoverMap?: boolean;
        clearLoans?: boolean;
        economyReset?: boolean;
        customLicensePlates?: { id: string; plate: string }[];
        resetJobTime?: boolean;
      };
    };

    if (!filePath || !content) {
      res.status(400).json({ success: false, error: 'filePath dan content wajib diisi' });
      return;
    }

    // Apply updates using regex
    const oldMoney = content.match(/money_account:\s*\S+/);
    console.log(`[save_debug] old money line: ${oldMoney ? oldMoney[0] : 'not found'}`);
    console.log(`[save_debug] updates received: ${JSON.stringify(updates)}`);

    const updatedContent = applyUpdates(content, updates);

    const newMoney = updatedContent.match(/money_account:\s*\S+/);
    console.log(`[save_debug] new money line: ${newMoney ? newMoney[0] : 'not found'}`);
    
    // Write the updated plain text back to the file
    // Note: User must have g_save_format "2" in their config.cfg so the game reads plain text manual saves
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    
    const writtenFile = await fs.readFile(filePath, 'utf-8');
    const writtenMoney = writtenFile.match(/money_account:\s*\S+/);
    console.log(`[save_debug] file written checked: ${writtenMoney ? writtenMoney[0] : 'not found'}`);
    
    console.log(`💾 File saved (plain text): ${filePath}`);

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Save error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/download-save
 * Applies updates to the game.sii content and returns it as a downloadable file.
 * Used for web users who uploaded their files and want to download the edited result.
 */
router.post('/download-save', async (req, res) => {
  try {
    const { content, updates } = req.body as {
      content: string;
      updates: {
        money?: number;
        experiencePoints?: number;
        skills?: {
          adr?: number;
          long_dist?: number;
          heavy?: number;
          fragile?: number;
          urgent?: number;
          mechanical?: number;
        };
        targetGarages?: Record<string, number>;
        truckRepairAll?: boolean;
        truckRefuelAll?: boolean;
        truckRepairIds?: string[];
        truckRefuelIds?: string[];
        trailerRepairAll?: boolean;
        trailerRepairIds?: string[];
        discoverMap?: boolean;
        clearLoans?: boolean;
        economyReset?: boolean;
        customLicensePlates?: { id: string; plate: string }[];
        resetJobTime?: boolean;
      };
    };

    if (!content) {
      res.status(400).json({ success: false, error: 'Content wajib diisi' });
      return;
    }

    // Apply updates using regex
    const updatedContent = applyUpdates(content, updates);

    console.log(`📥 Download prepared: game.sii (${(updatedContent.length / 1024).toFixed(1)}KB)`);

    // Send as downloadable file
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="game.sii"');
    res.send(updatedContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Download error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/save/mods
 * Membaca info.sii di folder yang sama dengan game.sii untuk melacak mod yang aktif.
 */
router.post('/save/mods', async (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };

    if (!filePath) {
      res.status(400).json({ success: false, error: 'filePath wajib diisi' });
      return;
    }

    // Ganti game.sii menjadi info.sii di folder yang sama
    const dir = path.dirname(filePath);
    const infoPath = path.join(dir, 'info.sii');

    try {
      await fs.access(infoPath);
    } catch {
      res.status(404).json({ success: false, error: 'File info.sii tidak ditemukan. Mod Inspector tidak tersedia.' });
      return;
    }

    console.log(`🔍 Inspecting mods for: ${infoPath}`);
    const result = SIIDecryptor.decrypt(infoPath, true);

    if (!result.string_content) {
      res.status(500).json({ success: false, error: 'File info.sii tidak memiliki konten teks.' });
      return;
    }

    const mods = parseModDependencies(result.string_content);
    res.json({ success: true, mods });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mod Inspector error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
