import { Router } from 'express';
import * as fs from 'fs/promises';
import { parseGameData, applyUpdates } from '../utils/parser.js';

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
 * The file is saved as PLAIN TEXT (SCS engine reads plain text natively).
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
      };
    };

    if (!filePath || !content) {
      res.status(400).json({ success: false, error: 'filePath dan content wajib diisi' });
      return;
    }

    // Apply updates using regex
    const updatedContent = applyUpdates(content, updates);

    // Write the updated plain text back to the file
    await fs.writeFile(filePath, updatedContent, 'utf-8');

    console.log(`💾 File saved: ${filePath}`);
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

export default router;
