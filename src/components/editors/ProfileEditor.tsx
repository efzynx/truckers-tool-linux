import { useState, useEffect, useRef } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProfileEditorProps {
  data: GameData;
  onChange: (updates: Partial<GameData>) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
  onClearLoans: () => void;
}

const ADD_PRESETS = [
  { label: '+€10k', value: 10_000 },
  { label: '+€50k', value: 50_000 },
  { label: '+€100k', value: 100_000 },
  { label: '+€500k', value: 500_000 },
  { label: '+€1M', value: 1_000_000 },
];

const SET_PRESETS = [
  { label: '€100k', value: 100_000 },
  { label: '€500k', value: 500_000 },
  { label: '€1M', value: 1_000_000 },
  { label: '€5M', value: 5_000_000 },
  { label: '€50M', value: 50_000_000 },
];

export default function ProfileEditor({ data, onChange, onBack, onSave, saving, hasChanges, onClearLoans }: ProfileEditorProps) {
  const [moneyStr, setMoneyStr] = useState(data.money.toLocaleString());
  const [injectMode, setInjectMode] = useState<'add' | 'set'>('add');
  const [customAmount, setCustomAmount] = useState('');
  const { t } = useLanguage();

  // Drag-to-scroll for preset chips
  const presetScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const [hasMoreRight, setHasMoreRight] = useState(true);

  const checkScrollEdge = () => {
    const el = presetScrollRef.current;
    if (!el) return;
    setHasMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.pageX;
    scrollStartX.current = presetScrollRef.current?.scrollLeft ?? 0;
    document.body.style.userSelect = 'none';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !presetScrollRef.current) return;
    const dx = e.pageX - dragStartX.current;
    presetScrollRef.current.scrollLeft = scrollStartX.current - dx;
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (!hasChanges) {
      setMoneyStr(data.money.toLocaleString());
    }
  }, [data.money, hasChanges]);

  const handleMoneyChange = (value: string) => {
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

  const setMoney = (amount: number) => {
    setMoneyStr(amount.toLocaleString());
    onChange({ money: amount });
  };

  const handlePreset = (value: number) => {
    if (injectMode === 'add') addMoney(value);
    else setMoney(value);
  };

  const handleCustomApply = () => {
    const cleaned = customAmount.replace(/[^0-9]/g, '');
    if (!cleaned) return;
    const num = parseInt(cleaned, 10);
    if (injectMode === 'add') addMoney(num);
    else setMoney(num);
    setCustomAmount('');
  };

  const resetDebt = onClearLoans;

  const activePresets = injectMode === 'add' ? ADD_PRESETS : SET_PRESETS;

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
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('Money')}</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Profile Summary */}
      <div className="flex items-center justify-start mb-8 opacity-70">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-dark border border-white/5">
          <span className="material-symbols-outlined text-primary text-sm">person</span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase font-mono">{t('Financial Override')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 w-full max-w-7xl mx-auto">

        {/* Left: Funds */}
        <div className="flex flex-col gap-8">

          {/* Current Funds */}
          <section className="flex flex-col items-start justify-center w-full animate-fade-in">
            <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] mb-4 uppercase font-display">{t('Current Funds')}</h2>
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
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
              {t('Tap To Modify')}
            </p>
          </section>

          {/* Fast Inject */}
          <section className="w-full overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] uppercase font-display">{t('Fast Inject')}</h2>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-surface-dark border border-white/10 rounded-xl">
                <button
                  onClick={() => setInjectMode('add')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-display tracking-widest uppercase transition-all cursor-pointer ${
                    injectMode === 'add'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {t('inject.modeAdd')}
                </button>
                <button
                  onClick={() => setInjectMode('set')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-display tracking-widest uppercase transition-all cursor-pointer ${
                    injectMode === 'set'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {t('inject.modeSet')}
                </button>
              </div>
            </div>

            {/* Preset Chips — scrollable with drag */}
            <div className="relative">
              {/* Fade gradient — only show when more content exists on the right */}
              <div className={`pointer-events-none absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-surface-dark to-transparent z-10 transition-opacity duration-300 ${hasMoreRight ? 'opacity-100' : 'opacity-0'}`} />
              <div
                ref={presetScrollRef}
                className="flex gap-3 overflow-x-auto pb-3 px-1 cursor-grab active:cursor-grabbing"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={checkScrollEdge}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {activePresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset.value)}
                    className={`flex-shrink-0 flex items-center gap-2 bg-surface hover:bg-surface/80 active:scale-95 border border-white/10 text-white px-5 py-3 rounded-xl transition-all group cursor-pointer ${
                      injectMode === 'add'
                        ? 'active:bg-primary/20 active:border-primary/50'
                        : 'active:bg-emerald-500/20 active:border-emerald-500/50'
                    }`}
                  >
                    <span className={`material-symbols-outlined group-active:scale-110 transition-transform text-lg ${
                      injectMode === 'add' ? 'text-primary' : 'text-emerald-400'
                    }`}>
                      {injectMode === 'add' ? 'add_circle' : 'currency_exchange'}
                    </span>
                    <span className="font-mono font-bold tracking-wide">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">€</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                  placeholder={t('inject.customPlaceholder')}
                  className="w-full bg-surface-dark border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder-text-muted/40"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customAmount}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold font-display tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                  injectMode === 'add'
                    ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                }`}
              >
                {t('inject.apply')}
              </button>
            </div>
          </section>
        </div>

        {/* Right: Loans & Debt */}
        <div className="flex flex-col h-full justify-start mt-4 md:mt-0">
          <section className="w-full animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="bg-surface/80 rounded-2xl p-6 md:p-10 border border-white/5 relative overflow-hidden h-full">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-text-muted text-xs font-bold tracking-[0.1em] uppercase mb-1 font-display">{t('Bank Loan')}</h3>
                  <span className="text-sm text-text-muted/60 font-mono">{t('Repayment Management')}</span>
                </div>
                <div className="size-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                </div>
              </div>

              {/* Loan Cards */}
              {(data.loans ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 opacity-40">
                  <span className="material-symbols-outlined text-4xl text-text-muted">check_circle</span>
                  <p className="text-text-muted text-xs font-display uppercase tracking-widest">{t('inject.noLoans') || 'No Active Loans'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mb-6">
                  {(data.loans ?? []).map((loan, i) => {
                    const pct = loan.originalAmount > 0
                      ? Math.round((1 - loan.amount / loan.originalAmount) * 100)
                      : 0;
                    const interestPct = Math.round(loan.interestRate * 100);
                    return (
                      <div key={loan.id} className="bg-background-dark rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-display font-bold text-text-muted uppercase tracking-widest">
                            {t('inject.loanLabel') || 'Loan'} #{i + 1}
                          </span>
                          <span className="text-xs font-mono text-secondary">{interestPct}% / {loan.duration}mo</span>
                        </div>
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-white font-mono font-bold text-lg">€{loan.amount.toLocaleString()}</p>
                            <p className="text-text-muted text-[10px] font-mono">of €{loan.originalAmount.toLocaleString()}</p>
                          </div>
                          <span className="text-xs text-emerald-400 font-mono">{pct}% paid</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-secondary to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={resetDebt}
                className="w-full py-3 rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/10 active:bg-secondary/20 font-medium text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer font-display"
              >
                <span className="material-symbols-outlined text-lg">credit_card_off</span>
                {t('Clear All Debt')}
              </button>
            </div>
          </section>
        </div>

      </div>

      {/* FAB Save */}
      {hasChanges && (
        <div className="fixed bottom-8 right-6 z-50 animate-slide-in-up">
          <div className="absolute inset-0 bg-primary rounded-full blur animate-pulse opacity-50" />
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

      <div className="fixed bottom-0 left-0 w-full h-1/2 pointer-events-none z-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
      </div>
    </div>
  );
}
