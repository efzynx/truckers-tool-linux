import { useState } from 'react';
import type { GameType } from '../types';

interface PathInputProps {
  game: GameType;
  onScan: (path: string) => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

const defaultPaths: Record<GameType, string> = {
  ets2: '/home/' + 'USER' + '/.local/share/Euro Truck Simulator 2/profiles/',
  ats: '/home/' + 'USER' + '/.local/share/American Truck Simulator/profiles/',
};

export default function PathInput({ game, onScan, loading, error, onBack }: PathInputProps) {
  const [path, setPath] = useState(defaultPaths[game]);
  const gameName = game === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Top bar */}
      <div className="absolute top-6 left-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary 
                     transition-colors cursor-pointer text-sm glass rounded-lg px-3 py-1.5"
        >
          <span>←</span>
          <span>Kembali</span>
        </button>
        <span className="text-text-muted text-sm">
          <span className="text-lg mr-1">🚛</span> Truckers Tool
        </span>
      </div>

      <div className="max-w-2xl w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{game === 'ets2' ? '🇪🇺' : '🇺🇸'}</div>
          <h2 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
            Pindai dan Pilih Profil
          </h2>
          <p className="text-text-secondary">
            Temukan profil dan cadangan Anda untuk {gameName}.
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <label className="block text-text-secondary text-sm mb-2 font-medium">
            Path Folder Profil
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder={`/home/username/.local/share/${gameName}/profiles/`}
              className="flex-1 bg-bg-input border border-border rounded-lg px-4 py-3 
                         text-text-primary font-mono text-sm
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                         placeholder:text-text-muted transition-all"
            />
            <button
              onClick={() => onScan(path)}
              disabled={loading || !path.trim()}
              className="bg-accent text-white font-bold px-6 py-3 rounded-lg
                         hover:bg-accent-hover transition-all duration-200 cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Scanning...
                </>
              ) : (
                <>
                  🔍 Scan
                </>
              )}
            </button>
          </div>

          {/* Hint */}
          <div className="mt-3 flex items-start gap-2 text-xs text-text-muted">
            <span>💡</span>
            <span>
              Path default biasanya: <code className="bg-bg-primary px-1.5 py-0.5 rounded text-text-secondary">~/.local/share/{gameName}/profiles/</code>
              <br/>
              Ganti <code className="bg-bg-primary px-1.5 py-0.5 rounded text-text-secondary">USER</code> dengan username kamu.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm flex items-center gap-2">
              <span>❌</span> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
