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

  const gameName = game === 'ets2' ? 'Euro Truck 2' : 'American Truck Focus';

  return (
    <div className="bg-background-dark text-text-main h-screen w-full flex flex-col overflow-hidden relative font-body selection:bg-primary selection:text-black">
      {/* Background Scanlines Effect */}
      <div className="scanline-overlay absolute inset-0 z-0 h-full w-full"></div>

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4 pb-4 bg-background-dark/80 backdrop-blur-md border-b border-surface">
        <button 
          onClick={onBack}
          disabled={loading}
          className="text-white hover:text-primary transition-colors flex size-10 shrink-0 items-center justify-center rounded-lg active:bg-surface/50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
        </button>
        <h2 className="text-white text-2xl font-display font-bold leading-tight tracking-wider flex-1 text-center pr-10 uppercase">
          Locate Terminal
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-y-auto pb-24 no-scrollbar">
        {/* Input Section */}
        <div className="px-5 pt-6 pb-2">
          <label className="block text-text-muted font-display font-bold uppercase tracking-wider text-sm mb-2 ml-1">
            System Path
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-primary">
              <span className="material-symbols-outlined text-[20px]">terminal</span>
            </div>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={loading}
              placeholder="Enter path..."
              className="block w-full rounded-xl border border-surface bg-surface py-4 pl-12 pr-4 text-text-main font-mono text-base placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-neon transition-all duration-300"
            />
          </div>
          {error && (
            <div className="mt-2 text-red-500 font-mono text-xs uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span> {error}
            </div>
          )}
        </div>

        {/* Central Illustration / Spacer */}
        <div className="flex flex-col items-center justify-center py-8 opacity-80">
          <div className="relative size-32 mb-4 flex items-center justify-center">
            {/* Abstract radar/scan graphic */}
            <div className={`absolute inset-0 rounded-full border border-primary/20 ${loading ? 'animate-ping' : 'animate-pulse'}`}></div>
            <div className="absolute inset-4 rounded-full border border-primary/10"></div>
            <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-primary/50 to-transparent absolute left-1/2 -translate-x-1/2"></div>
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent absolute top-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 bg-surface/50 p-4 rounded-full backdrop-blur-sm border border-surface">
              <span className="material-symbols-outlined text-primary text-4xl">folder_open</span>
            </div>
          </div>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">
            {loading ? 'Scanning Directory...' : 'Awaiting Signal Lock'}
          </p>
          <p className="text-primary font-display font-bold text-lg mt-2 tracking-widest shadow-neon">
            {gameName}
          </p>
        </div>

        {/* Directory Tree List (Mock visual structure based on design) */}
        <div className="px-5 flex-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-text-main font-display font-bold text-lg">Directory Index</h3>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">root: user</span>
          </div>
          
          <div className="flex flex-col space-y-3 pb-8">
            {/* Active Folder Item */}
            <div className="group flex items-center p-4 rounded-xl bg-surface border border-primary shadow-neon relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              <span className="material-symbols-outlined text-primary mr-4">folder_special</span>
              <div className="flex-1 z-10">
                <p className="text-white font-mono font-bold text-base tracking-tight truncate">
                  {game === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator'}
                </p>
                <p className="text-primary/80 text-xs font-body mt-0.5">Target Acquired • Write Access</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-neon-sm shrink-0"></div>
            </div>

            {/* Default Directory Hint Item */}
             <div className="group flex items-center p-4 rounded-xl bg-surface border border-surface/50 transition-all opacity-80">
              <span className="material-symbols-outlined text-text-muted mr-4">info</span>
              <div className="flex-1 max-w-full overflow-hidden">
                <p className="text-text-main font-mono text-sm">Default Recovery Path</p>
                <p className="text-text-muted text-[10px] font-mono mt-1 break-all">~{defaultPaths[game].replace('/home/USER', '')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-30">
        <button 
          onClick={() => onScan(path)} 
          disabled={loading || !path.trim()}
          className="w-full bg-primary hover:bg-orange-500 active:scale-[0.98] text-black font-display font-bold text-xl py-4 rounded-xl shadow-neon transition-all duration-200 flex items-center justify-center group relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {!loading && (
             <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
          )}
          {loading ? (
             <span className="material-symbols-outlined mr-2 text-2xl animate-spin">data_usage</span>
          ) : (
             <span className="material-symbols-outlined mr-2 text-2xl">radar</span>
          )}
          {loading ? 'SCANNING...' : 'ENGAGE SCAN'}
        </button>
      </div>
    </div>
  );
}
