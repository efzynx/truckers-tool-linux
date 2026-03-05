import { useState } from 'react';
import type { TrailerData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface TrailerEditorProps {
  trailers: TrailerData[];
  onRepairAll: () => void;
  onRepairTrailer: (id: string) => void;
}

export default function TrailerEditor({
  trailers,
  onRepairAll,
  onRepairTrailer,
}: TrailerEditorProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrailers = trailers.filter(tr =>
    tr.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Overview & Global Actions */}
      <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Stats Card */}
          <div className="flex-1 bg-surface-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4 font-display">
              {t('dashboard.statTrailers') || 'Trailer Fleet Overview'}
            </h2>
            <div className="flex items-end gap-3">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight">
                {trailers.length}
              </span>
              <span className="text-sm font-mono text-text-muted uppercase mb-1">
                {t('Trailers') || 'Trailers'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-1 bg-surface-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
             <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4 font-display">
                {t('System Controls') || 'Quick Actions'}
             </h2>
             <div className="flex flex-col sm:flex-row gap-3">
               <button
                 onClick={onRepairAll}
                 disabled={trailers.length === 0}
                 className="flex-1 py-3 px-4 rounded-xl border border-secondary/30 text-secondary hover:bg-secondary/10 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 font-display font-bold uppercase text-xs tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
               >
                 <span className="material-symbols-outlined text-lg">build</span>
                 {t('Repair All') || 'Repair All Trailers'}
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* Trailer List */}
      <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] uppercase font-display">
            {t('Owned Trailers') || 'Trailer List'}
          </h2>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
               search
            </span>
            <input
              type="text"
              placeholder={t('dashboard.searchPlaceholder') || 'Search ID'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-dark border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder-text-muted/40"
            />
          </div>
        </div>

        {filteredTrailers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 bg-surface-dark/50 border border-white/5 rounded-2xl">
            <span className="material-symbols-outlined text-5xl text-text-muted opacity-50">
               airport_shuttle
            </span>
            <p className="text-text-muted text-sm font-display tracking-widest uppercase">
               {trailers.length === 0 ? (t('dashboard.noTrucks') || 'No trailers found') : 'No results matching search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTrailers.map((tr) => {
               const maxWear = Math.max(tr.cargoDamage, tr.bodyWear);
               const healthPct = Math.max(0, Math.round((1 - maxWear) * 100));
               let healthColor = 'text-emerald-400';
               let healthBg = 'bg-emerald-400';
               if (healthPct < 50) { healthColor = 'text-red-400'; healthBg = 'bg-red-400'; }
               else if (healthPct < 80) { healthColor = 'text-amber-400'; healthBg = 'bg-amber-400'; }

               return (
                 <div key={tr.id} className="bg-surface-dark border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col transition-colors group">
                   {/* Header */}
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="material-symbols-outlined text-text-muted text-lg">airport_shuttle</span>
                         <span className="text-white font-bold font-mono tracking-wide">Trailer</span>
                       </div>
                       <p className="text-[10px] text-text-muted font-mono bg-background-dark px-2 py-0.5 rounded border border-white/5">
                         {tr.id}
                       </p>
                     </div>
                     <div className="flex items-center gap-1.5 bg-background-dark px-2 py-1 rounded-lg border border-white/5">
                        <div className={`size-2 rounded-full ${healthBg} shadow-[0_0_8px_currentColor] ${healthColor}`}></div>
                        <span className={`text-xs font-mono font-bold ${healthColor}`}>{healthPct}%</span>
                     </div>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 gap-3 mb-5 flex-1">
                     <div className="bg-background-dark/50 rounded-xl p-3 border border-white/5">
                       <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1 font-display">Cargo Dmg</p>
                       <p className="text-sm font-mono text-white">{(tr.cargoDamage * 100).toFixed(1)}%</p>
                     </div>
                     <div className="bg-background-dark/50 rounded-xl p-3 border border-white/5">
                       <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-1 font-display">Body Wear</p>
                       <p className="text-sm font-mono text-white">{(tr.bodyWear * 100).toFixed(1)}%</p>
                     </div>
                   </div>

                   {/* Action Buttons */}
                   <div className="flex gap-2 mt-auto">
                     <button
                       onClick={() => onRepairTrailer(tr.id)}
                       disabled={healthPct === 100}
                       className="flex-1 py-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 hover:shadow-[0_0_10px_rgba(236,72,153,0.3)] active:scale-95 transition-all text-xs font-bold font-display uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-transparent hover:border-secondary/30"
                     >
                       <span className="material-symbols-outlined text-[16px]">build</span>
                       Repair
                     </button>
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
