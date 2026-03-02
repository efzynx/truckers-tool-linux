import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { TruckData } from '../../types';

// Brand display names and colors
const BRAND_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  scania: { name: 'Scania', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', icon: '🇸🇪' },
  volvo: { name: 'Volvo', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', icon: '🇸🇪' },
  man: { name: 'MAN', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: '🇩🇪' },
  daf: { name: 'DAF', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10', icon: '🇳🇱' },
  mercedes: { name: 'Mercedes-Benz', color: 'text-slate-300 border-slate-400/30 bg-slate-500/10', icon: '🇩🇪' },
  iveco: { name: 'Iveco', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', icon: '🇮🇹' },
  renault: { name: 'Renault', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: '🇫🇷' },
  unknown: { name: 'Unknown', color: 'text-text-muted border-white/10 bg-white/5', icon: '🚛' },
};

function getBrandConfig(brand: string) {
  return BRAND_CONFIG[brand.toLowerCase()] || BRAND_CONFIG.unknown;
}

function formatModel(model: string): string {
  return model
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/(\d+)\s/g, '$1 ');
}

interface TruckEditorProps {
  trucks: TruckData[];
  onRepairAll: () => void;
  onRefuelAll: () => void;
  onRepairTruck: (truckId: string) => void;
  onRefuelTruck: (truckId: string) => void;
}

export default function TruckEditor({ trucks, onRepairAll, onRefuelAll, onRepairTruck, onRefuelTruck }: TruckEditorProps) {
  const { t } = useLanguage();
  const [expandedTruck, setExpandedTruck] = useState<string | null>(null);

  // Sort: player's current truck first, then by brand
  const sortedTrucks = useMemo(() => {
    return [...trucks].sort((a, b) => {
      if (a.isPlayerTruck && !b.isPlayerTruck) return -1;
      if (!a.isPlayerTruck && b.isPlayerTruck) return 1;
      return a.brand.localeCompare(b.brand);
    });
  }, [trucks]);

  const getAvgDamage = (truck: TruckData): number => {
    const damages = [truck.engineWear, truck.transmissionWear, truck.cabinWear, truck.chassisWear, truck.wheelsWear];
    return (damages.reduce((sum, d) => sum + d, 0) / damages.length) * 100;
  };

  const getDamageColor = (pct: number) => {
    if (pct < 5) return 'text-emerald-400';
    if (pct < 20) return 'text-amber-400';
    return 'text-red-400';
  };

  const getDamageBarColor = (pct: number) => {
    if (pct < 5) return 'bg-emerald-400';
    if (pct < 20) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const getFuelColor = (pct: number) => {
    if (pct > 50) return 'text-emerald-400';
    if (pct > 20) return 'text-amber-400';
    return 'text-red-400';
  };

  const getFuelBarColor = (pct: number) => {
    if (pct > 50) return 'bg-emerald-400';
    if (pct > 20) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const wearParts = (truck: TruckData) => [
    { label: 'Engine', value: truck.engineWear, icon: 'manufacturing' },
    { label: 'Transmission', value: truck.transmissionWear, icon: 'settings' },
    { label: 'Cabin', value: truck.cabinWear, icon: 'airline_seat_recline_normal' },
    { label: 'Chassis', value: truck.chassisWear, icon: 'build' },
    { label: 'Wheels', value: truck.wheelsWear, icon: 'tire_repair' },
  ];

  return (
    <section className="w-full animate-fade-in" style={{ animationDelay: '50ms' }}>
      <div className="bg-surface/80 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <span className="material-symbols-outlined text-8xl text-primary">local_shipping</span>
        </div>
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-background-dark border border-primary/20 flex items-center justify-center">
             <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
          </div>
          <div>
            <h3 className="text-white text-sm font-bold tracking-[0.1em] uppercase font-display">{t('dashboard.tabTrucks')}</h3>
            <span className="text-xs text-text-muted/60 font-mono">{t('editor.vehicleManagement')}</span>
          </div>
        </div>

        {/* Fleet Summary */}
        <div className="grid grid-cols-2 gap-2 relative z-10 mb-5">
          <div className="bg-background-dark/60 rounded-lg p-3 border border-white/5 text-center">
            <p className="text-lg font-mono font-bold text-white">{trucks.length}</p>
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-display">{t('dashboard.tabTrucks')}</p>
          </div>
          <div className="bg-background-dark/60 rounded-lg p-3 border border-primary/10 text-center">
            <p className="text-lg font-mono font-bold text-primary">
              {trucks.length > 0 ? `${Math.round(trucks.reduce((s, tr) => s + tr.fuelRelative, 0) / trucks.length * 100)}%` : '—'}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-primary/60 font-display">Avg {t('truck.fuel')}</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10 w-full mb-5">
          <button onClick={onRepairAll} className="bg-background-dark/50 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/50 rounded-lg p-3 flex items-center justify-center gap-2 transition-all group cursor-pointer">
            <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-emerald-400 transition-colors">build</span>
            <span className="font-display font-bold text-[10px] tracking-wider text-text-main group-hover:text-emerald-400 uppercase">{t('truck.repairAll')}</span>
          </button>
          <button onClick={onRefuelAll} className="bg-background-dark/50 hover:bg-primary/10 border border-white/5 hover:border-primary/50 rounded-lg p-3 flex items-center justify-center gap-2 transition-all group cursor-pointer">
            <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-primary transition-colors">local_gas_station</span>
            <span className="font-display font-bold text-[10px] tracking-wider text-text-main group-hover:text-primary uppercase">{t('truck.refuelAll')}</span>
          </button>
        </div>

        {/* Truck List */}
        <div className="relative z-10 w-full max-h-[600px] overflow-y-auto no-scrollbar rounded-lg border border-white/5 bg-background-dark/30 p-3">
          {trucks.length === 0 && (
            <div className="p-8 text-center text-text-muted font-mono text-xs">{t('editor.trucks.empty')}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedTrucks.map((truck) => {
              const brandCfg = getBrandConfig(truck.brand);
              const avgDamage = getAvgDamage(truck);
              const fuelPct = Math.round(truck.fuelRelative * 100);
              const isExpanded = expandedTruck === truck.id;

              return (
                <div
                  key={truck.id}
                  className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${
                    truck.isPlayerTruck 
                      ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(255,140,0,0.1)]' 
                      : 'border-white/5 bg-surface/30 hover:border-white/15'
                  }`}
                >
                  {/* Clickable Header */}
                  <button
                    onClick={() => setExpandedTruck(isExpanded ? null : truck.id)}
                    className="w-full text-left p-3.5 cursor-pointer focus:outline-none"
                  >
                    {/* Current truck badge */}
                    {truck.isPlayerTruck && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[8px] font-display font-bold uppercase tracking-widest text-primary">
                          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_4px_rgba(255,140,0,0.8)] animate-pulse"></span>
                          {t('truck.currentTruck')}
                        </span>
                      </div>
                    )}

                    {/* Header: Brand + Model */}
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm ${brandCfg.color}`}>
                        {brandCfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display font-bold text-white uppercase tracking-wider truncate">
                          {brandCfg.name}
                        </p>
                        <p className="text-[10px] font-mono text-text-muted truncate">{formatModel(truck.model)}</p>
                      </div>
                      <span className={`material-symbols-outlined text-lg text-text-muted/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    {/* Quick Info Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-text-muted/60">badge</span>
                        <span className="text-[10px] font-mono text-text-muted">{truck.licensePlate || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-text-muted/60">speed</span>
                        <span className="text-[10px] font-mono text-text-muted">{truck.odometer.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className={`material-symbols-outlined text-[12px] ${getFuelColor(fuelPct)}`}>local_gas_station</span>
                        <span className={`text-[10px] font-mono font-bold ${getFuelColor(fuelPct)}`}>{fuelPct}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`material-symbols-outlined text-[12px] ${getDamageColor(avgDamage)}`}>build</span>
                        <span className={`text-[10px] font-mono font-bold ${getDamageColor(avgDamage)}`}>
                          {avgDamage < 0.5 ? 'OK' : `${avgDamage.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-3.5 pb-4 border-t border-white/5 pt-3">
                    
                      {/* Fuel Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-text-muted/80">local_gas_station</span>
                            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-text-muted/80">{t('truck.fuel')}</span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${getFuelColor(fuelPct)}`}>{fuelPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-background-dark/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getFuelBarColor(fuelPct)}`}
                            style={{ width: `${fuelPct}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Wear Breakdown */}
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-sm text-text-muted/80">build</span>
                          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-text-muted/80">{t('truck.condition')} — Detail</span>
                        </div>
                        <div className="space-y-1.5">
                          {wearParts(truck).map(part => {
                            const pct = part.value * 100;
                            return (
                              <div key={part.label} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[12px] text-text-muted/50 w-4 shrink-0">{part.icon}</span>
                                <span className="text-[9px] font-mono text-text-muted/70 w-20 shrink-0">{part.label}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-background-dark/60 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${getDamageBarColor(pct)}`}
                                    style={{ width: `${Math.max(1, pct)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[9px] font-mono font-bold w-10 text-right shrink-0 ${getDamageColor(pct)}`}>
                                  {pct < 0.5 ? '0%' : `${pct.toFixed(1)}%`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Per-Truck Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onRepairTruck(truck.id); }}
                          className="bg-background-dark/50 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/50 rounded-lg p-2.5 flex items-center justify-center gap-1.5 transition-all group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-emerald-400 transition-colors">build</span>
                          <span className="font-display font-bold text-[9px] tracking-wider text-text-main group-hover:text-emerald-400 uppercase">Repair</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRefuelTruck(truck.id); }}
                          className="bg-background-dark/50 hover:bg-primary/10 border border-white/5 hover:border-primary/50 rounded-lg p-2.5 flex items-center justify-center gap-1.5 transition-all group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-primary transition-colors">local_gas_station</span>
                          <span className="font-display font-bold text-[9px] tracking-wider text-text-main group-hover:text-primary uppercase">Refuel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
