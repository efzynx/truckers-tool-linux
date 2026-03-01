import { useLanguage } from '../../i18n/LanguageContext';

export default function GarageEditor() {
  const { t } = useLanguage();
  return (
    <section className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="bg-surface/80 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
        {/* Decorative background element */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-warning/5 rounded-full blur-2xl pointer-events-none group-hover:bg-warning/10 transition-colors"></div>
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <span className="material-symbols-outlined text-8xl text-warning">warehouse</span>
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-background-dark border border-white/10 flex items-center justify-center">
             <span className="material-symbols-outlined text-warning text-xl">domain</span>
          </div>
          <div>
            <h3 className="text-white text-sm font-bold tracking-[0.1em] uppercase font-display">{t('dashboard.tabGarages')}</h3>
            <span className="text-xs text-text-muted/60 font-mono">{t('editor.propertyExpansion')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-background-dark/50 rounded-xl border border-white/5 relative z-10 text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-warning/50 mb-1">lock</span>
          <p className="text-xs text-text-muted font-mono leading-relaxed max-w-md mx-auto">
            {t('editor.garageComingSoon')}
          </p>
          <div className="mt-2 text-[10px] text-warning font-mono tracking-widest uppercase bg-warning/10 border border-warning/20 px-2 py-1 rounded">
            {t('editor.comingSoon')}
          </div>
        </div>
      </div>
    </section>
  );
}
