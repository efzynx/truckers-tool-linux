import { useState, useEffect, useRef } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface UserEditorProps {
  data: GameData;
  onChange: (updates: Partial<GameData>) => void;
  onBack: () => void;
  hasChanges: boolean;
}

const skillInfo = [
  { key: 'adr', label: 'HAZMAT', icon: 'science', color: 'text-purple-400', bgColor: 'bg-purple-400', bgHover: 'hover:bg-purple-900/20', borderFocus: 'focus-within:border-purple-500' },
  { key: 'long_dist', label: 'LONG DIST', icon: 'map', color: 'text-blue-400', bgColor: 'bg-blue-400', bgHover: 'hover:bg-blue-900/20', borderFocus: 'focus-within:border-blue-500' },
  { key: 'heavy', label: 'HEAVY', icon: 'weight', color: 'text-orange-400', bgColor: 'bg-orange-400', bgHover: 'hover:bg-orange-900/20', borderFocus: 'focus-within:border-orange-500' },
  { key: 'fragile', label: 'FRAGILE', icon: 'wine_bar', color: 'text-yellow-400', bgColor: 'bg-yellow-400', bgHover: 'hover:bg-yellow-900/20', borderFocus: 'focus-within:border-yellow-500' },
  { key: 'urgent', label: 'J.I.T.', icon: 'timer', color: 'text-red-400', bgColor: 'bg-red-400', bgHover: 'hover:bg-red-900/20', borderFocus: 'focus-within:border-red-500' },
  { key: 'mechanical', label: 'ECO-DRIVE', icon: 'eco', color: 'text-green-400', bgColor: 'bg-green-400', bgHover: 'hover:bg-green-900/20', borderFocus: 'focus-within:border-green-500' },
];

const XP_ADD_PRESETS = [
  { label: '+5K XP', value: 5_000 },
  { label: '+50K XP', value: 50_000 },
  { label: '+100K XP', value: 100_000 },
  { label: '+500K XP', value: 500_000 },
  { label: '+1M XP', value: 1_000_000 },
];

const XP_SET_PRESETS = [
  { label: '100K XP', value: 100_000 },
  { label: '500K XP', value: 500_000 },
  { label: '1M XP', value: 1_000_000 },
  { label: '5M XP', value: 5_000_000 },
  { label: '50M XP', value: 50_000_000 },
];

export default function UserEditor({ data, onChange, onBack, hasChanges }: UserEditorProps) {
  const [xpStr, setXpStr] = useState(data.experiencePoints.toLocaleString());
  const [xpMode, setXpMode] = useState<'add' | 'set'>('add');
  const [customXpAmount, setCustomXpAmount] = useState('');
  const { t } = useLanguage();

  const activeXpPresets = xpMode === 'add' ? XP_ADD_PRESETS : XP_SET_PRESETS;

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
      setXpStr(data.experiencePoints.toLocaleString());
    }
  }, [data.experiencePoints, hasChanges]);

  const handleXpChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      setXpStr('');
      onChange({ experiencePoints: 0 });
      return;
    }
    const num = parseInt(cleaned, 10);
    setXpStr(num.toLocaleString());
    onChange({ experiencePoints: num });
  };

  const addXp = (amount: number) => {
    const newVal = (data.experiencePoints || 0) + amount;
    setXpStr(newVal.toLocaleString());
    onChange({ experiencePoints: newVal });
  };

  const setXp = (amount: number) => {
    setXpStr(amount.toLocaleString());
    onChange({ experiencePoints: amount });
  };

  const handleXpPreset = (value: number) => {
    if (xpMode === 'add') addXp(value);
    else setXp(value);
  };

  const handleCustomXpApply = () => {
    const cleaned = customXpAmount.replace(/[^0-9]/g, '');
    if (!cleaned) return;
    const num = parseInt(cleaned, 10);
    if (xpMode === 'add') addXp(num);
    else setXp(num);
    setCustomXpAmount('');
  };

  const resetXp = () => {
    setXpStr('0');
    onChange({ experiencePoints: 0 });
  };

  const handleSkillChange = (key: string, value: number) => {
    const clamped = Math.min(6, Math.max(0, value));
    onChange({
      skills: { ...data.skills, [key]: clamped },
    });
  };

  const setAllSkills = (value: number) => {
    const clamped = Math.min(6, Math.max(0, value));
    const newSkills = Object.fromEntries(skillInfo.map((s) => [s.key, clamped]));
    onChange({ skills: newSkills as GameData['skills'] });
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
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-display">{t('dashboard.tabUser')}</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      {/* Context Badge */}
      <div className="flex items-center justify-start mb-8 opacity-70">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-dark border border-white/5">
          <span className="material-symbols-outlined text-blue-400 text-sm">psychology</span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase font-mono">{t('skillOverride')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 w-full max-w-7xl mx-auto">
        {/* Left Column: XP and Quick Add */}
        <div className="flex flex-col gap-8">
          {/* Experience Section */}
          <section className="flex flex-col items-start justify-center w-full animate-fade-in">
        <h2 className="text-text-muted text-sm font-bold tracking-[0.2em] mb-4 uppercase font-display">{t('Total Experience')}</h2>
        
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center justify-center bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-lg group-focus-within:border-blue-500/50 group-focus-within:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300">
            <span className="text-blue-400 text-2xl mr-3 opacity-80 font-mono">XP</span>
            <input 
              type="text"
              value={xpStr}
              onChange={(e) => handleXpChange(e.target.value)}
              className="w-full bg-transparent border-none text-center text-4xl sm:text-5xl font-mono font-bold text-white focus:outline-none focus:ring-0 p-0 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] placeholder-white/20"
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* Fast Inject XP */}
      <section className="mb-10 w-full overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-text-muted text-xs font-bold tracking-[0.2em] uppercase font-display">{t('Fast Inject')} XP</h3>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface-dark border border-white/10 rounded-xl">
            <button
              onClick={() => setXpMode('add')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-display tracking-widest uppercase transition-all cursor-pointer ${
                xpMode === 'add'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t('inject.modeAdd')}
            </button>
            <button
              onClick={() => setXpMode('set')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-display tracking-widest uppercase transition-all cursor-pointer ${
                xpMode === 'set'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t('inject.modeSet')}
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="relative">
          {/* Fade gradient right */}
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
            {activeXpPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleXpPreset(preset.value)}
              className={`flex-shrink-0 flex items-center gap-2 bg-surface hover:bg-surface/80 active:scale-95 border border-white/10 text-white px-5 py-3 rounded-xl transition-all group cursor-pointer ${
                xpMode === 'add'
                  ? 'active:bg-blue-500/20 active:border-blue-500/50'
                  : 'active:bg-emerald-500/20 active:border-emerald-500/50'
              }`}
            >
              <span className={`material-symbols-outlined group-active:scale-110 transition-transform text-lg ${
                xpMode === 'add' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {xpMode === 'add' ? 'add_circle' : 'currency_exchange'}
              </span>
              <span className="font-mono font-bold tracking-wide">{preset.label}</span>
            </button>
            ))}
          </div>
        </div>

        {/* Custom Amount + Reset */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-mono text-sm font-bold">XP</span>
            <input
              type="text"
              inputMode="numeric"
              value={customXpAmount}
              onChange={(e) => setCustomXpAmount(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomXpApply()}
              placeholder={t('inject.customPlaceholder')}
              className="w-full bg-surface-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-text-muted/40"
            />
          </div>
          <button
            onClick={handleCustomXpApply}
            disabled={!customXpAmount}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold font-display tracking-widest uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
              xpMode === 'add'
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            {t('inject.apply')}
          </button>
          <button
            onClick={resetXp}
            title="Reset XP to 0"
            className="px-3 py-2.5 rounded-xl text-sm bg-surface border border-white/5 text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
          </button>
        </div>
      </section>

    </div>

    {/* Right Column: Skill Matrix */}
    <div className="flex flex-col h-full justify-start mt-4 lg:mt-0">
      {/* Matrix Controls */}
      <section className="w-full animate-fade-in mb-6" style={{ animationDelay: '200ms' }}>
        <div className="flex justify-between items-end mb-4 px-1">
           <h3 className="text-text-muted text-xs font-bold tracking-[0.1em] uppercase font-display">{t('user.skillMatrix')}</h3>
            <div className="flex gap-2">
              <button onClick={() => setAllSkills(0)} className="text-[10px] font-mono bg-surface border border-white/5 rounded px-2 py-1 text-text-muted hover:text-white transition-colors cursor-pointer">{t('reset')}</button>
              <button onClick={() => setAllSkills(6)} className="text-[10px] font-mono bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer">{t('max all')}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skillInfo.map((skill) => {
            const value = data.skills[skill.key as keyof typeof data.skills] as number;
            return (
              <div key={skill.key} className={`bg-surface/80 rounded-2xl p-4 border border-white/5 relative overflow-hidden flex flex-col gap-3 group ${skill.bgHover} transition-colors`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${skill.color} text-2xl drop-shadow-[0_0_8px_currentColor]`}>{skill.icon}</span>
                    <span className="font-display font-bold text-white tracking-widest text-sm">{skill.label}</span>
                  </div>
                  <div className="bg-background-dark border border-white/10 px-2 py-0.5 rounded font-mono text-xs">
                     <span className="text-white font-bold">{value}</span>
                     <span className="text-white/30">/6</span>
                  </div>
                </div>

                {/* Blocks */}
                <div className="flex gap-1">
                  {[...Array(6)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSkillChange(skill.key, idx + 1)}
                      className={`h-10 flex-1 rounded-sm border ${idx < value ? `${skill.bgColor} border-transparent shadow-[0_0_8px_currentColor] opacity-80` : 'bg-background-dark border-white/5 hover:border-white/20 hover:bg-white/5'} transition-all cursor-pointer`}
                    ></button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  </div>



      
      {/* Background Decoration Image */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 pointer-events-none z-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-t from-blue-500/20 via-transparent to-transparent"></div>
      </div>
    </div>
  );
}
