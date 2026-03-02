import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { GarageData, TruckData } from '../../types';

type GarageFilter = 'all' | 'owned' | 'locked';

interface GarageEditorProps {
  garages: GarageData[];
  trucks: TruckData[];
  targetGarages: Record<string, number>;
  onChange: (cityId: string, status: number) => void;
  onReplaceTargets: (newTargets: Record<string, number>) => void;
}

export default function GarageEditor({ garages, trucks, targetGarages, onChange, onReplaceTargets }: GarageEditorProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<GarageFilter>('all');
  const [selectedGarage, setSelectedGarage] = useState<GarageData | null>(null);
  const [isAnimatingAll, setIsAnimatingAll] = useState(false);

  const handleUnlockAll = () => {
    setIsAnimatingAll(true);
    setTimeout(() => setIsAnimatingAll(false), 600);
    const newTargets: Record<string, number> = {};
    garages.forEach(g => {
      newTargets[g.id] = 3;
    });
    onReplaceTargets(newTargets);
  };

  const handleUpgradeOwned = () => {
    setIsAnimatingAll(true);
    setTimeout(() => setIsAnimatingAll(false), 600);
    const newTargets: Record<string, number> = { ...targetGarages };
    garages.forEach(g => {
      if (g.status > 0 && g.status < 3) {
        newTargets[g.id] = 3;
      }
    });
    onReplaceTargets(newTargets);
  };

  const currentLevel = (g: GarageData) => {
    const targetStatus = targetGarages[g.id];
    return targetStatus !== undefined ? targetStatus : g.status;
  };

  const handleCityClick = (g: GarageData) => {
    setSelectedGarage(g);
  };

  const handleModalAction = (status: number) => {
    if (!selectedGarage) return;
    onChange(selectedGarage.id, status);
  };

  const handleRevertModal = () => {
    if (!selectedGarage) return;
    const restored = { ...targetGarages };
    delete restored[selectedGarage.id];
    onReplaceTargets(restored);
  };

  // Stats
  const stats = useMemo(() => {
    const total = garages.length;
    const owned = garages.filter(g => currentLevel(g) > 0).length;
    const locked = total - owned;
    return { total, owned, locked };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garages, targetGarages]);

  // Filtered garages
  const filteredGarages = useMemo(() => {
    if (filter === 'owned') return garages.filter(g => currentLevel(g) > 0);
    if (filter === 'locked') return garages.filter(g => currentLevel(g) === 0);
    return garages;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garages, targetGarages, filter]);

  const getStatusColor = (status: number) => {
    if (status >= 3) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
    if (status === 2) return 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]';
    if (status === 1) return 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
    return 'bg-surface/50 border-white/5 text-text-muted hover:text-white hover:border-white/20';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 3) return 'domain_verification';
    if (status === 2) return 'home_work';
    if (status > 0) return 'storefront';
    return 'add_circle';
  };

  const getStatusLabel = (status: number) => {
    if (status >= 3) return t('garage.sizeLarge');
    if (status === 2) return t('garage.sizeMedium');
    if (status === 1) return t('garage.sizeSmall');
    return t('garage.sizeLocked');
  };

  const getAssignedTrucks = (g: GarageData) => {
    if (!g.trucks || g.trucks.length === 0) return [];
    return g.trucks.map(tid => trucks.find(t => t.id === tid)).filter(Boolean) as TruckData[];
  };

  return (
    <>
    <section className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="bg-surface/80 rounded-2xl p-6 border border-white/5 relative overflow-hidden group mb-6">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <span className="material-symbols-outlined text-8xl text-warning">warehouse</span>
        </div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-background-dark border border-warning/20 flex items-center justify-center">
             <span className="material-symbols-outlined text-warning text-xl">domain</span>
          </div>
          <div>
            <h3 className="text-white text-sm font-bold tracking-[0.1em] uppercase font-display">{t('dashboard.tabGarages')}</h3>
            <span className="text-xs text-text-muted/60 font-mono">{t('editor.propertyExpansion')}</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 relative z-10 mb-5">
          <div className="bg-background-dark/60 rounded-lg p-3 border border-white/5 text-center">
            <p className="text-lg font-mono font-bold text-white">{stats.total}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-display">{t('garage.stats.total')}</p>
          </div>
          <div className="bg-background-dark/60 rounded-lg p-3 border border-emerald-500/10 text-center">
            <p className="text-lg font-mono font-bold text-emerald-400">{stats.owned}</p>
            <p className="text-[9px] uppercase tracking-widest text-emerald-400/60 font-display">{t('garage.stats.owned')}</p>
          </div>
          <div className="bg-background-dark/60 rounded-lg p-3 border border-white/5 text-center">
            <p className="text-lg font-mono font-bold text-text-muted">{stats.locked}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted/60 font-display">{t('garage.stats.locked')}</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="grid grid-cols-2 gap-3 relative z-10 w-full mb-5">
            <button onClick={handleUnlockAll} className={`bg-background-dark/50 hover:bg-warning/10 border border-white/5 hover:border-warning/50 rounded-lg p-3 flex items-center justify-center gap-2 transition-all group ${isAnimatingAll ? 'scale-95 bg-warning/20 border-warning' : ''}`}>
                <span className={`material-symbols-outlined text-sm text-text-muted group-hover:text-warning transition-colors ${isAnimatingAll ? 'text-warning animate-bounce' : ''}`}>lock_open</span>
                <span className="font-display font-bold text-[10px] tracking-wider text-text-main group-hover:text-warning uppercase">{t('garage.unlockAll')}</span>
            </button>
            <button onClick={handleUpgradeOwned} className={`bg-background-dark/50 hover:bg-warning/10 border border-white/5 hover:border-warning/50 rounded-lg p-3 flex items-center justify-center gap-2 transition-all group ${isAnimatingAll ? 'scale-95 bg-warning/20 border-warning' : ''}`}>
                <span className={`material-symbols-outlined text-sm text-text-muted group-hover:text-warning transition-colors ${isAnimatingAll ? 'text-warning animate-bounce' : ''}`}>add_home_work</span>
                <span className="font-display font-bold text-[10px] tracking-wider text-text-main group-hover:text-warning uppercase">{t('garage.upgradeOwned')}</span>
            </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 relative z-10 mb-4">
          {(['all', 'owned', 'locked'] as GarageFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-widest transition-all ${
                filter === f
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-background-dark/40 text-text-muted border border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              {f === 'all' ? t('garage.filterAll') : f === 'owned' ? t('garage.filterOwned') : t('garage.filterLocked')}
              <span className="ml-1 opacity-60">
                {f === 'all' ? stats.total : f === 'owned' ? stats.owned : stats.locked}
              </span>
            </button>
          ))}
        </div>

        {/* Garage Grid */}
        <div className="relative z-10 w-full max-h-[600px] overflow-y-auto no-scrollbar rounded-lg border border-white/5 bg-background-dark/30 p-3">
          {filteredGarages.length === 0 && (
             <div className="p-8 text-center text-text-muted font-mono text-xs">{t('editor.garages.empty')}</div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredGarages.map((g, idx) => {
              const status = currentLevel(g);
              const isActiveTarget = targetGarages[g.id] !== undefined;
              
              return (
                <button 
                  key={g.id} 
                  onClick={() => handleCityClick(g)}
                  style={{ animationDelay: `${isAnimatingAll ? (idx % 20) * 30 : 0}ms` }}
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden relative group active:scale-95
                  ${getStatusColor(status)}
                  ${isActiveTarget ? 'ring-1 ring-white/30 bg-opacity-30' : ''}
                  ${isAnimatingAll ? 'animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="material-symbols-outlined text-sm opacity-80">{getStatusIcon(status)}</span>
                    <div className="flex items-center gap-1">
                      {isActiveTarget && <div className="size-1.5 rounded-full bg-white shadow-neon-sm animate-pulse"></div>}
                      <span className="text-[8px] uppercase tracking-wider font-display font-bold opacity-60">{getStatusLabel(status)}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold capitalize truncate w-full text-left opacity-90 mb-1.5">{g.id.replace(/_/g, ' ')}</span>
                  
                  {/* Slot info */}
                  {status > 0 && (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-0.5" title="Vehicles">
                        <span className="material-symbols-outlined text-[10px] opacity-50">local_shipping</span>
                        <span className="text-[9px] font-mono opacity-50">{g.vehicleCount}/{g.vehicleSlots}</span>
                      </div>
                      <div className="flex items-center gap-0.5" title="Drivers">
                        <span className="material-symbols-outlined text-[10px] opacity-50">person</span>
                        <span className="text-[9px] font-mono opacity-50">{g.driverCount}/{g.driverSlots}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>

    {/* Garage Modal */}
    {selectedGarage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedGarage(null)}
        />
        
        {/* Modal Content */}
        {(() => {
           const status = currentLevel(selectedGarage);
           const isTargeted = targetGarages[selectedGarage.id] !== undefined;
           const assignedTrucks = getAssignedTrucks(selectedGarage);

           return (
            <div className="relative w-full max-w-lg bg-surface border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
              {/* Header */}
              <div className={`p-6 border-b border-white/5 flex items-center gap-4 ${status >= 3 ? 'bg-emerald-500/10' : status > 0 ? 'bg-blue-500/10' : 'bg-background-dark/50'}`}>
                <div className={`size-12 rounded-xl flex items-center justify-center shadow-inner ${status >= 3 ? 'bg-emerald-500/20 text-emerald-400' : status > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-surface text-text-muted border border-white/10'}`}>
                   <span className="material-symbols-outlined text-2xl">{getStatusIcon(status)}</span>
                </div>
                <div className="flex-1">
                   <h2 className="text-xl font-display font-bold text-white tracking-wider capitalize">{selectedGarage.id.replace(/_/g, ' ')}</h2>
                   <p className="text-xs uppercase tracking-widest text-text-muted font-bold mt-0.5">{getStatusLabel(status)}</p>
                </div>
                <button onClick={() => setSelectedGarage(null)} className="size-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                
                {/* Status Indicator */}
                <div className="flex gap-2">
                  {[1, 2, 3].map(level => (
                    <div key={level} className={`flex-1 h-2 rounded-full ${status >= level ? (level === 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]') : 'bg-background-dark border border-white/10'}`} />
                  ))}
                </div>

                {/* Slots Overview */}
                {status > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background-dark/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-text-muted">
                        <span className="material-symbols-outlined text-lg">local_shipping</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold">Vehicles</span>
                      </div>
                      <p className="text-2xl font-mono text-white font-bold">{selectedGarage.vehicleCount} <span className="text-sm text-text-muted">/ {selectedGarage.vehicleSlots}</span></p>
                    </div>
                    <div className="bg-background-dark/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2 text-text-muted">
                        <span className="material-symbols-outlined text-lg">person</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold">Drivers</span>
                      </div>
                      <p className="text-2xl font-mono text-white font-bold">{selectedGarage.driverCount} <span className="text-sm text-text-muted">/ {selectedGarage.driverSlots}</span></p>
                    </div>
                  </div>
                )}

                {/* Assigned Trucks List */}
                {status > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase text-text-muted font-bold tracking-widest mb-3 border-b border-white/5 pb-2">{t('garage.assignedTrucks')}</h3>
                    {assignedTrucks.length > 0 ? (
                      <div className="flex flex-col gap-2">
                         {assignedTrucks.map((trk, i) => (
                           <div key={i} className="bg-background-dark/30 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="size-8 rounded bg-surface border border-white/5 flex items-center justify-center">
                                   <span className="material-symbols-outlined text-text-muted opacity-50 text-sm">local_shipping</span>
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-white uppercase">{trk.brand} {trk.model}</p>
                                   <p className="text-[10px] font-mono text-primary uppercase">{trk.licensePlate || 'NO PLATE'}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">{t('truck.odometer')}</p>
                                <p className="text-xs font-mono text-white">{trk.odometer.toLocaleString()} km</p>
                             </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="bg-background-dark/30 border border-white/5 rounded-lg border-dashed p-6 flex flex-col items-center justify-center text-center opacity-70">
                        <span className="material-symbols-outlined text-3xl mb-2 text-text-muted">sentiment_dissatisfied</span>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-display">{t('garage.noTrucks')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-background-dark border-t border-white/5 flex gap-2">
                 {isTargeted ? (
                    <button onClick={handleRevertModal} className="flex-1 bg-surface hover:bg-surface-light text-white font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">undo</span> {t('garage.revert')}
                    </button>
                 ) : (
                    <>
                      {status === 0 && (
                        <button onClick={() => handleModalAction(1)} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">add_circle</span> {t('garage.buySmall')}
                        </button>
                      )}
                      {status === 1 && (
                        <button onClick={() => handleModalAction(2)} className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">upgrade</span> {t('garage.upgradeMedium')}
                        </button>
                      )}
                      {(status === 0 || status === 1 || status === 2) && (
                        <button onClick={() => handleModalAction(3)} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold uppercase tracking-wider text-[10px] py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">stars</span> {t('garage.upgradeMax')}
                        </button>
                      )}
                    </>
                 )}
              </div>
            </div>
           );
        })()}
      </div>
    )}
    </>
  );
}
