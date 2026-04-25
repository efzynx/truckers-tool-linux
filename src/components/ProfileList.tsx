/**
 * Purpose: Display the list of driver profiles found in the local system.
 * Caller: App.tsx (Step: profile-select).
 * Dependencies: useApi.ts, i18n, RestoreCompareModal.
 * Main Functions: ProfileList component, handleRestoreClick, handleCompareAction.
 * Side Effects: Fetches comparison data and triggers profile restoration.
 */
import React, { useState, useRef, useEffect } from 'react';
import type { Profile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { compareBackup, restoreProfile, restoreSaveGranular } from '../hooks/useApi';
import RestoreCompareModal from './RestoreCompareModal';

interface ProfileListProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  onBack: () => void;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function ProfileList({ profiles, onSelect, onBack, loading: parentLoading, onRefresh }: ProfileListProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [selectedProfileForRestore, setSelectedProfileForRestore] = useState<Profile | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Notification State
  const [showSuccessNotif, setShowSuccessNotif] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []);

  const showNotification = (message: string) => {
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMsg(message);
    setShowSuccessNotif(true);
    successTimer.current = setTimeout(() => {
      setShowSuccessNotif(false);
      onRefresh(); // Refresh data without full page reload
    }, 2500);
  };

  // Sorting: main profiles only, newest first
  const mainProfiles = profiles.filter(p => !p.isBackup);
  const sortedProfiles = [...mainProfiles].sort((a, b) => {
    const timeA = a.saveTime ? new Date(a.saveTime).getTime() : 0;
    const timeB = b.saveTime ? new Date(b.saveTime).getTime() : 0;
    return timeB - timeA;
  });

  const handleRestoreClick = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setSelectedProfileForRestore(profile);
    setIsRestoreModalOpen(true);
    setCompareData(null);
  };

  const handleCompareAction = async (currentSave?: string, backupSave?: string) => {
    if (!selectedProfileForRestore) return;
    try {
      const res = await compareBackup(selectedProfileForRestore.path, currentSave, backupSave);
      if (res.success) {
        setCompareData(res.comparison);
      } else {
        alert(res.error || 'Gagal memuat data perbandingan');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghubungi server');
    }
  };

  const handleConfirmRestore = async (isFullRestore: boolean, activeSave?: string, backupSave?: string) => {
    if (!selectedProfileForRestore) return;
    
    setLoading(true);
    try {
      let res;
      if (isFullRestore) {
        if (!window.confirm('PERINGATAN: Ini akan mengganti SELURUH profil. Lanjutkan?')) {
          setLoading(false);
          return;
        }
        res = await restoreProfile(selectedProfileForRestore.path);
      } else {
        if (!activeSave || !backupSave) return;
        res = await restoreSaveGranular(selectedProfileForRestore.path, activeSave, backupSave);
      }

      if (res.success) {
        setIsRestoreModalOpen(false);
        showNotification(isFullRestore ? 'Seluruh profil berhasil dipulihkan!' : `Save ${activeSave} berhasil diperbarui!`);
      } else {
        alert(res.error || 'Gagal melakukan restore');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = parentLoading || loading;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-text-main font-display antialiased selection:bg-primary/30 selection:text-primary">
      <div className="relative flex flex-col min-h-screen w-full bg-background-dark shadow-2xl overflow-hidden border-x border-white/5">
        <div className="absolute inset-0 pointer-events-none z-0 bg-[image:var(--bg-scanlines)] opacity-20"></div>

        {/* Success Toast Notification */}
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-500 ${
            showSuccessNotif
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20">
              <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
            </div>
            <span className="text-sm font-display font-black text-emerald-300 uppercase tracking-widest">
              {successMsg}
            </span>
          </div>
        </div>

        <header className="relative z-20 flex flex-col glass-panel pt-12 pb-4 px-6 gap-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack} disabled={isLoading} className="flex items-center justify-center w-10 h-10 rounded-full text-text-main hover:bg-white/5 transition-colors cursor-pointer"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
            <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">badge</span><span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Identity Verification</span></div>
            <div className="w-10"></div>
          </div>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none">DRIVER<br/><span className="text-text-muted font-normal text-2xl">PROFILES</span></h1>
            <div className="text-right">
              <div className="text-xs text-text-muted font-mono mb-1">{isLoading ? 'INITIALIZING...' : 'SYSTEM_READY'}</div>
              <div className="h-1 w-16 bg-surface rounded-full overflow-hidden"><div className={`h-full bg-primary w-2/3 ${isLoading ? 'animate-ping' : 'animate-pulse'}`}></div></div>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-24 pt-4 scroll-smooth no-scrollbar">
          <div className="flex flex-col gap-3 pt-6">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider pl-2 mb-1">Local Profiles ({mainProfiles.length})</div>
            
            {mainProfiles.length === 0 && (
              <div className="text-center py-10 opacity-50"><span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span><p className="font-mono text-sm uppercase tracking-widest text-text-muted">{t('profileList.empty')}</p></div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProfiles.map((profile, idx) => {
              const isActive = idx === 0;
              const hasBackup = profiles.some(p => p.path === `${profile.path}-backup.bak`);
              return (
                <li key={profile.path}>
                  <div className="group relative h-full">
                    <div onClick={() => !isLoading && onSelect(profile)} role="button" tabIndex={0} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) onSelect(profile); }} className={`relative flex items-center h-[88px] w-full border ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'} bg-surface/60 border-white/5 rounded-xl p-3 transition-all duration-300 hover:translate-y-[-2px] hover:bg-surface hover:border-white/10 overflow-hidden`}>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                      <div className={`relative shrink-0 mr-4 ml-2 ${!isActive && 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                        <div className={`w-14 h-14 bg-background-dark hexagon-mask flex items-center justify-center relative ring-1 ${isActive ? 'ring-primary/30' : 'ring-white/10'}`}>
                          {profile.imagePath ? (
                             <img alt={profile.displayName || profile.name} className={`w-full h-full object-cover ${!isActive ? 'grayscale group-hover:grayscale-0 transition-all' : 'opacity-90'}`} src={`file://${profile.imagePath}`} onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                          ) : ( <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div> )}
                          <span className={`material-symbols-outlined ${profile.imagePath ? 'hidden absolute' : 'text-text-muted'} `} style={{ fontSize: '28px' }}>person</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-baseline mb-1"><h3 className={`text-lg font-bold text-white truncate pr-2 group-hover:text-primary transition-colors`}>{profile.displayName || profile.name || 'Unknown Profile'}</h3></div>
                        <div className={`flex items-center gap-3 text-xs text-text-muted transition-colors`}><div className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span><span>{profile.saveTime ? new Date(profile.saveTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown Date'}</span></div></div>
                      </div>
                      <div className="ml-2 flex items-center gap-2 relative z-20">
                        {hasBackup && ( <button onClick={(e) => handleRestoreClick(e, profile)} title="Restore from Backup" className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 text-text-muted hover:bg-primary/20 hover:text-primary transition-all border border-white/5 hover:border-primary/30"><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings_backup_restore</span></button> )}
                        <div className="text-text-muted group-hover:text-primary transition-colors"><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chevron_right</span></div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            </ul>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-dark to-transparent pointer-events-none z-20"></div>
        </main>

        <RestoreCompareModal
          isOpen={isRestoreModalOpen}
          onClose={() => setIsRestoreModalOpen(false)}
          onConfirm={handleConfirmRestore}
          onCompare={handleCompareAction}
          loading={loading}
          data={compareData}
          profileName={selectedProfileForRestore?.displayName || selectedProfileForRestore?.name || ''}
          profilePath={selectedProfileForRestore?.path || ''}
        />
      </div>
    </div>
  );
}
