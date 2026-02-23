export interface Profile {
  name: string;
  path: string;
  isBackup: boolean;
  saveTime?: string;
  imagePath?: string;
}

export interface Save {
  name: string;
  path: string;
  isAutosave: boolean;
  saveTime?: string;
}

export interface ScanProfilesRequest {
  path: string;
}

export interface ScanProfilesResponse {
  success: boolean;
  profiles: Profile[];
  error?: string;
}

export interface ScanSavesRequest {
  profilePath: string;
}

export interface ScanSavesResponse {
  success: boolean;
  saves: Save[];
  error?: string;
}

export interface BackupProfileRequest {
  profilePath: string;
}

export interface BackupProfileResponse {
  success: boolean;
  backupPath?: string;
  error?: string;
}

export interface DecryptRequest {
  savePath: string;
}

export interface DecryptResponse {
  success: boolean;
  content?: string;
  filePath?: string;
  encrypted?: boolean;
  error?: string;
}

export interface GameData {
  money: number;
  experiencePoints: number;
  skills: {
    adr: number;
    long_dist: number;
    heavy: number;
    fragile: number;
    urgent: number;
    mechanical: number;
  };
}

export interface SaveRequest {
  filePath: string;
  content: string;
  updates: Partial<GameData>;
}

export interface SaveResponse {
  success: boolean;
  error?: string;
}

export type GameType = 'ets2' | 'ats';

export type AppStep =
  | 'welcome'
  | 'game-select'
  | 'path-input'
  | 'profile-select'
  | 'save-select'
  | 'backup-confirm'
  | 'dashboard';
