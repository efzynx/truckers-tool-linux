/**
 * Settings Loader — Reads settings.yml and provides typed configuration.
 * Falls back to sensible defaults when settings.yml is missing.
 */
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

export interface AppSettings {
  app: {
    name: string;
    port_frontend: number;
    port_backend: number;
  };
  admin: {
    email: string;
    contact: string;
  };
  paths: {
    ets2: string;
    ats: string;
  };
  upload: {
    max_file_size_mb: number;
    max_extracted_size_mb: number;
    temp_dir: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  app: {
    name: 'Truckers Tool Linux',
    port_frontend: 3214,
    port_backend: 8097,
  },
  admin: {
    email: 'admin@example.com',
    contact: 'Admin',
  },
  paths: {
    ets2: '~/Documents/Euro Truck Simulator 2/profiles/',
    ats: '~/Documents/American Truck Simulator/profiles/',
  },
  upload: {
    max_file_size_mb: 50,
    max_extracted_size_mb: 100,
    temp_dir: '/tmp/truckers-tool-uploads',
  },
};

let _settings: AppSettings | null = null;

/**
 * Load settings from settings.yml (project root).
 * Falls back to defaults if file doesn't exist.
 */
export function loadSettings(): AppSettings {
  if (_settings) return _settings;

  let settingsPath = path.resolve(process.cwd(), 'settings.yml');

  const userDataPath = process.env.USER_DATA_PATH;
  const execDir = process.env.EXEC_DIR;
  
  if (userDataPath) {
    const portablePath = path.join(process.cwd(), 'data', 'settings.yml');
    const execSettingsPath = execDir ? path.join(execDir, 'settings.yml') : null;
    const userConfigPath = path.join(userDataPath, 'settings.yml');

    if (fs.existsSync(portablePath)) {
      settingsPath = portablePath;
    } else if (execSettingsPath && fs.existsSync(execSettingsPath)) {
      // Prioritaskan file settings di sebelah executable/AppImage (Resources dir)
      settingsPath = execSettingsPath;
    } else if (fs.existsSync(userConfigPath)) {
      settingsPath = userConfigPath;
    } else if (!fs.existsSync(settingsPath)) {
      // Jika di project root juga tidak ada, jadikan user config path sebagai default path untuk log peringatan
      settingsPath = userConfigPath;
    }
  }

  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      const parsed = yaml.load(raw) as Partial<AppSettings>;

      // Deep merge with defaults
      _settings = {
        app: { ...DEFAULT_SETTINGS.app, ...(parsed?.app || {}) },
        admin: { ...DEFAULT_SETTINGS.admin, ...(parsed?.admin || {}) },
        paths: { ...DEFAULT_SETTINGS.paths, ...(parsed?.paths || {}) },
        upload: { ...DEFAULT_SETTINGS.upload, ...(parsed?.upload || {}) },
      };

      console.log(`⚙️  Settings loaded from ${settingsPath}`);
    } else {
      console.warn(`⚠️  settings.yml not found. Using defaults. Create one with: cp settings.example.yml settings.yml`);
      _settings = { ...DEFAULT_SETTINGS };
    }
  } catch (error) {
    console.error(`❌ Error reading settings.yml:`, error);
    _settings = { ...DEFAULT_SETTINGS };
  }

  return _settings;
}

/**
 * Get settings (cached). Use this everywhere.
 */
export function getSettings(): AppSettings {
  return loadSettings();
}
