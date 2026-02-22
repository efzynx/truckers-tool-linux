import { useState, useCallback } from 'react';

interface VersionInfo {
  stable: string | null;
  beta: string | null;
  currentVersion: string;
  stableUrl: string | null;
  betaUrl: string | null;
}

function versionCompare(a: string, b: string): number {
  const pa = a.split(/[-.]/).map((x) => (isNaN(Number(x)) ? 0 : Number(x)));
  const pb = b.split(/[-.]/).map((x) => (isNaN(Number(x)) ? 0 : Number(x)));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

export default function AboutModal({ onClose }: { onClose: () => void }) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUpdate = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch('/api/check-update');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVersionInfo(data);
    } catch {
      setError('Gagal memeriksa update. Cek koneksi internet.');
    } finally {
      setChecking(false);
    }
  }, []);

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
        className="glass-panel w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-white/10 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scale-in 0.2s ease-out' }}
      >
        <div className="absolute inset-0 bg-[image:var(--bg-scanlines)] opacity-30 pointer-events-none mix-blend-overlay"></div>

        {/* Header */}
        <div className="px-6 py-5 border-b border-warning/20 bg-warning/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-warning">terminal</span>
            <div>
              <h2 className="text-lg font-display font-bold text-white tracking-widest uppercase leading-none">Truckers Tool</h2>
              <p className="text-[10px] font-mono text-warning tracking-[0.2em] uppercase mt-1">System Info Module</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 relative z-10">
          
          <div className="grid grid-cols-2 gap-4">
             {/* Version */}
             <div className="bg-surface-dark border border-white/5 p-3 rounded-xl">
               <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Current Build</span>
               <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
                 v{process.env.NEXT_PUBLIC_APP_VERSION}
                 {(process.env.NEXT_PUBLIC_APP_VERSION || '').includes('-') && (
                   <span className="px-1.5 py-0.5 rounded text-[9px] bg-warning/20 text-warning border border-warning/30">
                     BETA
                   </span>
                 )}
               </p>
             </div>
             {/* Author */}
             <div className="bg-surface-dark border border-white/5 p-3 rounded-xl">
               <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Developer</span>
               <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
                 <span className="material-symbols-outlined text-[14px] text-primary">engineering</span>
                 efzynx
               </p>
             </div>
          </div>

          <div className="bg-surface-dark border border-white/5 p-3 rounded-xl flex justify-between items-center">
             <div>
               <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Repository Link</span>
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
               <span className="material-symbols-outlined text-6xl text-success">system_update</span>
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-xs font-bold text-white font-display tracking-widest uppercase">System Update</p>
              <button
                onClick={checkUpdate}
                disabled={checking}
                className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-all
                           bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-1.5"
              >
                {checking ? (
                  <><span className="material-symbols-outlined text-[12px] animate-spin">refresh</span> Polling...</>
                ) : (
                  <>Check OTA</>
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
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">Stable Branch</span>
                      <p className="text-white text-xs font-mono font-bold mt-0.5">
                        {versionInfo.stable ? `v${versionInfo.stable}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {versionInfo.stable && isNewer(versionInfo.stable, versionInfo.currentVersion) ? (
                    <span className="text-[9px] px-2 py-1 rounded bg-success/20 text-success font-bold tracking-widest border border-success/30 uppercase">Update</span>
                  ) : versionInfo.stable ? (
                    <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-text-muted font-bold tracking-widest uppercase">Up to date</span>
                  ) : null}
                </div>

                <div className="bg-background-dark border border-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-warning text-[18px]">science</span>
                    <div>
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">Beta Branch</span>
                      <p className="text-white text-xs font-mono font-bold mt-0.5">
                        {versionInfo.beta ? `v${versionInfo.beta}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {versionInfo.beta && isNewer(versionInfo.beta, versionInfo.currentVersion) ? (
                    <span className="text-[9px] px-2 py-1 rounded bg-warning/20 text-warning font-bold tracking-widest border border-warning/30 uppercase">Available</span>
                  ) : versionInfo.beta ? (
                    <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-text-muted font-bold tracking-widest uppercase">Up to date</span>
                  ) : null}
                </div>

                {(isNewer(versionInfo.stable, versionInfo.currentVersion) ||
                  isNewer(versionInfo.beta, versionInfo.currentVersion)) && (
                  <div className="bg-black/30 border border-white/5 rounded-lg p-3 mt-3">
                    <p className="text-[10px] font-bold text-primary mb-2 tracking-widest uppercase">Execute Update Script:</p>
                    <div className="font-mono text-xs text-white space-y-1.5">
                      {isNewer(versionInfo.stable, versionInfo.currentVersion) && (
                        <p className="flex items-center gap-2">
                          <span className="text-success">&gt;</span> ./ttl.sh update
                        </p>
                      )}
                      {isNewer(versionInfo.beta, versionInfo.currentVersion) && (
                        <p className="flex items-center gap-2">
                          <span className="text-warning">&gt;</span> ./ttl.sh update --beta
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
