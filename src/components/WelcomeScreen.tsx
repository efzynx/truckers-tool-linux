import { useState } from 'react';
import type { GameType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import SupportModal from './SupportModal';
import AboutModal from './AboutModal';

interface WelcomeScreenProps {
  onSelect: (game: GameType) => void;
}

export default function WelcomeScreen({ onSelect }: WelcomeScreenProps) {
  const { t, language } = useLanguage();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className="bg-background-dark text-text-main font-body antialiased overflow-hidden h-screen w-full select-none">
      {/* Top Right Utilities Fixed Position */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <a 
          href={`https://docs.ttl.my.id/${language}/`}
          target="_blank"
          rel="noopener noreferrer"
          title={t('welcome.docs')}
          className="flex items-center justify-center size-9 md:size-10 rounded-xl bg-surface/80 border border-white/10 backdrop-blur-md shadow-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">menu_book</span>
        </a>
        <button 
          onClick={() => setIsSupportOpen(true)}
          title={t('support.btnOpen')}
          className="flex items-center justify-center size-9 md:size-10 rounded-xl bg-surface/80 border border-white/10 backdrop-blur-md shadow-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">support_agent</span>
        </button>
        <LanguageToggle />
      </div>

      {/* Scanline Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none scanline-overlay opacity-30"></div>
      
      {/* Main Container */}
      <div className="relative flex flex-col h-full w-full">
        {/* Top Half: ETS2 Context */}
        <button 
          onClick={() => onSelect('ets2')}
          aria-label="Select Euro Truck Simulator 2" 
          className="group relative flex-1 w-full overflow-hidden border-b-2 border-background-dark hover:border-ets-orange transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-ets-orange/50 cursor-pointer"
        >
          <div 
            className="absolute inset-0 bg-cover bg-[center_65%] transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: "url('/images/ets2_hero.png')" }}
          ></div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-ets-orange/10 mix-blend-overlay group-hover:bg-ets-orange/20 transition-colors duration-500"></div>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
            <div className="animate-pulse-slow">
              <div className="flex flex-col items-center">
                <h1 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,140,0,0.6)] text-center">
                  EURO
                </h1>
                <h2 className="font-display font-bold text-2xl md:text-4xl text-ets-orange tracking-widest -mt-1 drop-shadow-[0_0_10px_rgba(255,140,0,0.8)]">
                  TRUCK SIMULATOR 2
                </h2>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <span className="material-symbols-outlined text-ets-orange text-3xl animate-bounce">arrow_upward</span>
              <span className="font-mono text-ets-orange text-sm tracking-widest uppercase">Ignition Sequence</span>
            </div>
          </div>
          {/* Neon Edge Effect */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ets-orange to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] transition-all duration-300"></div>
        </button>

        {/* Bottom Half: ATS Context */}
        <button 
          onClick={() => onSelect('ats')}
          aria-label="Select American Truck Simulator" 
          className="group relative flex-1 w-full overflow-hidden border-t-2 border-background-dark hover:border-ats-red transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-ats-red/50 cursor-pointer"
        >
          <div 
            className="absolute inset-0 bg-cover bg-[center_65%] transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: "url('/images/ats_hero.png')" }}
          ></div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
          <div className="absolute inset-0 bg-ats-red/10 mix-blend-overlay group-hover:bg-ats-red/20 transition-colors duration-500"></div>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
            <div className="animate-pulse-slow">
              <div className="flex flex-col items-center">
                <h1 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tighter drop-shadow-[0_0_15px_rgba(214,40,40,0.6)] text-center">
                  AMERICAN
                </h1>
                <h2 className="font-display font-bold text-2xl md:text-4xl text-ats-red tracking-widest -mt-1 drop-shadow-[0_0_10px_rgba(214,40,40,0.8)]">
                  TRUCK SIMULATOR
                </h2>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 opacity-0 transform -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <span className="font-mono text-ats-red text-sm tracking-widest uppercase">Ignition Sequence</span>
              <span className="material-symbols-outlined text-ats-red text-3xl animate-bounce">arrow_downward</span>
            </div>
          </div>
          {/* Neon Edge Effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ats-red to-transparent opacity-50 group-hover:opacity-100 group-hover:h-[2px] transition-all duration-300"></div>
        </button>

        {/* Version Badge */}
        <button 
          onClick={() => setIsAboutOpen(true)}
          className="absolute bottom-6 right-6 z-20 glass-panel px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all cursor-pointer shadow-lg group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse group-hover:bg-emerald-400"></div>
          <span className="font-mono text-xs text-text-muted group-hover:text-white tracking-wider transition-colors">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </button>

        {/* Center Divider Ornament */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-4 w-full justify-center">
          <div className="h-px bg-gradient-to-r from-transparent to-text-muted/20 w-16 md:w-32"></div>
          <div className="bg-background-dark border border-white/10 text-text-muted font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-[0.2em] whitespace-nowrap">
            {t('welcome.subtitle')}
          </div>
          <div className="h-px bg-gradient-to-l from-transparent to-text-muted/20 w-16 md:w-32"></div>
        </div>
      </div>

      {/* Background texture noise */}
      <div 
        className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03]" 
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
      ></div>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
