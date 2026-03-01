/**
 * Upload Route — Handles file upload for SII and ZIP files.
 * Supports both direct SII file upload and ZIP archive containing profile/save structure.
 */
import { Router } from 'express';
import multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { SIIDecryptor } from '@trucky/sii-decrypt-ts';
import {
  validateFileExtension,
  validateFileSize,
  validateZipContents,
  discoverSavesInZip,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
} from '../utils/uploadValidator.js';

const router = Router();

// ---- Multer Configuration ----
const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file tidak diizinkan: ${ext}. Hanya ${ALLOWED_EXTENSIONS.join(', ')} yang diterima.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ---- Temp directory management ----
async function createTempDir(): Promise<string> {
  const tmpBase = path.join(os.tmpdir(), 'truckers-tool-uploads');
  await fs.mkdir(tmpBase, { recursive: true });
  const tmpDir = await fs.mkdtemp(path.join(tmpBase, 'upload-'));
  return tmpDir;
}

async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temp dir: ${dirPath}`);
  } catch {
    console.warn(`⚠️ Failed to cleanup temp dir: ${dirPath}`);
  }
}

/**
 * POST /api/upload-profile
 * Upload a SII or ZIP file and discover profiles/saves within it.
 * 
 * Returns:
 * - For SII: directly decrypted content + parsed data
 * - For ZIP: list of discovered saves with temp paths
 */
router.post('/upload-profile', upload.single('file'), async (req, res) => {
  let tempDir: string | null = null;

  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Tidak ada file yang diupload.' });
      return;
    }

    // Double-check extension validation (defense in depth)
    const extValidation = validateFileExtension(file.originalname);
    if (!extValidation.valid) {
      res.status(400).json({ success: false, error: extValidation.error });
      return;
    }

    // Double-check size validation
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      res.status(400).json({ success: false, error: sizeValidation.error });
      return;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    console.log(`📤 Upload received: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB, type: ${ext})`);

    // ---- Handle SII file directly ----
    if (ext === '.sii') {
      tempDir = await createTempDir();
      const tempFilePath = path.join(tempDir, 'game.sii');
      await fs.writeFile(tempFilePath, file.buffer);

      // Decrypt using SIIDecryptor
      const result = SIIDecryptor.decrypt(tempFilePath, true);

      if (!result.success) {
        await cleanupTempDir(tempDir);
        res.status(400).json({
          success: false,
          error: 'Gagal mendekripsi file SII. File mungkin rusak atau bukan file save game yang valid.',
        });
        return;
      }

      console.log(`✅ SII decrypted successfully. Type: ${result.type}`);

      res.json({
        success: true,
        type: 'sii',
        content: result.string_content,
        filePath: tempFilePath,
        encrypted: result.encrypted,
        tempDir, // Client will use this for cleanup later
      });
      return;
    }

    // ---- Handle ZIP file ----
    if (ext === '.zip') {
      // Validate ZIP contents for security
      const zipValidation = validateZipContents(file.buffer);
      if (!zipValidation.valid) {
        res.status(400).json({ success: false, error: zipValidation.error });
        return;
      }

      // Discover saves within the ZIP
      const discoveredSaves = discoverSavesInZip(file.buffer);

      if (discoveredSaves.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Tidak ditemukan file game.sii di dalam ZIP. Pastikan ZIP berisi folder save game yang valid.',
        });
        return;
      }

      // Extract ZIP to temp directory
      tempDir = await createTempDir();
      const zip = new AdmZip(file.buffer);
      zip.extractAllTo(tempDir, true);

      console.log(`📦 ZIP extracted to ${tempDir}. Found ${discoveredSaves.length} save(s).`);

      // Build response with discovered saves grouped by profile
      const saves = discoveredSaves.map((save) => ({
        profileName: save.profileName,
        saveName: save.saveName,
        siiPath: save.siiPath,
        fullPath: path.join(tempDir!, save.siiPath).replace(/game\.sii$/i, ''),
        isAutosave: save.saveName.startsWith('autosave'),
      }));

      // Group saves by profile
      const profileMap: Record<string, typeof saves> = {};
      for (const save of saves) {
        if (!profileMap[save.profileName]) {
          profileMap[save.profileName] = [];
        }
        profileMap[save.profileName].push(save);
      }

      const profiles = Object.entries(profileMap).map(([name, profileSaves]) => ({
        name,
        saves: profileSaves,
        saveCount: profileSaves.length,
      }));

      console.log(`📦 ZIP extracted to ${tempDir}. Found ${profiles.length} profile(s), ${discoveredSaves.length} save(s).`);

      res.json({
        success: true,
        type: 'zip',
        profiles,
        saves,
        tempDir,
      });
      return;
    }

    res.status(400).json({ success: false, error: 'Tipe file tidak didukung.' });
  } catch (error) {
    if (tempDir) await cleanupTempDir(tempDir);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Upload error:', message);
    
    // Multer-specific errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: `Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        });
        return;
      }
    }
    
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/decrypt-uploaded
 * Decrypt a game.sii from the uploaded/extracted temp path.
 */
router.post('/decrypt-uploaded', async (req, res) => {
  try {
    const { savePath } = req.body as { savePath: string };

    if (!savePath) {
      res.status(400).json({ success: false, error: 'Save path tidak boleh kosong.' });
      return;
    }

    // Security: ensure the path is within the temp directory
    const resolved = path.resolve(savePath);
    const tmpBase = path.join(os.tmpdir(), 'truckers-tool-uploads');
    if (!resolved.startsWith(tmpBase)) {
      res.status(403).json({
        success: false,
        error: 'Akses ditolak: path di luar direktori upload.',
      });
      return;
    }

    const gameSiiPath = path.join(savePath, 'game.sii');

    try {
      await fs.access(gameSiiPath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'File game.sii tidak ditemukan pada path tersebut.',
      });
      return;
    }

    console.log(`🔓 Decrypting uploaded: ${gameSiiPath}`);
    const result = SIIDecryptor.decrypt(gameSiiPath, true);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: 'Gagal mendekripsi file game.sii. File mungkin rusak.',
      });
      return;
    }

    console.log(`✅ Uploaded file decrypted. Type: ${result.type}`);

    res.json({
      success: true,
      content: result.string_content,
      filePath: gameSiiPath,
      encrypted: result.encrypted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Decrypt uploaded error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/cleanup-upload
 * Clean up temp directory after user is done editing.
 */
router.post('/cleanup-upload', async (req, res) => {
  try {
    const { tempDir } = req.body as { tempDir: string };

    if (!tempDir) {
      res.status(400).json({ success: false, error: 'tempDir tidak boleh kosong.' });
      return;
    }

    // Security: ensure the path is within our temp directory
    const resolved = path.resolve(tempDir);
    const tmpBase = path.join(os.tmpdir(), 'truckers-tool-uploads');
    if (!resolved.startsWith(tmpBase)) {
      res.status(403).json({
        success: false,
        error: 'Akses ditolak: path di luar direktori upload.',
      });
      return;
    }

    await cleanupTempDir(resolved);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
