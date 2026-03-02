import { useState, useMemo } from 'react';
import type { GameData } from '../types';
import ProfileEditor from './editors/ProfileEditor';
import UserEditor from './editors/UserEditor';
import TruckEditor from './editors/TruckEditor';
import GarageEditor from './editors/GarageEditor';
import { useLanguage } from '../i18n/LanguageContext';
import SupportModal from './SupportModal';

export type DashboardView = 'home' | 'profile' | 'user' | 'truck' | 'garage';

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

export default function Dashboard({ data, onSave, onDownload, saving, downloading, onBack, profileId, uploadContext }: DashboardProps) {
  const [view, setView] = useState<DashboardView>('home');
  const [editableData, setEditableData] = useState<GameData>({ ...data });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { t } = useLanguage();
  
  // Track individual garage upgrades
  const [targetGarages, setTargetGarages] = useState<Record<string, number>>({});
  
  // Track truck actions
  const [truckRepairAll, setTruckRepairAll] = useState(false);
  const [truckRefuelAll, setTruckRefuelAll] = useState(false);
  const [truckRepairIds, setTruckRepairIds] = useState<string[]>([]);
  const [truckRefuelIds, setTruckRefuelIds] = useState<string[]>([]);

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

  const handleChange = (updates: Partial<GameData>) => {
    setEditableData(prev => {
      const newData = { ...prev, ...updates };
      if (updates.skills) newData.skills = { ...prev.skills, ...updates.skills };
      return newData;
    });
    setHasChanges(true);
  };
  
  const handleGarageChange = (cityId: string, status: number) => {
    setTargetGarages(prev => ({ ...prev, [cityId]: status }));
    setHasChanges(true);
  };
  
  const handleGarageReplaceAll = (newTargets: Record<string, number>) => {
    setTargetGarages(newTargets);
    setHasChanges(true);
  };
  
  const handleTruckRepairAll = () => {
    setTruckRepairAll(true);
    // Also update local display data
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => ({
        ...tr,
        engineWear: 0,
        transmissionWear: 0,
        cabinWear: 0,
        chassisWear: 0,
        wheelsWear: 0,
      }))
    }));
    setHasChanges(true);
  };
  
  const handleTruckRefuelAll = () => {
    setTruckRefuelAll(true);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => ({
        ...tr,
        fuelRelative: 1,
      }))
    }));
    setHasChanges(true);
  };

  const handleTruckRepair = (truckId: string) => {
    setTruckRepairIds(prev => prev.includes(truckId) ? prev : [...prev, truckId]);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => tr.id === truckId ? {
        ...tr,
        engineWear: 0, transmissionWear: 0, cabinWear: 0, chassisWear: 0, wheelsWear: 0,
      } : tr)
    }));
    setHasChanges(true);
  };

  const handleTruckRefuel = (truckId: string) => {
    setTruckRefuelIds(prev => prev.includes(truckId) ? prev : [...prev, truckId]);
    setEditableData(prev => ({
      ...prev,
      trucks: prev.trucks.map(tr => tr.id === truckId ? { ...tr, fuelRelative: 1 } : tr)
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const payload = {
      ...editableData,
      targetGarages,
      truckRepairAll,
      truckRefuelAll,
      truckRepairIds,
      truckRefuelIds,
    };
    onSave(payload);
    setHasChanges(false);
    setTruckRepairAll(false);
    setTruckRefuelAll(false);
    setTruckRepairIds([]);
    setTruckRefuelIds([]);
  };

  const handleDownload = () => {
    onDownload(editableData);
  };

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
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabJobs')} / Skills</span>
            </button>
            <button onClick={() => setView('garage')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'garage' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">warehouse</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabGarages')}</span>
            </button>
            <button onClick={() => setView('truck')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'truck' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined">local_shipping</span>
              <span className="font-display tracking-widest uppercase text-xs font-bold">{t('dashboard.tabTrucks')}</span>
            </button>
          </nav>
          
          <div className="hidden md:flex flex-col gap-2 mt-auto w-full pt-4 border-t border-white/5">
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
              {/* Stat Gauges */}
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
                <p className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-0.5">Total XP</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                  {(editableData.experiencePoints / 1000).toFixed(1)}k
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
               onSave={handleSave}
               saving={saving}
               hasChanges={hasChanges}
             />
          )}
          {view === 'user' && (
             <UserEditor 
               data={editableData} 
               onChange={handleChange} 
               onBack={() => setView('home')} 
               onSave={handleSave}
               saving={saving}
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
                   targetGarages={targetGarages}
                   onChange={handleGarageChange}
                   onReplaceTargets={handleGarageReplaceAll}
                 />
               </div>
               {hasChanges && (
                 <div className="fixed bottom-8 right-6 z-50">
                    <div className="absolute inset-0 bg-primary rounded-full blur animate-pulse opacity-50"></div>
                    <button onClick={handleSave} disabled={saving} className="relative flex items-center justify-center w-16 h-16 bg-primary text-black rounded-full shadow-neon hover:shadow-neon-intense hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer">
                      <span className={`material-symbols-outlined text-3xl ${saving ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                        {saving ? 'sync' : 'save'}
                      </span>
                    </button>
                 </div>
               )}
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
                 />
               </div>
               {hasChanges && (
                 <div className="fixed bottom-8 right-6 z-50">
                    <div className="absolute inset-0 bg-primary rounded-full blur animate-pulse opacity-50"></div>
                    <button onClick={handleSave} disabled={saving} className="relative flex items-center justify-center w-16 h-16 bg-primary text-black rounded-full shadow-neon hover:shadow-neon-intense hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer">
                      <span className={`material-symbols-outlined text-3xl ${saving ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                        {saving ? 'sync' : 'save'}
                      </span>
                    </button>
                 </div>
               )}
             </div>
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
              <p className="text-[10px] font-medium leading-normal tracking-wide font-display mt-1">Skills</p>
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
          </div>
        </div>
      </div>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
