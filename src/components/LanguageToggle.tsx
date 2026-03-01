import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-surface/80 p-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-lg gap-1">
      <button
        onClick={() => setLanguage('en')}
        title="English"
        className={`flex items-center justify-center w-10 h-8 rounded-lg text-xl transition-all ${
          language === 'en'
            ? 'bg-primary/20 scale-105 border border-primary/30 shadow-neon-sm'
            : 'grayscale-[80%] opacity-50 hover:grayscale-0 hover:opacity-100 hover:bg-white/5 border border-transparent'
        }`}
      >
        <span className="translate-y-px">🇺🇸</span>
      </button>
      <button
        onClick={() => setLanguage('id')}
        title="Bahasa Indonesia"
        className={`flex items-center justify-center w-10 h-8 rounded-lg text-xl transition-all ${
          language === 'id'
            ? 'bg-primary/20 scale-105 border border-primary/30 shadow-neon-sm'
            : 'grayscale-[80%] opacity-50 hover:grayscale-0 hover:opacity-100 hover:bg-white/5 border border-transparent'
        }`}
      >
        <span className="translate-y-px">🇮🇩</span>
      </button>
    </div>
  );
}
