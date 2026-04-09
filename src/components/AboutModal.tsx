import { useState, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface VersionInfo {
  stable: string | null;
  beta: string | null;
  alpha: string | null;
  currentVersion: string;
  stableUrl: string | null;
  betaUrl: string | null;
  alphaUrl: string | null;
}

function versionCompare(a: string, b: string): number {
  const isPreA = a.includes('-');
  const isPreB = b.includes('-');
  
  const baseA = a.split('-')[0].split('.').map(Number);
  const baseB = b.split('-')[0].split('.').map(Number);

  // Compare base version first
  for (let i = 0; i < 3; i++) {
    const na = baseA[i] || 0;
    const nb = baseB[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }

  // Base versions are equal. 
  // If one is pre-release and other is not, the non-pre-release is HIGHER.
  if (isPreA && !isPreB) return -1; // a is pre, b is stable -> a < b
  if (!isPreA && isPreB) return 1;  // a is stable, b is pre -> a > b

  // Both are pre-releases, compare the pre-release parts
  if (isPreA && isPreB) {
    const preA = a.split('-')[1];
    const preB = b.split('-')[1];
    
    const [tagA, numA] = preA.split('.');
    const [tagB, numB] = preB.split('.');
    
    const tagRank = (tag: string) => {
      if (tag === 'alpha') return 1;
      if (tag === 'beta') return 2;
      return 0;
    };
    
    const rankA = tagRank(tagA);
    const rankB = tagRank(tagB);
    
    if (rankA < rankB) return -1;
    if (rankA > rankB) return 1;
    
    const nA = Number(numA) || 0;
    const nB = Number(numB) || 0;
    if (nA < nB) return -1;
    if (nA > nB) return 1;
  }

  return 0;
}

export default function AboutModal({ onClose }: { onClose: () => void }) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'donate'>('info');
  const { t } = useLanguage();
  const isDesktop = typeof window !== 'undefined' && 'electronAPI' in window;

  const checkUpdate = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

      if (typeof window !== 'undefined' && 'electronAPI' in window && (window as any).electronAPI.network) {
        // Desktop mode (Electron)
        const response = await (window as any).electronAPI.network.checkUpdate();
        if (!response.success) {
          throw new Error(response.error === 'NO_INTERNET' ? 'Offline' : response.message);
        }
        setVersionInfo(response.data);
      } else {
        // Web mode fallback
        const API_BASE = '/api';
        const res = await fetch(`${API_BASE}/check-update`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setVersionInfo(data);
      }
    } catch (err: any) {
      if (err.message === 'Offline') {
         setError(t('Gagal menyambung ke server. Anda mungkin offline.'));
      } else {
         setError('Failed to check for updates. Please check your connection.');
      }
    } finally {
      setChecking(false);
    }
  }, [t]);

  const isNewer = (remote: string | null, current: string) => {
    if (!remote) return false;
    return versionCompare(remote, current) > 0;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in font-body p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-white/10 relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scale-in 0.2s ease-out' }}
      >
        <div className="absolute inset-0 bg-[image:var(--bg-scanlines)] opacity-30 pointer-events-none mix-blend-overlay"></div>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-black/20 flex flex-col relative z-10 w-full shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">info</span>
              <div>
                <h2 className="text-lg font-display font-bold text-white tracking-widest uppercase leading-none">{t('about.title')}</h2>
                <p className="text-[10px] font-mono text-primary tracking-[0.2em] uppercase mt-1">System Info Module</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5 w-full">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 text-xs font-bold font-display uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'info'
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(255,140,0,0.2)]'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent cursor-pointer'
              }`}
            >
              {t('about.tabInfo')}
            </button>
            <button
              onClick={() => setActiveTab('donate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold font-display uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'donate'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] leading-none">favorite</span>
              Donation
            </button>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-6 space-y-5 relative z-10 overflow-y-auto no-scrollbar">
          
          {activeTab === 'info' && (
            <div className="animate-fade-in space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 {/* Version */}
                 <div className="bg-surface-dark border border-white/5 p-3 rounded-xl">
                   <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">{t('about.version')}</span>
                   <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
                     v{process.env.NEXT_PUBLIC_APP_VERSION}
                     {(process.env.NEXT_PUBLIC_APP_VERSION || '').includes('-alpha') ? (
                       <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                         ALPHA
                       </span>
                     ) : (process.env.NEXT_PUBLIC_APP_VERSION || '').includes('-') ? (
                       <span className="px-1.5 py-0.5 rounded text-[9px] bg-warning/20 text-warning border border-warning/30">
                         BETA
                       </span>
                     ) : null}
                   </p>
                 </div>
                 {/* Author */}
                 <div className="bg-surface-dark border border-white/5 p-3 rounded-xl">
                   <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">{t('about.developer')}</span>
                   <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
                     <span className="material-symbols-outlined text-[14px] text-primary">engineering</span>
                     efzynx
                   </p>
                 </div>
              </div>

              <div className="bg-surface-dark border border-white/5 p-3 rounded-xl flex justify-between items-center">
                 <div>
                   <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">{t('about.repository')}</span>
                   <a
                     href="https://github.com/efzynx/truckers-tool-linux"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-xs font-mono text-primary hover:underline hover:text-white transition-colors"
                   >
                     github.com/efzynx/truckers-tool-linux
                   </a>
                 </div>
                 <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

              {/* OTA Updater */}
              <div className="bg-surface border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                   <span className="material-symbols-outlined text-6xl text-primary">system_update</span>
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <p className="text-xs font-bold text-white font-display tracking-widest uppercase">{t('about.updateTitle')}</p>
                  <button
                    onClick={checkUpdate}
                    disabled={checking}
                    className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-all
                               bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30
                               disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center gap-1.5"
                  >
                    {checking ? (
                      <><span className="material-symbols-outlined text-[12px] animate-spin">refresh</span> {t('about.btnChecking')}</>
                    ) : (
                      <>{t('about.btnCheckUpdate')}</>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-xs text-danger font-mono mb-3 animate-fade-in relative z-10">
                    <span className="font-bold mr-1">ERR:</span> {error}
                  </div>
                )}

                {versionInfo && !error && (
                  <div className="space-y-2 animate-fade-in relative z-10">
                    <div className="bg-background-dark border border-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-success text-[18px]">verified</span>
                        <div>
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">{t('about.branchStable')}</span>
                          <p className="text-white text-xs font-mono font-bold mt-0.5">
                            {versionInfo.stable ? `v${versionInfo.stable}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {versionInfo.stable && isNewer(versionInfo.stable, versionInfo.currentVersion) ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-success/20 text-success font-bold tracking-widest border border-success/30 uppercase">{t('about.statusUpdate')}</span>
                      ) : versionInfo.stable ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-text-muted font-bold tracking-widest uppercase">{t('about.statusCurrent')}</span>
                      ) : null}
                    </div>

                    <div className="bg-background-dark border border-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-warning text-[18px]">science</span>
                        <div>
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">{t('about.branchBeta')}</span>
                          <p className="text-white text-xs font-mono font-bold mt-0.5">
                            {versionInfo.beta ? `v${versionInfo.beta}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {versionInfo.beta && isNewer(versionInfo.beta, versionInfo.currentVersion) ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-warning/20 text-warning font-bold tracking-widest border border-warning/30 uppercase">{t('about.statusAvailable')}</span>
                      ) : versionInfo.beta ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-text-muted font-bold tracking-widest uppercase">{t('about.statusCurrent')}</span>
                      ) : null}
                    </div>

                    <div className="bg-background-dark border border-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-cyan-400 text-[18px]">bug_report</span>
                        <div>
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">{t('about.branchAlpha')}</span>
                          <p className="text-white text-xs font-mono font-bold mt-0.5">
                            {versionInfo.alpha ? `v${versionInfo.alpha}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {versionInfo.alpha && isNewer(versionInfo.alpha, versionInfo.currentVersion) ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 font-bold tracking-widest border border-cyan-500/30 uppercase">{t('about.statusAvailable')}</span>
                      ) : versionInfo.alpha ? (
                        <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-text-muted font-bold tracking-widest uppercase">{t('about.statusCurrent')}</span>
                      ) : null}
                    </div>

                    {(isNewer(versionInfo.stable, versionInfo.currentVersion) ||
                      isNewer(versionInfo.beta, versionInfo.currentVersion) ||
                      isNewer(versionInfo.alpha, versionInfo.currentVersion)) && (
                      <div className="bg-black/30 border border-white/5 rounded-lg p-3 mt-3">
                        <p className="text-[10px] font-bold text-primary mb-2 tracking-widest uppercase">{t('about.updateCmdTitle')}</p>
                        <div className="font-mono text-xs text-white space-y-1.5">
                          {isNewer(versionInfo.stable, versionInfo.currentVersion) && (
                            <p className="flex items-center gap-2">
                              <span className="text-success">&gt;</span> ./ttl.sh update{isDesktop ? ' -d' : ''}
                            </p>
                          )}
                          {isNewer(versionInfo.beta, versionInfo.currentVersion) && (
                            <p className="flex items-center gap-2">
                              <span className="text-warning">&gt;</span> ./ttl.sh update{isDesktop ? ' -d' : ''} --beta
                            </p>
                          )}
                          {isNewer(versionInfo.alpha, versionInfo.currentVersion) && (
                            <p className="flex items-center gap-2">
                              <span className="text-cyan-400">&gt;</span> ./ttl.sh update{isDesktop ? ' -d' : ''} --alpha
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'donate' && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">volunteer_activism</span>
                <p className="text-xs text-emerald-100/80 leading-relaxed font-body">
                  {t('about.donationDesc')}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href="https://trakteer.id/efzyn/gift"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-between bg-surface border border-white/10 p-4 rounded-xl hover:border-red-500/50 hover:bg-red-500/10 transition-all cursor-pointer overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex items-center gap-3 relative z-10">
                     <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                       <span className="material-symbols-outlined text-[18px]">local_cafe</span>
                     </div>
                     <span className="font-bold text-sm text-white font-display tracking-widest uppercase">{t('about.donationBtnTrakteer')}</span>
                   </div>
                   <span className="material-symbols-outlined text-text-muted group-hover:text-red-400 transition-colors relative z-10">open_in_new</span>
                </a>

                <a
                  href="https://saweria.co/efzynx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-between bg-surface border border-white/10 p-4 rounded-xl hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all cursor-pointer overflow-hidden"
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex items-center gap-3 relative z-10">
                     <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black shadow-lg">
                       <span className="material-symbols-outlined text-[18px]">payments</span>
                     </div>
                     <span className="font-bold text-sm text-white font-display tracking-widest uppercase">{t('about.donationBtnSaweria')}</span>
                   </div>
                   <span className="material-symbols-outlined text-text-muted group-hover:text-yellow-400 transition-colors relative z-10">open_in_new</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
