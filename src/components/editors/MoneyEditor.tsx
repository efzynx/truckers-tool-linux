import React, { useMemo, useState } from 'react';
import type { GameData } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface MoneyEditorProps {
  data: GameData;
  maximizeProfit: boolean;
  onMaximizeProfit: () => void;
}

export default function MoneyEditor({ data, maximizeProfit, onMaximizeProfit }: MoneyEditorProps) {
  const { t } = useLanguage();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number | 'all'>(10);

  const profitStats = useMemo(() => {
    const logs = data.profitLogs || [];
    const displayedLogs = displayLimit === 'all' ? logs : logs.slice(-displayLimit);
    const count = displayedLogs.length;

    let totalRev = 0;
    let totalExp = 0;
    
    if (maximizeProfit) {
      totalRev = count * 9999999;
      totalExp = 0;
    } else {
      for (const log of displayedLogs) {
        totalRev += log.revenue;
        totalExp += (log.wage + log.maintenance + log.fuel);
      }
    }
    
    return {
      revenue: totalRev,
      expenses: totalExp,
      net: totalRev - totalExp,
      count,
      logs,
      displayedLogs
    };
  }, [data.profitLogs, maximizeProfit, displayLimit]);

  // Generate points for the SVG chart
  const chartData = useMemo(() => {
    const logsToChart = profitStats.displayedLogs;
    if (logsToChart.length === 0) return { areaPath: '', linePath: '', maxNet: 1, minNet: 0, calculatedLogs: [], stepX: 0, height: 200, width: 800 };

    let maxNet = -Infinity;
    let minNet = Infinity;
    
    const calculatedLogs = logsToChart.map(log => {
      const rev = maximizeProfit ? 9999999 : log.revenue;
      const exp = maximizeProfit ? 0 : (log.wage + log.maintenance + log.fuel);
      const net = rev - exp;
      if (net > maxNet) maxNet = net;
      if (net < minNet) minNet = net;
      return { rev, exp, net };
    });

    // Add some padding to max/min
    if (maxNet === minNet) {
      maxNet += 100;
      minNet -= 100;
    }
    
    const range = maxNet - minNet;
    const height = 200; // SVG height
    const width = 800; // SVG viewBox width

    const stepX = width / Math.max(1, (calculatedLogs.length - 1));

    const points = calculatedLogs.map((log, i) => {
      const x = i * stepX;
      // Invert Y because SVG 0 is at top
      const y = height - ((log.net - minNet) / range) * height;
      return `${x},${y}`;
    });

    const areaPath = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
    const linePath = `M${points.join(' L')}`;

    return { areaPath, linePath, maxNet, minNet, calculatedLogs, stepX, height, width };
  }, [profitStats.displayedLogs, maximizeProfit]);

  const formatCompact = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <h3 className="text-xs uppercase font-display font-bold tracking-widest text-text-muted mb-2">{t('dashboard.tabMoney')} - {t('inject.modeAdd')} ({displayLimit === 'all' ? 'All' : 'Last ' + profitStats.count})</h3>
             <span className="text-3xl font-mono font-bold text-green-400">€{profitStats.revenue.toLocaleString()}</span>
          </div>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <h3 className="text-xs uppercase font-display font-bold tracking-widest text-text-muted mb-2">Expenses ({displayLimit === 'all' ? 'All' : 'Last ' + profitStats.count})</h3>
             <span className="text-3xl font-mono font-bold text-red-400">€{profitStats.expenses.toLocaleString()}</span>
          </div>
          <div className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <h3 className="text-xs uppercase font-display font-bold tracking-widest text-text-muted mb-2">{t('profit.analytics')} ({displayLimit === 'all' ? 'All' : 'Last ' + profitStats.count})</h3>
             <span className={`text-3xl font-mono font-bold ${profitStats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {profitStats.net >= 0 ? '+' : ''}€{profitStats.net.toLocaleString()}
             </span>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl p-6 relative overflow-hidden">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm uppercase font-display font-bold tracking-widest text-text-main">{t('user.tabProfit')}</h3>
             <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-background-dark/50 p-1 rounded-xl border border-white/5">
                {[10, 25, 50, 'all'].map(limit => (
                  <button
                    key={limit}
                    onClick={() => setDisplayLimit(limit as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-display tracking-widest uppercase transition-all ${
                      displayLimit === limit ? 'bg-primary/20 text-primary border border-primary/20' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    {limit === 'all' ? 'All' : limit}
                  </button>
                ))}
              </div>

              {!maximizeProfit && (
                <button
                  onClick={onMaximizeProfit}
                  className="group relative flex items-center gap-2 px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300 font-display font-black text-[10px] uppercase tracking-widest overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  <span>Max Profit</span>
                </button>
              )}
            </div>
           </div>
           
           {chartData.calculatedLogs.length > 0 ? (
             <div className="relative w-full h-[300px] mt-8" onMouseLeave={() => setHoverIndex(null)}>
                <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2={chartData.width} y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1={chartData.height/2} x2={chartData.width} y2={chartData.height/2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1={chartData.height} x2={chartData.width} y2={chartData.height} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Area */}
                  <path d={chartData.areaPath} fill="url(#chartGradient)" className="transition-all duration-1000" />
                  {/* Line */}
                  <path d={chartData.linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

                  {/* Hover interaction points */}
                  {chartData.calculatedLogs.map((log, i) => {
                    const x = i * chartData.stepX;
                    const y = chartData.height - ((log.net - chartData.minNet) / (chartData.maxNet - chartData.minNet)) * chartData.height;
                    return (
                      <g key={i} className="cursor-crosshair" onMouseEnter={() => setHoverIndex(i)}>
                        {/* Invisible large rect for easier hover targeting */}
                        <rect x={x - chartData.stepX/2} y={0} width={chartData.stepX} height={chartData.height} fill="transparent" />
                        
                        {/* Highlight dot if hovered */}
                        {hoverIndex === i && (
                          <>
                            <line x1={x} y1={0} x2={x} y2={chartData.height} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                            <circle cx={x} cy={y} r="6" fill="#10b981" stroke="#111827" strokeWidth="2" />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip */}
                {hoverIndex !== null && (() => {
                  const logY = ((chartData.calculatedLogs[hoverIndex].net - chartData.minNet) / (chartData.maxNet - chartData.minNet)) * 100;
                  const percentX = (hoverIndex / Math.max(1, chartData.calculatedLogs.length - 1)) * 100;
                  const isHigh = logY > 50;
                  const isNearRight = percentX > 80;
                  const isNearLeft = percentX < 20;
                  
                  return (
                    <div 
                      className={`absolute z-50 bg-[#1a1f2b]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl pointer-events-none transform transition-all duration-100 ${isHigh ? 'translate-y-4' : '-translate-y-[calc(100%+16px)]'} ${isNearRight ? '-translate-x-full' : isNearLeft ? 'translate-x-0' : '-translate-x-1/2'}`}
                      style={{ 
                        left: `${percentX}%`,
                        top: `${100 - logY}%`
                      }}
                    >
                    <div className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-black font-display">Entry #{hoverIndex + 1}</div>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs text-text-muted font-mono font-medium">Revenue</span>
                        <span className="text-xs text-green-400 font-mono font-bold">+€{formatCompact(chartData.calculatedLogs[hoverIndex].rev)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs text-text-muted font-mono font-medium">Expenses</span>
                        <span className="text-xs text-red-400 font-mono font-bold">-€{formatCompact(chartData.calculatedLogs[hoverIndex].exp)}</span>
                      </div>
                      <div className="h-px w-full bg-white/10 my-1"></div>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs text-white font-display font-black uppercase tracking-wider">Net</span>
                        <span className={`text-sm font-mono font-bold ${chartData.calculatedLogs[hoverIndex].net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {chartData.calculatedLogs[hoverIndex].net >= 0 ? '+' : ''}€{formatCompact(chartData.calculatedLogs[hoverIndex].net)}
                        </span>
                      </div>
                    </div>
                    </div>
                  );
                })()}
             </div>
           ) : (
             <div className="text-center py-10 text-text-muted font-mono text-sm">No profit history available.</div>
           )}
        </div>
      </div>
    </div>
  );
}
