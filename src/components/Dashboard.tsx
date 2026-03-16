import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { GameData } from '../types';
import ProfileEditor from './editors/ProfileEditor';
import UserEditor from './editors/UserEditor';
import TruckEditor from './editors/TruckEditor';
import GarageEditor from './editors/GarageEditor';
import DriverEditor from './editors/DriverEditor';
import TrailerEditor from './editors/TrailerEditor';
import MapEditor from './editors/MapEditor';
import { useLanguage } from '../i18n/LanguageContext';
import SupportModal from './SupportModal';
import AboutModal from './AboutModal';
import SaveConfirmModal from './SaveConfirmModal';
import type { ChangeEntry } from './SaveConfirmModal';

export type DashboardView = 'home' | 'profile' | 'user' | 'truck' | 'garage' | 'driver' | 'trailer' | 'map';

export interface UploadContext {
  isUploadMode: boolean;
  isZipUpload: boolean; // true = from ZIP (show path), false = direct SII (skip path)
  gameType: 'ets2' | 'ats' | null;
  profileName: string;
  saveName: string;
}

interface DashboardProps {
  data: GameData;
  onSave: (data: GameData) => void;
  onDownload: (data: GameData) => void;
  saving: boolean;
  downloading: boolean;
  onBack: () => void;
  profileId: string;
  uploadContext?: UploadContext;
}

/** Level calculation helpers */
const XP_TABLE: number[] = [
  200, 500, 700, 900, 1000, 1100, 1300, 1600, 1700, 2100,
  2300, 2600, 2700, 2900, 3000, 3100, 3400, 3700, 4000, 4300,
  4600, 4700, 4900, 5200, 5700, 5900, 6000, 6200, 6600, 6800,
];
const XP_AFTER_30 = 6800;
const CUMULATIVE_XP_AT_30 = 99700;

function xpToLevel(xp: number): number {
  if (xp <= 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < 30; i++) {
    cumulative += XP_TABLE[i];
    if (xp < cumulative) return i;
  }
  return 30 + Math.floor((xp - CUMULATIVE_XP_AT_30) / XP_AFTER_30);
}

function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 30) {
    let total = 0;
    for (let i = 0; i < level; i++) total += XP_TABLE[i];
    return total;
  }
  return CUMULATIVE_XP_AT_30 + (level - 30) * XP_AFTER_30;
}

/** Unique ID generator for change entries */
let _changeIdCounter = 0;
function makeChangeId() { return `chg_${++_changeIdCounter}`; }

export default function Dashboard({ data, onSave, onDownload, saving, downloading, onBack, profileId, uploadContext }: DashboardProps) {
  const [view, setView] = useState<DashboardView>('home');
  const [editableData, setEditableData] = useState<GameData>({ ...data });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const { t } = useLanguage();

  // Change tracking
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);

  // Undo stack — each entry is a snapshot of [editableData, changeLog, action-states]
  type UndoSnapshot = {
    data: GameData;
    changeLog: ChangeEntry[];
    targetGarages: Record<string, number>;
    truckRepairAll: boolean;
    truckRefuelAll: boolean;
    truckRepairIds: string[];
    truckRefuelIds: string[];
    trailerRepairAll: boolean;
    trailerRepairIds: string[];
    discoverMap: boolean;
    clearLoans: boolean;
    economyReset: boolean;
    customLicensePlates: { id: string; plate: string }[];
  };
  const undoStack = useRef<UndoSnapshot[]>([]);

  // Modal & notification state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track individual garage upgrades
  const [targetGarages, setTargetGarages] = useState<Record<string, number>>({});
  
  // Track truck actions
  const [truckRepairAll, setTruckRepairAll] = useState(false);
  const [truckRefuelAll, setTruckRefuelAll] = useState(false);
  const [truckRepairIds, setTruckRepairIds] = useState<string[]>([]);
  const [truckRefuelIds, setTruckRefuelIds] = useState<string[]>([]);

  // Track trailer actions
  const [trailerRepairAll, setTrailerRepairAll] = useState(false);
  const [trailerRepairIds, setTrailerRepairIds] = useState<string[]>([]);

  // Track map discovery
  const [discoverMap, setDiscoverMap] = useState(false);

  // Track loan action
  const [clearLoans, setClearLoans] = useState(false);

  // Track economy reset
  const [economyReset, setEconomyReset] = useState(false);

  // Track custom license plates
  const [customLicensePlates, setCustomLicensePlates] = useState<{ id: string; plate: string }[]>([]);

  // ─────────────────────────── Helpers ───────────────────────────
  /** Simpan snapshot saat ini ke undo stack sebelum perubahan */
  const pushUndo = useCallback(() => {
    undoStack.current = [
      ...undoStack.current.slice(-19), // Maks 20 level undo
      {
        data: JSON.parse(JSON.stringify(editableData)),
        changeLog: [...changeLog],
        targetGarages: { ...targetGarages },
        truckRepairAll,
        truckRefuelAll,
        truckRepairIds: [...truckRepairIds],
        truckRefuelIds: [...truckRefuelIds],
        trailerRepairAll,
        trailerRepairIds: [...trailerRepairIds],
        discoverMap,
        clearLoans,
        economyReset,
        customLicensePlates: [...customLicensePlates],
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableData, changeLog, targetGarages, truckRepairAll, truckRefuelAll, truckRepairIds, truckRefuelIds, trailerRepairAll, trailerRepairIds, discoverMap, clearLoans, economyReset, customLicensePlates]);

  /** Tambah entry ke change log */
  const addChange = useCallback((entry: Omit<ChangeEntry, 'id'>) => {
    setChangeLog(prev => [...prev, { ...entry, id: makeChangeId() }]);
  }, []);

  const handleClearLoans = () => {
    pushUndo();
    setClearLoans(true);
    setEditableData(prev => ({ ...prev, loans: [] }));
    addChange({ labelKey: 'change.loansCleared', icon: 'credit_card_off', color: 'text-red-400' });
    setHasChanges(true);
  };

  const handleEconomyReset = () => {
    pushUndo();
    setEconomyReset(true);
    addChange({ labelKey: 'Economy Reset', icon: 'currency_exchange', color: 'text-amber-400' });
    setHasChanges(true);
  };

  // ─────────────────────────── Handlers ───────────────────────────
  const handleChange = (updates: Partial<GameData>) => {
    pushUndo();
    setEditableData(prev => {
      const newData = { ...prev, ...updates };
      if (updates.skills) newData.skills = { ...prev.skills, ...updates.skills };
      return newData;
    });

    // Log perubahan spesifik
    if (updates.money !== undefined && updates.money !== editableData.money) {
      const diff = updates.money - editableData.money;
      if (diff > 0) {
        addChange({ labelKey: 'change.moneyAdded', params: { amount: diff.toLocaleString() }, icon: 'payments', color: 'text-primary' });
      } else {
        addChange({ labelKey: 'change.moneyValue', params: { amount: updates.money.toLocaleString() }, icon: 'payments', color: 'text-primary' });
      }
    }
    if (updates.experiencePoints !== undefined && updates.experiencePoints !== editableData.experiencePoints) {
      const diff = updates.experiencePoints - editableData.experiencePoints;
      if (diff > 0) {
        addChange({ labelKey: 'change.xpAdded', params: { amount: diff.toLocaleString() }, icon: 'military_tech', color: 'text-blue-400' });
      } else {
        addChange({ labelKey: 'change.xpValue', params: { amount: updates.experiencePoints.toLocaleString() }, icon: 'military_tech', color: 'text-blue-400' });
      }
    }
    if (updates.skills) {
      const allMax = Object.values({ ...editableData.skills, ...updates.skills }).every(v => v >= 6);
      if (allMax) {
        addChange({ labelKey: 'change.skillsMaxed', icon: 'star', color: 'text-yellow-400' });
      } else {
        addChange({ labelKey: 'change.customField', params: { field: 'skills' }, icon: 'psychology', color: 'text-blue-400' });
      }
    }

    setHasChanges(true);
  };

  const handleGarageChange = (cityId: string, status: number) => {
    pushUndo();
    setTargetGarages(prev => ({ ...prev, [cityId]: status }));
    addChange({ labelKey: 'change.garageChanged', params: { city: cityId }, icon: 'warehouse', color: 'text-emerald-400' });
    setHasChanges(true);
  };

  const handleGarageReplaceAll = (newTargets: Record<string, number>) => {
    pushUndo();
    setTargetGarages(newTargets);
    addChange({ labelKey: 'change.garageUnlockAll', icon: 'warehouse', color: 'text-emerald-400' });
    setHasChanges(true);
  };

  const handleTruckRepairAll = () => {
    pushUndo();
    setTruckRepairAll(true);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => ({
        ...tr,
        engineWear: 0, transmissionWear: 0, cabinWear: 0, chassisWear: 0, wheelsWear: 0,
      }))
    }));
    addChange({ labelKey: 'change.truckRepairAll', icon: 'build', color: 'text-orange-400' });
    setHasChanges(true);
  };

  const handleTruckRefuelAll = () => {
    pushUndo();
    setTruckRefuelAll(true);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => ({ ...tr, fuelRelative: 1 }))
    }));
    addChange({ labelKey: 'change.truckRefuelAll', icon: 'local_gas_station', color: 'text-orange-400' });
    setHasChanges(true);
  };

  const handleTruckRepair = (truckId: string) => {
    pushUndo();
    setTruckRepairIds(prev => prev.includes(truckId) ? prev : [...prev, truckId]);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => tr.id === truckId ? {
        ...tr,
        engineWear: 0, transmissionWear: 0, cabinWear: 0, chassisWear: 0, wheelsWear: 0,
      } : tr)
    }));
    addChange({ labelKey: 'change.truckRepair', params: { id: truckId.slice(-6) }, icon: 'build', color: 'text-orange-400' });
    setHasChanges(true);
  };

  const handleTruckRefuel = (truckId: string) => {
    pushUndo();
    setTruckRefuelIds(prev => prev.includes(truckId) ? prev : [...prev, truckId]);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => tr.id === truckId ? { ...tr, fuelRelative: 1 } : tr)
    }));
    addChange({ labelKey: 'change.truckRefuel', params: { id: truckId.slice(-6) }, icon: 'local_gas_station', color: 'text-orange-400' });
    setHasChanges(true);
  };

  const handleCustomPlate = (truckId: string, plate: string) => {
    pushUndo();
    setCustomLicensePlates(prev => {
      const existing = prev.filter(p => p.id !== truckId);
      return [...existing, { id: truckId, plate }];
    });
    setEditableData(prev => ({
      ...prev,
      // Update UI optimistically, wait for re-parsing for full country
      trucks: prev.trucks.map(tr => tr.id === truckId ? { ...tr, licensePlate: `${plate}|---` } : tr)
    }));
    addChange({ labelKey: 'Custom Plate', params: { id: truckId.slice(-6), plate }, icon: 'directions_car', color: 'text-indigo-400' });
    setHasChanges(true);
  };

  const handleTrailerRepairAll = () => {
    pushUndo();
    setTrailerRepairAll(true);
    setEditableData(prev => ({
      ...prev,
      trailers: (prev.trailers || []).map(tr => ({ ...tr, cargoDamage: 0, bodyWear: 0 }))
    }));
    addChange({ labelKey: 'change.trailerRepairAll', icon: 'build', color: 'text-violet-400' });
    setHasChanges(true);
  };

  const handleTrailerRepair = (trailerId: string) => {
    pushUndo();
    setTrailerRepairIds(prev => prev.includes(trailerId) ? prev : [...prev, trailerId]);
    setEditableData(prev => ({
      ...prev,
      trailers: (prev.trailers || []).map(tr => tr.id === trailerId ? { ...tr, cargoDamage: 0, bodyWear: 0 } : tr)
    }));
    addChange({ labelKey: 'change.trailerRepair', params: { id: trailerId.slice(-6) }, icon: 'build', color: 'text-violet-400' });
    setHasChanges(true);
  };

  const handleDiscoverMap = () => {
    pushUndo();
    setDiscoverMap(true);
    addChange({ labelKey: 'change.mapDiscovered', icon: 'map', color: 'text-cyan-400' });
    setHasChanges(true);
  };

  // ─────────────── Save: dua tahap (konfirmasi → eksekusi) ───────────────
  /** Buka modal konfirmasi */
  const handleSaveClick = useCallback(() => {
    if (!hasChanges || saving) return;
    setShowConfirmModal(true);
  }, [hasChanges, saving]);

  /** Eksekusi simpan sesungguhnya setelah dikonfirmasi */
  const handleConfirmSave = useCallback(() => {
    const payload = {
      ...editableData,
      targetGarages,
      truckRepairAll,
      truckRefuelAll,
      truckRepairIds,
      truckRefuelIds,
      trailerRepairAll,
      trailerRepairIds,
      discoverMap,
      clearLoans,
      economyReset,
      customLicensePlates,
    };
    onSave(payload);
    setShowConfirmModal(false);
    setHasChanges(false);
    setChangeLog([]);
    undoStack.current = [];
    setTruckRepairAll(false);
    setTruckRefuelAll(false);
    setTruckRepairIds([]);
    setTruckRefuelIds([]);
    setTrailerRepairAll(false);
    setTrailerRepairIds([]);
    setDiscoverMap(false);
    setClearLoans(false);
    setEconomyReset(false);
    setCustomLicensePlates([]);
    // Tampilkan notifikasi sukses
    if (successTimer.current) clearTimeout(successTimer.current);
    setShowSuccessNotif(true);
    successTimer.current = setTimeout(() => setShowSuccessNotif(false), 3000);
  }, [editableData, targetGarages, truckRepairAll, truckRefuelAll, truckRepairIds, truckRefuelIds, trailerRepairAll, trailerRepairIds, discoverMap, clearLoans, economyReset, customLicensePlates, onSave]);

  // ──────────────────────────── Undo ────────────────────────────
  const handleUndo = useCallback(() => {
    const stack = undoStack.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoStack.current = stack.slice(0, -1);
    setEditableData(prev.data);
    setChangeLog(prev.changeLog);
    setTargetGarages(prev.targetGarages);
    setTruckRepairAll(prev.truckRepairAll);
    setTruckRefuelAll(prev.truckRefuelAll);
    setTruckRepairIds(prev.truckRepairIds);
    setTruckRefuelIds(prev.truckRefuelIds);
    setTrailerRepairAll(prev.trailerRepairAll);
    setTrailerRepairIds(prev.trailerRepairIds);
    setDiscoverMap(prev.discoverMap);
    setClearLoans(prev.clearLoans);
    setEconomyReset(prev.economyReset);
    setCustomLicensePlates(prev.customLicensePlates);
    setHasChanges(prev.changeLog.length > 0 || Object.keys(prev.targetGarages).length > 0);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);

  // Quick stats
  const level = useMemo(() => {
    return xpToLevel(editableData.experiencePoints || 0);
  }, [editableData.experiencePoints]);
  const currentLevelXp = useMemo(() => xpForLevel(level), [level]);
  const nextLevelXp = useMemo(() => xpForLevel(level + 1), [level]);
  const progressPercent = useMemo(() => {
    const range = nextLevelXp - currentLevelXp;
    const current = (editableData.experiencePoints || 0) - currentLevelXp;
    return Math.min(100, Math.max(0, (current / range) * 100));
  }, [editableData.experiencePoints, level, currentLevelXp, nextLevelXp]);

  const handleDownload = () => {
    onDownload(editableData);
  };

  // Keyboard shortcut: Ctrl+S → buka konfirmasi, Ctrl+Z → undo
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveClick();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    }
  }, [handleSaveClick, handleUndo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);



  // --- Global Dashboard Layout ---
  return (
    <div className="bg-background-dark text-text-main font-body overflow-x-hidden min-h-screen relative selection:bg-primary selection:text-white pb-24 md:pb-0">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[image:var(--bg-scanlines)] opacity-40 mix-blend-overlay"></div>
      
      {/* Main Container */}
      <div className="relative flex flex-col md:flex-row min-h-screen w-full bg-background-dark shadow-2xl border-x border-white/5">
        
        {/* Navigation Sidebar (Desktop) / Header (Mobile) */}
        <header className={`sticky top-0 md:h-screen md:w-64 lg:w-80 backdrop-blur-md bg-background-dark/80 border-b md:border-b-0 md:border-r border-white/5 flex md:flex-col items-center md:items-stretch justify-between pt-4 pb-3 px-5 md:py-8 z-40 ${view !== 'home' ? 'hidden md:flex' : ''}`}>
          <div className="flex items-center justify-between mb-3 md:mb-0 w-full md:flex-col md:items-start md:gap-6">
            <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-6 w-full">
              <div className="relative">
                <div className="size-12 rounded-xl bg-surface border border-white/10 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/30 transition-colors"></div>
                  <div className="w-full h-full flex items-center justify-center bg-background-dark text-primary">
                     <span className="material-symbols-outlined text-3xl">person</span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-background-dark shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold tracking-wide text-white leading-none mb-1 uppercase truncate max-w-[150px]">{profileId || 'UNKNOWN'}</h1>
                <p className="text-xs font-mono text-primary tracking-wider uppercase">Lvl {level} • Driver</p>
              </div>
            </div>
            
            <button 
              onClick={onBack}
              className="size-10 md:hidden rounded-full bg-surface border border-white/5 flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
          <nav className="hidden md:flex flex-col gap-2 mt-8 flex-1 w-full">
            <button onClick={() => setView('home')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'home' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">speed</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">Dashboard</span>
            </button>
            <button onClick={() => setView('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'profile' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabMoney')}</span>
            </button>
            <button onClick={() => setView('user')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'user' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">psychology</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabUser')}</span>
            </button>
            <button onClick={() => setView('garage')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'garage' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">warehouse</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabGarages')}</span>
            </button>
            <button onClick={() => setView('truck')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'truck' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">local_shipping</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabTrucks')}</span>
            </button>
            <button onClick={() => setView('trailer')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'trailer' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">airport_shuttle</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('Trailers') || 'Trailers'}</span>
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'map' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">map</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('Map') || 'Map'}</span>
            </button>
            <button onClick={() => setView('driver')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'driver' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">groups</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabDriver')}</span>
            </button>
          </nav>
          
          <div className="hidden md:flex flex-col gap-2 mt-auto w-full pt-4 border-t border-white/5">
            <button 
                onClick={() => setIsAboutOpen(true)}
                className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
              >
                <div className="flex flex-row items-center gap-3">
                  <span className="material-symbols-outlined">info</span>
                  <span className="font-display tracking-widest uppercase text-xs font-bold">{t('about.title')}</span>
                </div>
            </button>

            <button 
                onClick={() => setIsSupportOpen(true)}
                className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20"
              >
                <div className="flex flex-row items-center gap-3">
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-display tracking-widest uppercase text-xs font-bold">{t('support.btnOpen')}</span>
                </div>
            </button>

            <button 
                onClick={onBack}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted hover:text-red-400 hover:bg-white/5 transition-all w-full"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.btnBack')}</span>
            </button>
          </div>
          
          {/* Mobile XP Progress */}
          <div className="md:hidden w-full h-1.5 bg-surface rounded-full overflow-hidden absolute bottom-0 left-0">
            <div 
              className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_rgba(255,140,0,0.8)] rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 flex flex-col relative z-20 min-w-0 h-[100dvh] overflow-y-auto no-scrollbar">
          {view === 'home' && (
            <div className="px-5 py-6 md:p-10 flex flex-col gap-6 md:gap-10 pb-24 md:pb-10 w-full animate-fade-in">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cash Card */}
            <button onClick={() => setView('profile')} className="relative bg-surface rounded-2xl p-4 border border-white/5 hover:border-primary/50 transition-all duration-300 group text-left overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:shadow-neon-sm transition-shadow">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[16px] group-hover:text-primary transition-colors">arrow_outward</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Balance</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight group-hover:text-primary transition-colors truncate">
                  €{(editableData.money / 1000).toFixed(0)}k
                </p>
              </div>
            </button>

            {/* XP Card */}
            <button onClick={() => setView('user')} className="relative bg-surface rounded-2xl p-4 border border-white/5 hover:border-blue-400/50 transition-all duration-300 group text-left overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:shadow-[0_0_5px_rgba(96,165,250,0.4)] transition-shadow">
                  <span className="material-symbols-outlined text-[20px]">military_tech</span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[16px] group-hover:text-blue-400 transition-colors">arrow_outward</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Level {level}</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                  {(editableData.experiencePoints / 1000).toFixed(1)}k XP
                </p>
                {/* Level Progress Bar */}
                <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </button>

            {/* Trucks Card */}
            <button onClick={() => setView('truck')} className="relative bg-surface rounded-2xl p-4 border border-white/5 hover:border-orange-400/50 transition-all duration-300 group text-left overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:shadow-[0_0_5px_rgba(251,146,60,0.4)] transition-shadow">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[16px] group-hover:text-orange-400 transition-colors">arrow_outward</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-0.5">{t('dashboard.statTrucks')}</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight group-hover:text-orange-400 transition-colors">
                  {editableData.trucks.length}
                </p>
              </div>
            </button>

            {/* Garages Card */}
            <button onClick={() => setView('garage')} className="relative bg-surface rounded-2xl p-4 border border-white/5 hover:border-emerald-400/50 transition-all duration-300 group text-left overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:shadow-[0_0_5px_rgba(52,211,153,0.4)] transition-shadow">
                  <span className="material-symbols-outlined text-[20px]">warehouse</span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[16px] group-hover:text-emerald-400 transition-colors">arrow_outward</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-0.5">{t('dashboard.statGarages')}</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                  {editableData.garages.filter(g => g.status > 0).length}
                </p>
              </div>
            </button>
          </div>

          {/* Quick Actions Label */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-xs uppercase font-display font-bold tracking-widest text-text-main">System Controls</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          {/* Tools Grid (2x2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleChange({ money: (editableData.money || 0) + 50000 })} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-primary/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-primary/50 group-hover:shadow-neon-sm transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-primary transition-colors">payments</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">INJECT €50K</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-primary/80 transition-colors">Quick Add Funds</span>
              </div>
            </button>

            <button onClick={() => handleChange({ money: Math.max(0, editableData.money) })} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-primary/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-primary/50 group-hover:shadow-neon-sm transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-primary transition-colors">credit_card_off</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">CLEAR DEBT</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-primary/80 transition-colors">Pay Bank Loans</span>
              </div>
            </button>

            <button onClick={() => handleChange({ experiencePoints: (editableData.experiencePoints || 0) + 10000 })} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-blue-400/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-blue-400 transition-colors">star</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">ADD 10K XP</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-blue-400/80 transition-colors">Level Up Boost</span>
              </div>
            </button>

            <button onClick={() => handleChange({ skills: { adr:6, long_dist:6, heavy:6, fragile:6, urgent:6, mechanical:6 } })} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-blue-400/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-blue-500/50 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-blue-400 transition-colors">military_tech</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">MAX SKILLS</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-blue-400/80 transition-colors">Unlock All Perks</span>
              </div>
            </button>

            <button onClick={handleEconomyReset} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-amber-400/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-amber-500/50 group-hover:shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-amber-400 transition-colors">currency_exchange</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">ECONOMY RESET</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-amber-400/80 transition-colors">Refresh Job Market</span>
              </div>
            </button>

            {/* Download Button */}
            <button onClick={handleDownload} disabled={downloading} className="group bg-surface hover:bg-[#1a1f2b] active:scale-[0.98] border border-white/5 hover:border-emerald-400/40 rounded-2xl p-4 flex flex-row items-center justify-start gap-4 transition-all duration-200 relative shadow-lg cursor-pointer sm:col-span-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <div className="size-12 shrink-0 rounded-full bg-background-dark border border-white/10 flex items-center justify-center shadow-inner group-hover:border-emerald-500/50 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300">
                <span className="material-symbols-outlined text-2xl text-text-main group-hover:text-emerald-400 transition-colors">{downloading ? 'sync' : 'download'}</span>
              </div>
              <div className="flex flex-col items-start z-10 text-left">
                <span className="font-display font-bold text-sm tracking-wide text-text-main group-hover:text-white">{downloading ? t('dashboard.btnDownloading') : t('dashboard.btnDownload')}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono group-hover:text-emerald-400/80 transition-colors">Export game.sii</span>
              </div>
            </button>
          </div>

          {/* Download Path Instructions — only for ZIP uploads */}
          {uploadContext?.isUploadMode && uploadContext.isZipUpload && (
            <div className="mt-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">info</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-bold text-emerald-400 uppercase tracking-wider mb-2">{t('dashboard.placementInstruction')}</p>
                  <p className="text-xs text-text-muted leading-relaxed mb-2">
                    {t('dashboard.placementDesc')}<span className="text-white font-mono">game.sii</span>{t('dashboard.placementDesc2')}
                  </p>
                  <div className="bg-background-dark/80 rounded-lg p-3 border border-white/5 overflow-x-auto">
                    <code className="text-[11px] font-mono text-emerald-300 whitespace-nowrap">
                      ~/Documents/{uploadContext.gameType === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator'}/profiles/<span className="text-primary">{uploadContext.profileName}</span>/save/<span className="text-primary">{uploadContext.saveName}</span>/
                    </code>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-amber-400 text-[14px]">warning</span>
                    <p className="text-[10px] text-amber-400/80 font-mono">{t('dashboard.placementWarning')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Context Info */}
          <div className="mt-2 p-4 rounded-xl border border-white/5 bg-gradient-to-r from-surface to-background-dark flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-widest mb-1">Current Session</span>
              <span className="text-sm font-mono text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,140,0,0.8)]"></span>
                Active Connection
              </span>
            </div>
          </div>
        </div>
      )}
          {view === 'profile' && (
             <ProfileEditor 
               data={editableData} 
               onChange={handleChange} 
               onBack={() => setView('home')} 
               hasChanges={hasChanges}
               onClearLoans={handleClearLoans}
             />
          )}
          {view === 'user' && (
             <UserEditor 
               data={editableData} 
               onChange={handleChange} 
               onBack={() => setView('home')} 
               hasChanges={hasChanges}
             />
          )}
          {view === 'garage' && (
             <div className="flex-1 flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 w-full z-10 overflow-y-auto no-scrollbar animate-fade-in">
               <header className="fixed top-0 left-0 right-0 z-40 glass-panel">
                 <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
                   <button onClick={() => setView('home')} className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                     <span className="material-symbols-outlined text-3xl">chevron_left</span>
                   </button>
                   <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('dashboard.tabGarages')}</h1>
                   <div className="w-10"></div>
                 </div>
               </header>
               <div className="w-full max-w-7xl mx-auto">
                 <GarageEditor 
                   garages={editableData.garages || []}
                   trucks={editableData.trucks || []}
                   targetGarages={targetGarages}
                   onChange={handleGarageChange}
                   onReplaceTargets={handleGarageReplaceAll}
                 />
               </div>

             </div>
          )}
          {view === 'truck' && (
             <div className="flex-1 flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 w-full z-10 overflow-y-auto no-scrollbar animate-fade-in">
               <header className="fixed top-0 left-0 right-0 z-40 glass-panel">
                 <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
                   <button onClick={() => setView('home')} className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                     <span className="material-symbols-outlined text-3xl">chevron_left</span>
                   </button>
                   <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('dashboard.tabTrucks')}</h1>
                   <div className="w-10"></div>
                 </div>
               </header>
               <div className="w-full max-w-7xl mx-auto">
                 <TruckEditor 
                   trucks={editableData.trucks || []}
                   onRepairAll={handleTruckRepairAll}
                   onRefuelAll={handleTruckRefuelAll}
                   onRepairTruck={handleTruckRepair}
                   onRefuelTruck={handleTruckRefuel}
                   onCustomPlate={handleCustomPlate}
                 />
               </div>

             </div>
          )}
          {view === 'driver' && (
            <DriverEditor
              data={editableData}
              onBack={() => setView('home')}
            />
          )}
        </main>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-background-dark border-t border-[#3a3127] px-4 pb-6 pt-3 backdrop-blur-xl bg-opacity-90 z-50">
          <div className="flex gap-1">
            <button onClick={() => setView('home')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'home' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'home' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">speed</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">Dashboard</p>
            </button>
            
            <button onClick={() => setView('profile')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'profile' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'profile' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('dashboard.tabMoney')}</p>
            </button>
            
            <button onClick={() => setView('user')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'user' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'user' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">psychology</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('dashboard.tabUser')}</p>
            </button>
            
            <button onClick={() => setView('garage')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'garage' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'garage' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">warehouse</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('dashboard.tabGarages')}</p>
            </button>
            
            <button onClick={() => setView('truck')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'truck' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'truck' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">local_shipping</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('dashboard.tabTrucks')}</p>
            </button>

            <button onClick={() => setView('trailer')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'trailer' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'trailer' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">airport_shuttle</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('Trailers') || 'Trailers'}</p>
            </button>

            <button onClick={() => setView('map')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'map' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'map' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">map</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('Map') || 'Map'}</p>
            </button>

            <button onClick={() => setView('driver')} className={`flex flex-1 flex-col items-center justify-end gap-1 rounded-full transition-colors cursor-pointer ${view === 'driver' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
              <div className={`flex h-8 items-center justify-center rounded-full px-3 ${view === 'driver' ? 'shadow-[0_0_15px_rgba(255,140,0,0.3)] bg-primary/10' : ''}`}>
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">{t('dashboard.tabDriver')}</p>
            </button>
          </div>
        </div>
      </div>

      {view === 'trailer' && (
         <div className="absolute inset-x-0 top-0 bottom-0 md:left-64 lg:left-80 z-40 bg-background-dark animate-fade-in flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 overflow-y-auto no-scrollbar">
           <header className="fixed top-0 left-0 right-0 md:left-64 lg:left-80 z-40 glass-panel">
             <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
               <button onClick={() => setView('home')} className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                 <span className="material-symbols-outlined text-3xl">chevron_left</span>
               </button>
               <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('Trailers') || 'Trailers'}</h1>
               <div className="w-10"></div>
             </div>
           </header>
           <div className="w-full max-w-7xl mx-auto flex-1">
             <TrailerEditor 
               trailers={editableData.trailers || []}
               onRepairAll={handleTrailerRepairAll}
               onRepairTrailer={handleTrailerRepair}
             />
           </div>
         </div>
      )}

      {view === 'map' && (
         <div className="absolute inset-x-0 top-0 bottom-0 md:left-64 lg:left-80 z-40 bg-background-dark animate-fade-in flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 overflow-y-auto no-scrollbar">
           <header className="fixed top-0 left-0 right-0 md:left-64 lg:left-80 z-40 glass-panel">
             <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
               <button onClick={() => setView('home')} className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer">
                 <span className="material-symbols-outlined text-3xl">chevron_left</span>
               </button>
               <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('Map') || 'Map'}</h1>
               <div className="w-10"></div>
             </div>
           </header>
           <div className="w-full max-w-7xl mx-auto flex-1">
             <MapEditor 
               data={editableData}
               onDiscoverMap={handleDiscoverMap}
             />
           </div>
         </div>
      )}

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}

      {/* Save Confirmation Modal */}
      <SaveConfirmModal
        isOpen={showConfirmModal}
        changeLog={changeLog}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
        saving={saving}
      />

      {/* Success Toast Notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] transition-all duration-500 ${
          showSuccessNotif
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md shadow-xl">
          <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
          <span className="text-sm font-display font-bold text-emerald-300 uppercase tracking-wider">
            {t('notif.saveSuccess')}
          </span>
        </div>
      </div>

      {/* Floating Action Group: Undo + Save — kanan bawah */}
      {hasChanges && (
        <div className="fixed bottom-8 right-6 md:right-10 z-50 flex flex-col items-center gap-3">
          {/* Undo Button — di atas tombol Save, lingkaran kecil */}
          {undoStack.current.length > 0 && (
            <div className="relative">
              <button
                onClick={handleUndo}
                title={t('undo.tooltip') as string}
                className="relative flex items-center justify-center w-12 h-12 bg-surface border border-white/10 text-text-muted hover:text-white hover:border-white/30 hover:bg-white/5 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
              >
                <span className="material-symbols-outlined text-[22px]">undo</span>
                {undoStack.current.length > 1 && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-mono font-bold bg-white/20 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {undoStack.current.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Save Button */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full blur animate-pulse opacity-50"></div>
            <button onClick={handleSaveClick} disabled={saving} className="relative flex items-center justify-center w-16 h-16 bg-primary text-black rounded-full shadow-neon hover:shadow-neon-intense hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer">
              <span className={`material-symbols-outlined text-3xl ${saving ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                {saving ? 'sync' : 'save'}
              </span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
