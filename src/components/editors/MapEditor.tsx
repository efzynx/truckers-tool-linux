import { useLanguage } from '../../i18n/LanguageContext';
import type { GameData } from '../../types';

interface MapEditorProps {
  data: GameData;
  onDiscoverMap: () => void;
}

export default function MapEditor({
  data,
  onDiscoverMap,
}: MapEditorProps) {
  const { t } = useLanguage();
  
  const cities = data.mapDiscovery?.visitedCities || 0;
  const dealers = data.mapDiscovery?.unlockedDealers || 0;
  const recruits = data.mapDiscovery?.unlockedRecruitments || 0;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Overview & Global Actions */}
      <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Stats Card */}
          <div className="flex-1 bg-surface-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4 font-display">
              {t('Map Discovery Overview') || 'Map Discovery Overview'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="material-symbols-outlined text-primary text-xl">location_city</span>
                     <span className="text-sm font-bold font-display uppercase tracking-widest text-white">{t('Cities') || 'Cities'}</span>
                  </div>
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">
                    {cities}
                  </span>
               </div>
               
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="material-symbols-outlined text-orange-400 text-xl">store</span>
                     <span className="text-sm font-bold font-display uppercase tracking-widest text-white">{t('Dealers') || 'Dealers'}</span>
                  </div>
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">
                    {dealers}
                  </span>
               </div>
               
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="material-symbols-outlined text-blue-400 text-xl">badge</span>
                     <span className="text-sm font-bold font-display uppercase tracking-widest text-white">{t('Agencies') || 'Agencies'}</span>
                  </div>
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">
                    {recruits}
                  </span>
               </div>
            </div>
            
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <span className="material-symbols-outlined text-primary mt-0.5 text-xl">info</span>
                <p className="text-xs text-text-muted leading-relaxed">
                   {t('Map Discovery Info') || 'The game only registers cities you have driven through or discovered in this save file.'}
                </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="md:w-1/3 bg-surface-dark border border-white/5 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
             <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase mb-4 font-display">
                {t('System Controls') || 'System Controls'}
             </h2>
             <div className="flex flex-col gap-3 h-full">
               <button
                 onClick={onDiscoverMap}
                 className="w-full py-4 px-4 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 font-display font-bold uppercase text-xs tracking-wider cursor-pointer"
               >
                 <span className="material-symbols-outlined text-lg">public</span>
                 {t('Unlock Visited Cities') || 'Unlock Visited Cities'}
               </button>
               <p className="text-[10px] text-text-muted mt-2 leading-relaxed text-center">
                  {t('Unlock Cities Desc') || 'Changes your visited cities status to 100% discovered for all registered cities on your map.'}
               </p>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}
