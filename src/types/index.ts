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

export interface TruckData {
  id: string;           // _nameless ID
  brand: string;        // e.g. "volvo"
  model: string;        // e.g. "fh16_2012"
  licensePlate: string;
  odometer: number;
  fuelRelative: number; // 0-1
  engineWear: number;
  transmissionWear: number;
  cabinWear: number;
  chassisWear: number;
  wheelsWear: number;
  isPlayerTruck: boolean;
}

export interface TrailerData {
  id: string;
  cargoDamage: number;
  bodyWear: number;
  isPrivate: boolean;
  sourceGarage: string | null;
}

export interface GarageData {
  id: string;
  status: number;
  vehicleCount: number;
  vehicleSlots: number;
  driverCount: number;
  driverSlots: number;
  trailers: number;
  trucks: string[];
}

export interface DriverData {
  id: string;             // e.g. "driver.127"
  hometown: string;
  currentCity: string;
  state: number;          // 1=idle, 2=on_job, 3=resting
  onDutyTimer: number;
  experiencePoints: number;
  skills: {
    adr: number;
    long_dist: number;
    heavy: number;
    fragile: number;
    urgent: number;
    mechanical: number;
  };
  garageId: string;
  assignedTruck: string;
}

export interface BankLoan {
  id: string;             // _nameless ID
  amount: number;         // remaining amount
  originalAmount: number;
  interestRate: number;   // e.g. 0.12 = 12%
  duration: number;       // months
}

export interface JobData {
  id: string;
  cargo: string;
  sourceCompany: string;
  targetCompany: string;
  cargoModelIndex: number;
  isCargoMarketJob: boolean;
  startTime: number;
  plannedDistanceKm: number;
  urgency: number;
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
  currentJob: JobData | null;
  garages: GarageData[];
  trucks: TruckData[];
  trailers: TrailerData[];
  drivers: DriverData[];
  loans: BankLoan[];
  mapDiscovery: {
    visitedCities: number;
    unlockedDealers: number;
    unlockedRecruitments: number;
  };
}

export interface SaveRequest {
  filePath: string;
  content: string;
  updates: Partial<GameData> & {
    targetGarages?: Record<string, number>;
    truckRepairAll?: boolean;
    truckRefuelAll?: boolean;
    truckRepairIds?: string[];
    truckRefuelIds?: string[];
    trailerRepairIds?: string[];
    discoverMap?: boolean;
    clearLoans?: boolean;
    economyReset?: boolean;
    customLicensePlates?: { id: string; plate: string }[];
    resetJobTime?: boolean;
  };
}

export interface SaveResponse {
  success: boolean;
  error?: string;
}

export type GameType = 'ets2' | 'ats';

export type InputMode = 'path' | 'upload';

export interface UploadedSave {
  profileName: string;
  saveName: string;
  siiPath: string;
  fullPath: string;
  isAutosave: boolean;
}

export interface UploadedProfile {
  name: string;
  saves: UploadedSave[];
  saveCount: number;
}

export interface UploadResponse {
  success: boolean;
  type: 'sii' | 'zip';
  // For SII
  content?: string;
  filePath?: string;
  encrypted?: boolean;
  // For ZIP
  profiles?: UploadedProfile[];
  saves?: UploadedSave[];
  // Common
  tempDir?: string;
  error?: string;
}

export type AppStep =
  | 'welcome'
  | 'game-select'
  | 'path-input'
  | 'profile-select'
  | 'save-select'
  | 'upload-profile-select'
  | 'upload-save-select'
  | 'backup-confirm'
  | 'dashboard';
