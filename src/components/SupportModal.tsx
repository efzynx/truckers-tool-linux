import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { sendSupportReport } from '../hooks/useApi';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t } = useLanguage();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
  
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
        appVersion,
        gameVersion: formData.version,
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

  const handleGitHubIssue = () => {
    if (!formData.message.trim()) return;
    const title = encodeURIComponent(`[Bug Report] ${formData.name ? `from ${formData.name}` : 'User Report'} — App v${appVersion}${formData.version ? ` | Game: ${formData.version}` : ''}`);
    const body = encodeURIComponent(
      `## Bug Report\n\n**Reporter:** ${formData.name || 'Anonymous'}\n**App Version:** v${appVersion}\n**Game Version:** ${formData.version || 'Not specified'}\n\n## Description\n${formData.message}\n\n---\n*Reported via Truckers Tool Linux in-app bug reporter*`
    );
    const url = `https://github.com/efzynx/truckers-tool-linux/issues/new?title=${title}&body=${body}&labels=bug`;
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isFormFilled = formData.message.trim().length > 0;

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

            {/* App Version — auto detect */}
            <div className="flex items-center justify-between bg-background-dark/40 border border-white/5 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-primary opacity-70">memory</span>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('support.labelAppVersion')}</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary">v{appVersion}</span>
            </div>

            {/* Versi Game */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                {t('support.labelVersion')}
              </label>
              <input
                type="text"
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
            <div className="flex flex-col gap-2 pt-2">
              {/* GitHub Issue Button */}
              <button
                type="button"
                onClick={handleGitHubIssue}
                disabled={!isFormFilled}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#24292e] hover:bg-[#2f363d] border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                {t('support.btnGithub')}
                <span className="material-symbols-outlined text-[14px] opacity-60">open_in_new</span>
              </button>

              {/* Email + Cancel */}
              <div className="flex gap-3">
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
                      <span className="material-symbols-outlined text-[18px]">email</span>
                      {t('support.btnSubmit')}
                    </>
                  )}
                </button>
              </div>

              {/* Note */}
              <p className="text-[10px] text-text-muted text-center opacity-60">{t('support.githubNote')}</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
