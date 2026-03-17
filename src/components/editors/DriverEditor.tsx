import { useState } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface DriverEditorProps {
  data: GameData;
  onBack: () => void;
}

const skillInfo = [
  { key: 'adr', label: 'HAZMAT', icon: 'science', color: 'text-purple-400' },
  { key: 'long_dist', label: 'LONG DIST', icon: 'map', color: 'text-blue-400' },
  { key: 'heavy', label: 'HEAVY', icon: 'weight', color: 'text-orange-400' },
  { key: 'fragile', label: 'FRAGILE', icon: 'wine_bar', color: 'text-yellow-400' },
  { key: 'urgent', label: 'J.I.T.', icon: 'timer', color: 'text-red-400' },
  { key: 'mechanical', label: 'ECO', icon: 'eco', color: 'text-green-400' },
];

function stateLabel(state: number, t: (k: string) => string): { label: string; color: string; icon: string } {
  if (state === 1) return { label: t('driver.stateIdle'), color: 'text-green-400', icon: 'check_circle' };
  if (state === 2) return { label: t('driver.stateOnJob'), color: 'text-blue-400', icon: 'local_shipping' };
  if (state === 3) return { label: t('driver.stateResting'), color: 'text-yellow-400', icon: 'bedtime' };
  return { label: t('driver.stateUnknown'), color: 'text-text-muted', icon: 'help' };
}

function xpToLevel(xp: number): number {
  // Approximate ETS2 level formula (same as Dashboard)
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 1000));
}

export default function DriverEditor({ data, onBack }: DriverEditorProps) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hiredDrivers = data.drivers ?? [];
  const truckMap = new Map((data.trucks ?? []).map(t => [t.id, t]));

  const selectedDriver = hiredDrivers.find(d => d.id === selectedId) ?? null;

  function getTruckLabel(truckId: string, t: (k: string) => string): { label: string; plate: string } {
    if (!truckId || truckId === 'null') return { label: t('driver.noTruck'), plate: '' };
    const truck = truckMap.get(truckId);
    if (!truck) return { label: t('driver.noTruck'), plate: '' };
    const brand = truck.brand.charAt(0).toUpperCase() + truck.brand.slice(1);
    const model = truck.model.charAt(0).toUpperCase() + truck.model.slice(1);
    return {
      label: `${brand} ${model}`,
      plate: truck.licensePlate || '',
    };
  }

  return (
    <div className="flex-1 flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 w-full z-10 overflow-y-auto no-scrollbar">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 md:left-64 lg:left-80 z-40 glass-panel">
        <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('dashboard.tabDriver')}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Context Badge */}
      <div className="flex items-center justify-start mb-8 opacity-70">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-dark border border-white/5">
          <span className="material-symbols-outlined text-primary text-sm">groups</span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase font-mono">
            {hiredDrivers.length} {t('driver.hired')}
          </span>
        </div>
      </div>

      {hiredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 mt-20 opacity-50">
          <span className="material-symbols-outlined text-6xl text-text-muted">person_off</span>
          <p className="text-text-muted text-sm font-display uppercase tracking-widest">{t('driver.noDrivers')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
          {/* Driver List */}
          <div className="flex flex-col gap-3">
            <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] mb-2 uppercase font-display">{t('driver.listTitle')}</h2>
            {hiredDrivers.map((driver, idx) => {
              const { label: stLabel, color: stColor, icon: stIcon } = stateLabel(driver.state, t);
              const isSelected = driver.id === selectedId;
              const level = xpToLevel(driver.experiencePoints);
              return (
                <button
                  key={driver.id}
                  onClick={() => setSelectedId(isSelected ? null : driver.id)}
                  className={`relative bg-surface rounded-2xl p-4 border transition-all duration-200 text-left cursor-pointer group overflow-hidden
                    ${isSelected ? 'border-primary/60 shadow-neon-sm' : 'border-white/5 hover:border-white/20'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between gap-3 z-10 relative">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-text-muted text-xl">person</span>
                      </div>
                      <div>
                        <p className="font-display font-bold text-white text-sm uppercase tracking-wide">
                          {t('driver.label')} #{idx + 1}
                        </p>
                        <p className="text-xs text-text-muted font-mono mt-0.5">
                          <span className="material-symbols-outlined text-[12px] align-middle mr-1">location_on</span>
                          {driver.currentCity || driver.hometown || '—'}
                        </p>
                        {/* Truck info mini */}
                        {(() => { const ti = getTruckLabel(driver.assignedTruck, t); return ti.label !== t('driver.noTruck') ? (
                          <p className="text-[10px] text-primary/70 font-mono mt-0.5">
                            <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">local_shipping</span>
                            {ti.label}{ti.plate ? ` · ${ti.plate}` : ''}
                          </p>
                        ) : null; })()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className={`flex items-center gap-1 text-xs font-mono font-bold ${stColor}`}>
                        <span className="material-symbols-outlined text-[14px]">{stIcon}</span>
                        {stLabel}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">
                        Lv.{level} · {(driver.experiencePoints / 1000).toFixed(1)}k XP
                      </div>
                    </div>
                  </div>

                  {/* Skill bars mini */}
                  <div className="flex gap-1 mt-3 z-10 relative">
                    {skillInfo.map(s => {
                      const val = driver.skills[s.key as keyof typeof driver.skills] as number;
                      return (
                        <div key={s.key} className="flex flex-col items-center gap-0.5 flex-1" title={s.label}>
                          <span className={`material-symbols-outlined text-[11px] ${s.color}`}>{s.icon}</span>
                          <div className="flex flex-col gap-0.5 w-full">
                            {[...Array(6)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-0.5 w-full rounded-sm ${i < val ? s.color.replace('text-', 'bg-') : 'bg-white/10'}`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Driver Detail Panel */}
          <div className="flex flex-col gap-4">
            {selectedDriver ? (
              <>
                <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] mb-2 uppercase font-display">{t('driver.detailTitle')}</h2>
                <div className="bg-surface rounded-2xl border border-white/5 p-6 flex flex-col gap-6 animate-fade-in">
                  {/* State + Info */}
                  <div className="flex flex-col gap-3">
                    {(() => {
                      const ti = getTruckLabel(selectedDriver.assignedTruck, t);
                      const rows = [
                        { icon: 'home', label: t('driver.hometown'), value: selectedDriver.hometown || '—' },
                        { icon: 'location_on', label: t('driver.currentCity'), value: selectedDriver.currentCity || '—' },
                        { icon: 'location_city', label: t('driver.garageCity'), value: selectedDriver.garageId || '—' },
                        { icon: 'local_shipping', label: t('driver.assignedTruck'), value: ti.label },
                        ...(ti.plate ? [{ icon: 'badge', label: t('driver.plate'), value: ti.plate }] : []),
                      ];
                      return rows.map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2 text-text-muted text-xs font-mono uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[15px]">{row.icon}</span>
                            {row.label}
                          </div>
                          <span className="text-white text-sm font-mono font-bold">{row.value}</span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Skills detail */}
                  <div>
                    <h3 className="text-text-muted text-xs font-bold tracking-[0.15em] uppercase font-display mb-3">{t('user.skillMatrix')}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {skillInfo.map(s => {
                        const val = selectedDriver.skills[s.key as keyof typeof selectedDriver.skills] as number;
                        return (
                          <div key={s.key} className="bg-background-dark rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`material-symbols-outlined text-[16px] ${s.color}`}>{s.icon}</span>
                                <span className="font-display font-bold text-white text-[10px] tracking-widest">{s.label}</span>
                              </div>
                              <span className="font-mono text-xs text-white/60">{val}/6</span>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-sm ${i < val ? s.color.replace('text-', 'bg-') + ' opacity-80' : 'bg-white/10'}`} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-40 bg-surface rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-4xl text-text-muted">touch_app</span>
                <p className="text-text-muted text-xs font-display uppercase tracking-widest">{t('driver.selectHint')}</p>
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  );
}
