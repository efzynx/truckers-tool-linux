import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { sendSupportReport } from '../hooks/useApi';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'idle', msg: '' });

    try {
      // Collect basic logs/context
      const contextLogs = {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        platform: typeof window !== 'undefined' ? window.navigator.platform : 'Unknown',
        screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown',
        language: typeof window !== 'undefined' ? window.navigator.language : 'Unknown',
        time: new Date().toISOString()
      };

      const payload = {
        name: formData.name,
        version: formData.version,
        message: formData.message,
        logs: contextLogs
      };

      await sendSupportReport(payload);
      setStatus({ type: 'success', msg: t('support.success') });
      
      // Reset form after 2 secs
      setTimeout(() => {
        setFormData({ name: '', version: '', message: '' });
        setStatus({ type: 'idle', msg: '' });
        onClose();
      }, 2500);
      
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Error pengiriman' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-white mb-1">
                {t('support.title')}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {t('support.desc')}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-lg"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t('support.labelName')}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(s => ({ ...s, name: e.target.value }))}
                disabled={isSubmitting}
                className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium disabled:opacity-50"
              />
            </div>

            {/* Versi Game */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t('support.labelVersion')}
              </label>
              <input
                type="text"
                required
                placeholder="ETS2 v1.53 / ATS v1.53"
                value={formData.version}
                onChange={e => setFormData(s => ({ ...s, version: e.target.value }))}
                disabled={isSubmitting}
                className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium disabled:opacity-50"
              />
            </div>

            {/* Isi Laporan */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t('support.labelMessage')}
              </label>
              <textarea
                required
                rows={5}
                placeholder={t('support.placeholderMessage')}
                value={formData.message}
                onChange={e => setFormData(s => ({ ...s, message: e.target.value }))}
                disabled={isSubmitting}
                className="w-full bg-background-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium resize-none disabled:opacity-50"
              />
            </div>

            {/* Alerts */}
            {status.type === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {status.msg}
              </div>
            )}
            {status.type === 'success' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {status.msg}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-text-muted hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all disabled:opacity-50"
              >
                {t('support.btnCancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || status.type === 'success'}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-neon-sm hover:shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    {t('support.btnSubmitting')}
                  </>
                ) : status.type === 'success' ? (
                  <span className="material-symbols-outlined">check</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    {t('support.btnSubmit')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
