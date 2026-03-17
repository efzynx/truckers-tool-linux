import React, { useState, useEffect } from 'react';
import { scanSaves } from '../hooks/useApi';
import { useLanguage } from '../i18n/LanguageContext';

interface StatsData { [key: string]: any; }
interface ComparisonData {
  saveNames: { current: string; backup: string; };
  current: StatsData;
  backup: StatsData;
}

interface RestoreCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isFullRestore: boolean, activeSave?: string, backupSave?: string) => void;
  onCompare: (currentSave?: string, backupSave?: string) => Promise<void>;
  loading: boolean;
  data: ComparisonData | null;
  profileName: string;
  profilePath: string;
}

export default function RestoreCompareModal({
  isOpen, onClose, onConfirm, onCompare, loading, data, profileName, profilePath
}: RestoreCompareModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'select' | 'compare'>('select');
  const [activeSaves, setActiveSaves] = useState<any[]>([]);
  const [backupSaves, setBackupSaves] = useState<any[]>([]);
  const [loadingSaves, setLoadingSaves] = useState(false);
  
  const [selectedActive, setSelectedActive] = useState<string>('');
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  
  const [statPage, setStatPage] = useState(0);
  const STATS_PER_PAGE = 6;

  useEffect(() => {
    if (isOpen && step === 'select') {
      loadAllSaves();
    }
  }, [isOpen, step]);

  const loadAllSaves = async () => {
    setLoadingSaves(true);
    try {
      const [activeRes, backupRes] = await Promise.all([
        scanSaves(profilePath),
        scanSaves(`${profilePath}-backup.bak`)
      ]);
      
      const sortSaves = (saves: any[]) => [...(saves || [])].sort((a, b) => new Date(b.saveTime).getTime() - new Date(a.saveTime).getTime());
      
      if (activeRes.success) {
        const sorted = sortSaves(activeRes.saves);
        setActiveSaves(sorted);
        if (sorted.length) setSelectedActive(sorted[0].name);
      }
      if (backupRes.success) {
        const sorted = sortSaves(backupRes.saves);
        setBackupSaves(sorted);
        if (sorted.length) setSelectedBackup(sorted[0].name);
      }
    } catch (err) {
      console.error('Failed to load saves', err);
    } finally {
      setLoadingSaves(false);
    }
  };

  const handleCompare = async () => {
    await onCompare(selectedActive, selectedBackup);
    setStep('compare');
  };

  if (!isOpen) return null;

  const statKeys = data ? Object.keys(data.current) : [];
  const totalStatPages = Math.ceil(statKeys.length / STATS_PER_PAGE);
  const currentStatsPage = statKeys.slice(statPage * STATS_PER_PAGE, (statPage + 1) * STATS_PER_PAGE);

  const labelMap: Record<string, string> = {
    money: t('dashboard.tabMoney') as string,
    xp: t('dashboard.tabUser') as string,
    adr: (t('user.skillMatrix') as string) + ': ADR',
    long_dist: (t('user.skillMatrix') as string) + ': Long Distance',
    heavy: (t('user.skillMatrix') as string) + ': Heavy Cargo',
    fragile: (t('user.skillMatrix') as string) + ': Fragile Cargo',
    urgent: (t('user.skillMatrix') as string) + ': Urgent Delivery',
    mechanical: (t('user.skillMatrix') as string) + ': Eco Driving',
    trucks: t('dashboard.statTrucks') as string,
    trailers: t('dashboard.statTrailers') as string,
    garages: t('dashboard.statGarages') as string,
    drivers: t('driver.listTitle') as string,
    loans: t('change.loansCleared') as string,
    visitedCities: t('Map') as string,
    unlockedDealers: (t('editor.garages.cities') as string) + ' Dealers',
    unlockedRecruitments: (t('driver.hired') as string) + ' Agencies',
    currentJob: t('editor.jobs.cargo') as string
  };

  const iconMap: Record<string, string> = {
    money: 'payments', xp: 'military_tech', adr: 'warning', long_dist: 'explore',
    heavy: 'weight', fragile: 'auto_awesome_motion', urgent: 'schedule', mechanical: 'eco',
    trucks: 'local_shipping', trailers: 'rv_hookup', garages: 'garage', drivers: 'group',
    loans: 'account_balance', visitedCities: 'location_city', unlockedDealers: 'storefront',
    unlockedRecruitments: 'person_search', currentJob: 'inventory_2'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden text-white font-display">
      <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        <header className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary">{step === 'select' ? 'low_priority' : 'compare_arrows'}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {step === 'select' ? t('restore.modalTitleSelect') : t('restore.modalTitleDiff')}
              </h2>
              <p className="text-xs text-text-muted font-mono uppercase tracking-widest">{profileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/10 transition-all"><span className="material-symbols-outlined">close</span></button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 'select' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-mono text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    {t('restore.targetLabel')}
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {loadingSaves ? <div className="py-10 text-center animate-pulse text-text-muted text-xs uppercase">{t('restore.scanningTarget')}</div> : activeSaves.map(s => (
                      <button key={s.path} onClick={() => setSelectedActive(s.name)} className={`w-full p-3 rounded-lg border text-left transition-all ${selectedActive === s.name ? 'bg-primary/10 border-primary text-white shadow-[0_0_10px_rgba(249,140,6,0.1)]' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'}`}>
                        <div className="text-sm font-bold">{s.name}</div>
                        <div className="text-[10px] opacity-60">{new Date(s.saveTime).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-mono text-success uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    {t('restore.sourceLabel')}
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {loadingSaves ? <div className="py-10 text-center animate-pulse text-text-muted text-xs uppercase">{t('restore.scanningSource')}</div> : backupSaves.map(s => (
                      <button key={s.path} onClick={() => setSelectedBackup(s.name)} className={`w-full p-3 rounded-lg border text-left transition-all ${selectedBackup === s.name ? 'bg-success/10 border-success text-white shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-white/5 border-white/5 text-text-muted hover:border-white/20'}`}>
                        <div className="text-sm font-bold">{s.name}</div>
                        <div className="text-[10px] opacity-60">{new Date(s.saveTime).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-text-muted leading-relaxed">
                {(t('restore.infoNote') as string).replace('{active}', selectedActive || '?').replace('{backup}', selectedBackup || '?')}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!data ? <div className="py-20 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div><p className="text-sm font-mono text-primary animate-pulse">{t('restore.analyzing')}</p></div> : (
                <div className="space-y-4">
                   <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
                          <th className="py-3 pl-4 font-normal w-1/3">{t('restore.propProperty')}</th>
                          <th className="py-3 text-center font-normal">{t('restore.propActive')} ({data.saveNames.current})</th>
                          <th className="py-3 text-center font-normal text-primary">{t('restore.propBackup')} ({data.saveNames.backup})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStatsPage.map(key => {
                          const current = data.current[key]; const backup = data.backup[key];
                          const isNumber = typeof current === 'number'; let diff = isNumber ? backup - current : 0;
                          return (
                            <tr key={key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4 pl-4"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>{iconMap[key] || 'info'}</span><span className="text-sm font-medium text-text-main">{labelMap[key] || key}</span></div></td>
                              <td className="py-4 text-center font-mono text-sm text-text-muted">{isNumber ? current.toLocaleString() : current}</td>
                              <td className="py-4 text-center font-mono text-sm text-white"><div className="flex flex-col items-center"><span>{isNumber ? backup.toLocaleString() : backup}</span>{isNumber && diff !== 0 && (<span className={`text-[10px] font-bold ${diff > 0 ? 'text-success' : 'text-error'}`}>{diff > 0 ? '+' : ''}{diff.toLocaleString()}</span>)}</div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-2">
                    <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{t('restore.pageData')} {statPage + 1}/{totalStatPages}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setStatPage(p => Math.max(0, p - 1))} disabled={statPage === 0} className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center text-text-muted hover:bg-white/10 disabled:opacity-20 transition-all"><span className="material-symbols-outlined">chevron_left</span></button>
                      <button onClick={() => setStatPage(p => Math.min(totalStatPages - 1, p + 1))} disabled={statPage === totalStatPages - 1} className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center text-text-muted hover:bg-white/10 disabled:opacity-20 transition-all"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="px-6 py-5 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-text-main hover:bg-white/5 transition-all uppercase">{t('restore.btnCancel')}</button>
          <div className="flex items-center gap-3">
            {step === 'select' ? (
              <>
                <button onClick={() => onConfirm(true)} className="px-5 py-2.5 rounded-xl border border-error/30 text-error text-[10px] font-black hover:bg-error/10 transition-all uppercase">{t('restore.btnNuclear')}</button>
                <button onClick={handleCompare} disabled={!selectedActive || !selectedBackup} className="px-6 py-2.5 bg-primary text-black text-sm font-black rounded-xl hover:shadow-[0_0_20px_rgba(249,140,6,0.4)] transition-all flex items-center gap-2 uppercase">
                  {t('restore.btnCompare')} <span className="material-symbols-outlined">analytics</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('select')} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-text-main hover:bg-white/5 transition-all uppercase">{t('restore.btnBack')}</button>
                <button onClick={() => onConfirm(false, selectedActive, selectedBackup)} disabled={loading} className="px-6 py-2.5 bg-primary text-black text-sm font-black rounded-xl hover:shadow-[0_0_20px_rgba(249,140,6,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 uppercase">
                  {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <span className="material-symbols-outlined">settings_backup_restore</span>}
                  {t('restore.btnConfirm')}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
