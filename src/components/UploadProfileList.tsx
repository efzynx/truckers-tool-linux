import type { UploadedProfile } from '../types';

interface UploadProfileListProps {
  profiles: UploadedProfile[];
  onSelect: (profile: UploadedProfile) => void;
  onBack: () => void;
  loading: boolean;
}

export default function UploadProfileList({ profiles, onSelect, onBack, loading }: UploadProfileListProps) {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-text-main font-display antialiased selection:bg-primary/30 selection:text-primary">
      <div className="relative flex flex-col min-h-screen w-full bg-background-dark shadow-2xl overflow-hidden border-x border-white/5">
        
        {/* Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[image:var(--bg-scanlines)] opacity-20"></div>

        {/* Header */}
        <header className="relative z-20 flex flex-col glass-panel pt-12 pb-4 px-6 gap-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 rounded-full text-text-main hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back_ios_new</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>cloud_done</span>
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Uploaded Archive</span>
            </div>
            <div className="w-10"></div>
          </div>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none">DRIVER<br/><span className="text-text-muted font-normal text-2xl">PROFILES</span></h1>
            <div className="text-right">
              <div className="text-xs text-text-muted font-mono mb-1">{loading ? 'LOADING...' : `${profiles.length} PROFILE(S)`}</div>
              <div className="h-1 w-16 bg-surface rounded-full overflow-hidden">
                <div className={`h-full bg-primary w-2/3 ${loading ? 'animate-ping' : 'animate-pulse'}`}></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-24 pt-4 scroll-smooth no-scrollbar">
          <div className="flex flex-col gap-3 pt-6">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider pl-2 mb-1">Uploaded Profiles ({profiles.length})</div>
            
            {profiles.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                <p className="font-mono text-sm uppercase tracking-widest text-text-muted">No Profiles Found</p>
              </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile, idx) => {
              const isActive = idx === 0;

              return (
                <li key={profile.name}>
                  <button 
                    onClick={() => onSelect(profile)}
                    disabled={loading}
                    className="group relative w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait block h-full"
                  >
                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`relative flex items-center h-[88px] w-full border ${isActive ? 'bg-surface border-primary/50 shadow-[0_0_15px_rgba(249,140,6,0.1)]' : 'bg-surface/60 border-white/5'} rounded-xl p-3 transition-all duration-300 hover:translate-y-[-2px] hover:bg-surface hover:border-white/10 overflow-hidden`}>
                      
                      {/* Active Indicator Strip */}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}

                      {/* Avatar */}
                      <div className={`relative shrink-0 mr-4 ml-2 ${!isActive && 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                        <div className={`w-14 h-14 bg-background-dark hexagon-mask flex items-center justify-center relative overflow-hidden ring-1 ${isActive ? 'ring-primary/30' : 'ring-white/10'}`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
                          <span className="material-symbols-outlined text-text-muted relative z-10" style={{ fontSize: '28px' }}>person</span>
                          {isActive && <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent mix-blend-overlay"></div>}
                        </div>

                        {isActive && (
                          <div className="absolute -bottom-1 -right-1 bg-background-dark rounded-full p-0.5 border border-surface">
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '16px' }}>check_circle</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`text-lg ${isActive ? 'font-bold text-white' : 'font-medium text-text-main/80'} truncate pr-2 group-hover:text-white transition-colors`}>{profile.name}</h3>
                          <span className={`text-xs font-mono ${isActive ? 'text-primary bg-primary/10 border-primary/20' : 'text-text-muted bg-white/5 border-white/10 group-hover:text-text-main'} px-1.5 py-0.5 rounded border transition-colors`}>UPLOAD</span>
                        </div>
                        <div className={`flex items-center gap-3 text-xs ${isActive ? 'text-text-muted' : 'text-text-muted/70 group-hover:text-text-muted'} transition-colors`}>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
                            <span>{profile.saveCount} save(s)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cloud_upload</span>
                            <span>Uploaded</span>
                          </div>
                        </div>
                      </div>

                      {/* Chevron */}
                      {isActive && (
                        <div className="ml-2 text-text-muted group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chevron_right</span>
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
            </ul>
          </div>

          <div className="mt-auto px-6 pb-6 relative z-10 max-w-7xl mx-auto flex items-center justify-between"></div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-dark to-transparent pointer-events-none z-20"></div>
        </main>
      </div>
    </div>
  );
}
