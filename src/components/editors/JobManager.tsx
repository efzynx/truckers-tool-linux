import { useState } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface JobManagerProps {
  data: GameData;
  onBack: () => void;
  onSaveData: (updates: { resetJobTime?: boolean; trailerRepairAll?: boolean; truckRepairAll?: boolean }) => Promise<void>;
}

export default function JobManager({ data, onBack, onSaveData }: JobManagerProps) {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const job = data.currentJob;

  const handleFixCargo = async () => {
    setIsSaving(true);
    await onSaveData({ trailerRepairAll: true, truckRepairAll: true });
    setIsSaving(false);
  };

  const handleResetDeadline = async () => {
    setIsSaving(true);
    await onSaveData({ resetJobTime: true });
    setIsSaving(false);
  };

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
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('editor.jobs.title')}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {!job ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 mt-20 opacity-50">
          <span className="material-symbols-outlined text-6xl text-text-muted">work_off</span>
          <p className="text-text-muted text-sm font-display uppercase tracking-widest">{t('editor.jobs.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto animate-fade-in">

          {/* Job Details Card */}
          <div className="flex flex-col gap-3">
            <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] mb-2 uppercase font-display">{t('editor.jobs.cargo')}</h2>
            <div className="bg-surface rounded-2xl border border-white/5 p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full translate-x-10 -translate-y-10" />

              <div className="flex items-center gap-4 mb-4 z-10">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]">
                  <span className="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg tracking-wide uppercase">
                    {job.cargo.replace('cargo.', '').replace(/_/g, ' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-medium text-text-muted uppercase">
                      ID: {job.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Route Info */}
              <div className="flex flex-col gap-2 p-4 bg-background-dark/50 rounded-xl border border-white/5 z-10 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/10 dashed-line"></div>
                  
                  {/* Origin */}
                  <div className="flex items-center gap-4 relative">
                    <div className="size-4 bg-background-dark border-2 border-primary rounded-full z-10"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{t('editor.jobs.source')}</span>
                      <span className="text-sm font-bold font-display text-white">{job.sourceCompany.replace('company.volatile.', '').replace(/\./g, ' ➔ ').toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-9 py-2 opacity-60">
                     <span className="material-symbols-outlined text-xs text-text-muted">straighten</span>
                     <span className="text-xs font-mono text-text-muted">{job.plannedDistanceKm} km</span>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-4 relative">
                    <div className="size-4 bg-primary border-2 border-primary rounded-full z-10 shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{t('editor.jobs.target')}</span>
                      <span className="text-sm font-bold font-display text-white">{job.targetCompany.replace('company.volatile.', '').replace(/\./g, ' ➔ ').toUpperCase()}</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Job Actions */}
          <div className="flex flex-col gap-4">
            <h2 className="text-text-muted text-xs font-bold tracking-[0.2em] mb-2 uppercase font-display">Job Tools</h2>
            
            <button
              onClick={handleFixCargo}
              disabled={isSaving}
              className="group relative bg-surface border border-white/5 hover:border-green-500/50 hover:bg-green-500/5 rounded-2xl p-5 text-left transition-all overflow-hidden flex items-start gap-4 cursor-pointer disabled:opacity-50"
            >
              <div className="size-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">build</span>
              </div>
              <div>
                <h3 className="font-bold text-white font-display tracking-wider mb-1 uppercase text-sm">{t('editor.jobs.fixCargo')}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-mono">{t('editor.jobs.fixCargoDesc')}</p>
              </div>
            </button>

            <button
              onClick={handleResetDeadline}
              disabled={isSaving}
              className="group relative bg-surface border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-2xl p-5 text-left transition-all overflow-hidden flex items-start gap-4 cursor-pointer disabled:opacity-50"
            >
              <div className="size-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-xl">update</span>
              </div>
              <div>
                <h3 className="font-bold text-white font-display tracking-wider mb-1 uppercase text-sm">{t('editor.jobs.resetTime')}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-mono">{t('editor.jobs.resetTimeDesc')}</p>
              </div>
            </button>

            {job.isCargoMarketJob && (
              <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-symbols-outlined text-orange-400 text-xl mt-0.5 animate-pulse">warning</span>
                <div>
                  <h4 className="font-bold text-orange-400 text-sm font-display tracking-wider mb-1">{t('editor.jobs.warningWot')}</h4>
                  <p className="text-xs text-orange-400/70 font-mono leading-relaxed">{t('editor.jobs.warningWotDesc')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
