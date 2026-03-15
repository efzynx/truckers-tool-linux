import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export interface ChangeEntry {
  id: string;
  labelKey: string;
  params?: Record<string, string | number>;
  icon?: string;
  color?: string;
}

interface SaveConfirmModalProps {
  isOpen: boolean;
  changeLog: ChangeEntry[];
  onConfirm: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function SaveConfirmModal({
  isOpen,
  changeLog,
  onConfirm,
  onCancel,
  saving = false,
}: SaveConfirmModalProps) {
  const { t } = useLanguage();

  // Tutup dengan Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const resolveLabel = (entry: ChangeEntry): string => {
    let label = t(entry.labelKey) as string;
    if (!label || label === entry.labelKey) label = entry.labelKey;
    if (entry.params) {
      Object.entries(entry.params).forEach(([key, val]) => {
        label = label.replace(`{${key}}`, String(val));
      });
    }
    return label;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#13151e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Top accent line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-primary to-amber-500 opacity-80" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">warning</span>
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white uppercase tracking-wider">
                {t('confirm.title')}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">{t('confirm.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/5" />

        {/* Change List */}
        <div className="px-6 py-4 max-h-56 overflow-y-auto no-scrollbar space-y-2">
          {changeLog.length === 0 ? (
            <p className="text-sm text-text-muted italic text-center py-4">
              {t('confirm.noChanges')}
            </p>
          ) : (
            changeLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/[0.03] border border-white/5"
              >
                <span
                  className={`material-symbols-outlined text-[18px] flex-shrink-0 ${entry.color ?? 'text-primary'}`}
                >
                  {entry.icon ?? 'edit'}
                </span>
                <span className="text-xs text-text-main leading-snug">
                  {resolveLabel(entry)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/5" />

        {/* Footer Actions */}
        <div className="px-6 py-5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-xs font-display font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
          >
            {t('confirm.btnCancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={saving || changeLog.length === 0}
            className="relative px-5 py-2.5 rounded-xl bg-primary text-black font-display font-bold uppercase tracking-wider text-xs hover:brightness-110 active:scale-95 transition-all shadow-neon disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                {t('dashboard.btnSaving')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                {t('confirm.btnConfirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
