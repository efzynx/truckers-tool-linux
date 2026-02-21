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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-md mx-4 p-0 overflow-hidden shadow-2xl border border-border animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scale-in 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border bg-gradient-to-br from-accent/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚛</span>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Truckers Tool</h2>
                <p className="text-xs text-text-muted">Save Editor for ETS2 & ATS on Linux</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer
                         w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-card"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Version */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Versi Saat Ini</p>
              <p className="text-xs text-text-muted mt-0.5">
                v{__APP_VERSION__}
                {__APP_VERSION__.includes('-') && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/15 text-yellow-400 font-medium">
                    BETA
                  </span>
                )}
              </p>
            </div>
            <span className="text-2xl">📦</span>
          </div>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Developer</p>
              <p className="text-xs text-text-muted mt-0.5">efzynx</p>
            </div>
            <span className="text-2xl">👨‍💻</span>
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Repository</p>
              <a
                href="https://github.com/efzynx/truckers-tool-linux"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline mt-0.5 inline-block"
              >
                github.com/efzynx/truckers-tool-linux ↗
              </a>
            </div>
            <span className="text-2xl">🔗</span>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Update Check */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-text-primary">Cek Update</p>
              <button
                onClick={checkUpdate}
                disabled={checking}
                className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all
                           bg-accent/15 text-accent hover:bg-accent/25 border border-accent/20
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-1.5"
              >
                {checking ? (
                  <><span className="animate-spin">⏳</span> Memeriksa...</>
                ) : (
                  <><span>🔄</span> Cek Sekarang</>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
                ❌ {error}
              </div>
            )}

            {versionInfo && !error && (
              <div className="space-y-2.5">
                {/* Stable */}
                <div className="bg-bg-primary rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs font-medium text-text-primary">Stable</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 ml-4">
                      {versionInfo.stable ? `v${versionInfo.stable}` : 'Tidak tersedia'}
                    </p>
                  </div>
                  {versionInfo.stable && isNewer(versionInfo.stable, versionInfo.currentVersion) ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">
                      🆕 Update!
                    </span>
                  ) : versionInfo.stable ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-bg-card text-text-muted">
                      ✅ Terbaru
                    </span>
                  ) : null}
                </div>

                {/* Beta */}
                <div className="bg-bg-primary rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-xs font-medium text-text-primary">Beta</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 ml-4">
                      {versionInfo.beta ? `v${versionInfo.beta}` : 'Tidak tersedia'}
                    </p>
                  </div>
                  {versionInfo.beta && isNewer(versionInfo.beta, versionInfo.currentVersion) ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
                      🧪 Tersedia
                    </span>
                  ) : versionInfo.beta ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-bg-card text-text-muted">
                      ✅ Terbaru
                    </span>
                  ) : null}
                </div>

                {/* Update Instructions */}
                {(isNewer(versionInfo.stable, versionInfo.currentVersion) ||
                  isNewer(versionInfo.beta, versionInfo.currentVersion)) && (
                  <div className="bg-accent/5 border border-accent/15 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium text-accent mb-2">📋 Cara Update:</p>
                    <div className="font-mono text-[11px] text-text-secondary space-y-1">
                      {isNewer(versionInfo.stable, versionInfo.currentVersion) && (
                        <p className="bg-bg-primary rounded px-2 py-1">
                          <span className="text-green-400">stable:</span> ./ttl.sh update
                        </p>
                      )}
                      {isNewer(versionInfo.beta, versionInfo.currentVersion) && (
                        <p className="bg-bg-primary rounded px-2 py-1">
                          <span className="text-yellow-400">beta:</span> ./ttl.sh update --beta
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-bg-primary/50">
          <p className="text-[10px] text-text-muted text-center">
            Made with ❤️ for the trucking community • Open Source (MIT)
          </p>
        </div>
      </div>
    </div>
  );
}
