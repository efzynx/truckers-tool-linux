/**
 * Upload Validator — Security utilities for file upload validation.
 * All validation runs on the backend to prevent client-side manipulation.
 */
import AdmZip from 'adm-zip';
import * as path from 'path';
import { getSettings } from './settings.js';

// ---- Dynamic Constants (from settings.yml) ----
const settings = getSettings();
export const MAX_FILE_SIZE = settings.upload.max_file_size_mb * 1024 * 1024;
export const MAX_EXTRACTED_SIZE = settings.upload.max_extracted_size_mb * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['.sii', '.zip'];
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.csh', '.ksh', '.py', '.pl', '.rb',
  '.js', '.vbs', '.wsf', '.ps1', '.jar', '.dll', '.so',
  '.dylib', '.app', '.deb', '.rpm',
];

// ---- Validation Results ----
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file extension against whitelist.
 */
export function validateFileExtension(filename: string): ValidationResult {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Tipe file tidak diizinkan: ${ext}. Hanya file ${ALLOWED_EXTENSIONS.join(', ')} yang diterima.`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size.
 */
export function validateFileSize(sizeBytes: number): ValidationResult {
  if (sizeBytes > MAX_FILE_SIZE) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran file terlalu besar: ${sizeMB}MB. Maksimum ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }
  return { valid: true };
}

/**
 * Validate ZIP contents for security threats:
 * - Path traversal (../ in entry names)
 * - Symlinks
 * - Executable/dangerous files
 * - Zip bomb (total extracted size > MAX_EXTRACTED_SIZE)
 */
export function validateZipContents(zipBuffer: Buffer): ValidationResult {
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      return { valid: false, error: 'File ZIP kosong atau rusak.' };
    }

    let totalExtractedSize = 0;

    for (const entry of entries) {
      const entryName = entry.entryName;

      // Check path traversal
      const normalized = path.normalize(entryName);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return {
          valid: false,
          error: `File ZIP mengandung path berbahaya: ${entryName}`,
        };
      }

      // Check for symlinks (attr check)
      // In ZIP format, external attributes can indicate symlinks
      const externalAttr = entry.header.attr;
      // Unix symlink: (externalAttr >> 16) & 0xA000
      if (((externalAttr >> 16) & 0xF000) === 0xA000) {
        return {
          valid: false,
          error: `File ZIP mengandung symlink yang tidak diizinkan: ${entryName}`,
        };
      }

      // Check dangerous file extensions
      if (!entry.isDirectory) {
        const ext = path.extname(entryName).toLowerCase();
        if (DANGEROUS_EXTENSIONS.includes(ext)) {
          return {
            valid: false,
            error: `File ZIP mengandung file berbahaya: ${entryName}`,
          };
        }

        // Accumulate extracted size for zip bomb check
        totalExtractedSize += entry.header.size;
        if (totalExtractedSize > MAX_EXTRACTED_SIZE) {
          return {
            valid: false,
            error: `Total ukuran file setelah extract melebihi batas ${MAX_EXTRACTED_SIZE / (1024 * 1024)}MB. Kemungkinan zip bomb.`,
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Gagal membaca file ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Extract SII files from a ZIP buffer.
 * Returns a map of relative paths to their content buffers.
 */
export function extractSiiFromZip(zipBuffer: Buffer): Map<string, Buffer> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const siiFiles = new Map<string, Buffer>();

  for (const entry of entries) {
    if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith('.sii')) {
      const data = entry.getData();
      siiFiles.set(entry.entryName, data);
    }
  }

  return siiFiles;
}

/**
 * Find game.sii files within ZIP structure and determine profile/save hierarchy.
 */
export interface DiscoveredSave {
  profileName: string;
  saveName: string;
  siiPath: string; // relative path inside ZIP
  siiBuffer: Buffer;
}

export function discoverSavesInZip(zipBuffer: Buffer): DiscoveredSave[] {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const saves: DiscoveredSave[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.toLowerCase();
    
    // Look for game.sii files
    if (!name.endsWith('game.sii')) continue;

    const parts = entry.entryName.split('/').filter(Boolean);
    
    // Find the 'save' directory in the path as an anchor point.
    // Expected structure: .../PROFILE_NAME/save/SAVE_NAME/game.sii
    // The profile name is the folder BEFORE 'save', the save name is AFTER 'save'.
    
    let profileName = 'uploaded';
    let saveName = 'unknown';

    const saveIdx = parts.findIndex(p => p.toLowerCase() === 'save');
    
    if (saveIdx >= 0) {
      // Profile is the folder right before 'save'
      if (saveIdx > 0) {
        profileName = parts[saveIdx - 1];
      }
      // Save name is the folder right after 'save'
      if (saveIdx + 1 < parts.length - 1) {
        saveName = parts[saveIdx + 1];
      }
    } else {
      // No 'save' directory found — fallback to simple path parsing
      if (parts.length >= 3) {
        profileName = parts[parts.length - 3];
        saveName = parts[parts.length - 2];
      } else if (parts.length === 2) {
        saveName = parts[0];
      } else if (parts.length === 1) {
        saveName = 'root';
      }
    }

    saves.push({
      profileName,
      saveName,
      siiPath: entry.entryName,
      siiBuffer: entry.getData(),
    });
  }

  return saves;
}
