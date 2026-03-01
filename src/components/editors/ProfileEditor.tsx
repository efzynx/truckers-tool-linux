import { useState, useEffect } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProfileEditorProps {
  data: GameData;
  onChange: (updates: Partial<GameData>) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
}

const presets = [
  { label: '€10k', value: 10_000 },
  { label: '€50k', value: 50_000 },
  { label: '€100k', value: 100_000 },
  { label: '€500k', value: 500_000 },
  { label: '€1M', value: 1_000_000 },
];

export default function ProfileEditor({ data, onChange, onBack, onSave, saving, hasChanges }: ProfileEditorProps) {
  const [moneyStr, setMoneyStr] = useState(data.money.toLocaleString());
  const { t } = useLanguage();

  // Sync internal state when data changes externally (e.g. after save)
  useEffect(() => {
    if (!hasChanges) {
      setMoneyStr(data.money.toLocaleString());
    }
  }, [data.money, hasChanges]);

  const handleMoneyChange = (value: string) => {
    // allow only numbers and commas
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      setMoneyStr('');
      onChange({ money: 0 });
      return;
    }
    const num = parseInt(cleaned, 10);
    setMoneyStr(num.toLocaleString());
    onChange({ money: num });
  };

  const addMoney = (amount: number) => {
    const current = data.money || 0;
    const newVal = current + amount;
    setMoneyStr(newVal.toLocaleString());
    onChange({ money: newVal });
  };

  const resetDebt = () => {
    // Just a fun feature mimicking loan payoff
    const newVal = Math.max(0, data.money);
    if (newVal === 0) {
      addMoney(500000); // Give them a grant instead
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-24 pb-28 px-4 md:px-10 lg:px-20 w-full z-10 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-panel">
        <div className="flex items-center justify-between px-4 py-4 md:px-10 lg:px-20 mx-auto w-full">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-3xl">chevron_left</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('editor.economyTitle')}</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Profile Summary (Context) */}
      <div className="flex items-center justify-start mb-8 opacity-70">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-dark border border-white/5">
          <span className="material-symbols-outlined text-primary text-sm">person</span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase font-mono">{t('editor.financialOverride')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 w-full max-w-7xl mx-auto">
        {/* Left Column: Funds */}
        <div className="flex flex-col gap-8">
          {/* Current Funds Section */}
          <section className="flex flex-col items-start justify-center w-full animate-fade-in">
        <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] mb-4 uppercase font-display">{t('editor.currentFunds')}</h2>
        
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center justify-center bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-lg group-focus-within:border-primary/50 group-focus-within:shadow-neon transition-all duration-300">
            <span className="text-primary text-4xl mr-2 opacity-80 font-mono">€</span>
            <input 
              type="text"
              value={moneyStr}
              onChange={(e) => handleMoneyChange(e.target.value)}
              className="w-full bg-transparent border-none text-center text-4xl sm:text-5xl font-mono font-bold text-white focus:outline-none focus:ring-0 p-0 drop-shadow-[0_0_10px_rgba(249,140,6,0.4)] placeholder-white/20"
              placeholder="0"
            />
          </div>
        </div>
        
            <p className="mt-4 text-xs text-text-muted flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[14px]">info</span>
              {t('editor.tapToModify')}
            </p>
          </section>

          {/* Quick Add Chips */}
          <section className="w-full overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] mb-4 uppercase font-display">{t('editor.fastInject')}</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar px-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => addMoney(preset.value)}
                  className="flex-shrink-0 flex items-center gap-2 bg-surface hover:bg-surface/80 active:bg-primary/20 border border-white/10 active:border-primary/50 text-white px-5 py-3 rounded-xl transition-all active:scale-95 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary group-active:scale-110 transition-transform text-lg">add_circle</span>
                  <span className="font-mono font-bold tracking-wide">{preset.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Loans & Debt */}
        <div className="flex flex-col h-full justify-start mt-4 md:mt-0">
          {/* Debt Manager (Cosmetic/Reset) */}
          <section className="w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="bg-surface/80 rounded-2xl p-6 md:p-10 border border-white/5 relative overflow-hidden h-full">
              {/* Decorative background element */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-text-muted text-xs font-bold tracking-[0.1em] uppercase mb-1 font-display">{t('editor.bankLoan')}</h3>
                  <span className="text-sm text-text-muted/60 font-mono">{t('editor.repaymentManagement')}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">€ {data.money < 0 ? Math.abs(data.money).toLocaleString() : '0'}</span>
                </div>
              </div>

              {/* Slider Container - Decorative only */}
              <div className="py-2 px-1 mb-8 opacity-50 pointer-events-none">
                 <input type="range" min="0" max="100" value={data.money < 0 ? 10 : 0} readOnly className="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-not-allowed accent-primary" />
                 <div className="flex justify-between mt-3 text-[10px] text-text-muted font-mono">
                     <span>€0</span>
                     <span>€500k Max</span>
                 </div>
              </div>

          {/* Action: Pay Off */}
          <button 
            onClick={resetDebt}
            className="w-full py-3 rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/10 active:bg-secondary/20 font-medium text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer font-display"
          >
            <span className="material-symbols-outlined text-lg">credit_card_off</span>
            {t('editor.clearAllDebt')}
          </button>
          </div>
        </section>
      </div>
    </div>
      {hasChanges && (
        <div className="fixed bottom-8 right-6 z-50 animate-slide-in-up">
          <div className="absolute inset-0 bg-primary rounded-full blur animate-pulse opacity-50"></div>
          <button 
            onClick={onSave}
            disabled={saving}
            className="relative flex items-center justify-center w-16 h-16 bg-primary text-black rounded-full shadow-neon hover:shadow-neon-intense hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer"
          >
            <span className={`material-symbols-outlined text-3xl transition-transform ${saving ? 'animate-spin' : 'group-hover:rotate-12'}`}>
              {saving ? 'sync' : 'save'}
            </span>
          </button>
        </div>
      )}

      {/* Background Decoration Image */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 pointer-events-none z-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
      </div>
    </div>
  );
}
