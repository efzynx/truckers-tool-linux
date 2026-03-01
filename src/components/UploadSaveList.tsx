import { useState } from 'react';
import type { UploadedSave } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface UploadSaveListProps {
  saves: UploadedSave[];
  profileName: string;
  onSelect: (save: UploadedSave) => void;
  onBack: () => void;
  loading: boolean;
}

export default function UploadSaveList({ saves, profileName, onSelect, onBack, loading }: UploadSaveListProps) {
  const [filterType, setFilterType] = useState<'all' | 'autosave' | 'manual'>('all');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const { t } = useLanguage();

  // Filtering and sorting
  const processedSaves = [...saves]
    .filter(save => {
      if (filterType === 'autosave') return save.isAutosave;
      if (filterType === 'manual') return !save.isAutosave;
      return true;
    })
    .sort((a, b) => {
      return sortOrder === 'az'
        ? a.saveName.localeCompare(b.saveName)
        : b.saveName.localeCompare(a.saveName);
    });

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
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>folder</span>
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">{t('saveList.title')}</span>
            </div>
            <div className="w-10"></div>
          </div>
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-white leading-none">SAVE<br/><span className="text-text-muted font-normal text-2xl">DATA</span></h1>
            <div className="text-right">
              <div className="text-xs text-text-muted font-mono mb-1">{loading ? 'DECRYPTING...' : 'READY'}</div>
              <div className="h-1 w-16 bg-surface rounded-full overflow-hidden">
                <div className={`h-full bg-primary w-2/3 ${loading ? 'animate-ping' : 'animate-pulse'}`}></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-24 pt-4 scroll-smooth no-scrollbar">
          
          {/* Profile info bar */}
          <div className="mb-4 bg-surface/90 backdrop-blur-md border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-white truncate">{profileName}</p>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Selected Profile • Uploaded</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pl-2 mb-1">
              <div className="text-xs font-mono text-text-muted uppercase tracking-wider">Saves ({processedSaves.length})</div>
              
              <div className="flex items-center gap-4">
                {/* Type Filter */}
                <div className="flex items-center bg-surface/50 rounded-lg p-1 border border-white/5">
                  <button 
                    onClick={() => setFilterType('all')} 
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${filterType === 'all' ? 'bg-primary/20 text-primary font-bold' : 'text-text-muted hover:text-white'}`}
                  >{t('saveList.filterTypeAll')}</button>
                  <button 
                    onClick={() => setFilterType('autosave')} 
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${filterType === 'autosave' ? 'bg-primary/20 text-primary font-bold' : 'text-text-muted hover:text-white'}`}
                  >{t('saveList.filterTypeAutosave')}</button>
                  <button 
                    onClick={() => setFilterType('manual')} 
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${filterType === 'manual' ? 'bg-primary/20 text-primary font-bold' : 'text-text-muted hover:text-white'}`}
                  >{t('saveList.filterTypeManual')}</button>
                </div>
                
                {/* Sort Order */}
                <button 
                  onClick={() => setSortOrder(prev => prev === 'az' ? 'za' : 'az')}
                  className="flex items-center gap-1 text-xs font-mono text-text-muted hover:text-white transition-colors p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">sort</span>
                  <span>{sortOrder === 'az' ? 'A→Z' : 'Z→A'}</span>
                </button>
              </div>
            </div>
            
            {processedSaves.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">sentiment_dissatisfied</span>
                <p className="font-mono text-sm uppercase tracking-widest text-text-muted">{t('saveList.empty')}</p>
              </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedSaves.map((save, idx) => {
              const isActive = idx === 0;

              return (
                <li key={save.siiPath}>
                  <button 
                    onClick={() => onSelect(save)}
                    disabled={loading}
                    className="group relative w-full text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait block h-full"
                  >
                    <div className="absolute inset-0 bg-primary/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`relative flex items-center h-[88px] w-full border ${isActive ? 'bg-surface border-primary/50 shadow-[0_0_15px_rgba(249,140,6,0.1)]' : 'bg-surface/60 border-white/5'} rounded-xl p-3 transition-all duration-300 hover:translate-y-[-2px] hover:bg-surface hover:border-white/10 overflow-hidden`}>
                      
                      {/* Active Indicator Strip */}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}

                      {/* Icon */}
                      <div className={`relative shrink-0 mr-4 ml-2 ${!isActive && 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                        <div className={`w-14 h-14 bg-background-dark hexagon-mask flex items-center justify-center relative overflow-hidden ring-1 ${isActive ? 'ring-primary/30' : 'ring-white/10'}`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
                          <span className={`${save.isAutosave ? "text-primary/70" : "text-text-muted"} material-symbols-outlined absolute`} style={{ fontSize: '28px' }}>
                            {save.isAutosave ? 'autorenew' : 'save'}
                          </span>
                          {isActive && <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent mix-blend-overlay"></div>}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`text-lg ${isActive ? 'font-bold text-white' : 'font-medium text-text-main/80'} truncate pr-2 group-hover:text-white transition-colors`}>{save.saveName}</h3>
                          <span className={`text-xs font-mono ${isActive ? 'text-primary bg-primary/10 border-primary/20' : 'text-text-muted bg-white/5 border-white/10 group-hover:text-text-main'} px-1.5 py-0.5 rounded border transition-colors`}>{save.isAutosave ? t('saveList.autosave') : t('saveList.manualSave')}</span>
                        </div>
                        <div className={`flex items-center gap-3 text-xs ${isActive ? 'text-text-muted' : 'text-text-muted/70 group-hover:text-text-muted'} transition-colors`}>
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
