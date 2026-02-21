import { useState, useMemo } from 'react';
import type { GameData } from '../types';
import ProfileEditor from './editors/ProfileEditor';
import UserEditor from './editors/UserEditor';
import TruckEditor from './editors/TruckEditor';
import GarageEditor from './editors/GarageEditor';

type TabId = 'overview' | 'bank' | 'skills' | 'garage';

interface DashboardProps {
  data: GameData;
  onSave: (data: GameData) => void;
  saving: boolean;
  onBack: () => void;
  profileId: string;
}

const sidebarTabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Profile Overview', icon: '📊' },
  { id: 'bank', label: 'Bank / Keuangan', icon: '💰' },
  { id: 'skills', label: 'Skills & XP', icon: '⭐' },
  { id: 'garage', label: 'Garage & Fleet', icon: '🏗️' },
];

/**
 * Actual ETS2 XP-per-level table (levels 1-30).
 * After level 30, each subsequent level costs a flat 6800 XP.
 * Source: https://truck-simulator.fandom.com/wiki/Experience
 */
const XP_TABLE: number[] = [
  200,  500,  700,  900, 1000, 1100, 1300, 1600, 1700, 2100, // 1-10
  2300, 2600, 2700, 2900, 3000, 3100, 3400, 3700, 4000, 4300, // 11-20
  4600, 4700, 4900, 5200, 5700, 5900, 6000, 6200, 6600, 6800, // 21-30
];
const XP_AFTER_30 = 6800;
const CUMULATIVE_XP_AT_30 = XP_TABLE.reduce((sum, v) => sum + v, 0); // 99700

/** Get cumulative XP needed to reach a given level */
function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 30) {
    let total = 0;
    for (let i = 0; i < level; i++) total += XP_TABLE[i];
    return total;
  }
  return CUMULATIVE_XP_AT_30 + (level - 30) * XP_AFTER_30;
}

/** Convert XP to level (ETS2 actual formula) */
function xpToLevel(xp: number): number {
  if (xp <= 0) return 0;
  // Check levels 1-30
  let cumulative = 0;
  for (let i = 0; i < 30; i++) {
    cumulative += XP_TABLE[i];
    if (xp < cumulative) return i; // haven't reached level i+1 yet
  }
  // After level 30, each level costs 6800 XP
  return 30 + Math.floor((xp - CUMULATIVE_XP_AT_30) / XP_AFTER_30);
}

/** Get total XP needed for next level */
function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1);
}

function xpForCurrentLevel(currentLevel: number): number {
  return xpForLevel(currentLevel);
}


export default function Dashboard({ data, onSave, saving, onBack, profileId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editableData, setEditableData] = useState<GameData>({ ...data });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (updates: Partial<GameData>) => {
    setEditableData((prev) => {
      const newData = { ...prev, ...updates };
      if (updates.skills) {
        newData.skills = { ...prev.skills, ...updates.skills };
      }
      return newData;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editableData);
    setHasChanges(false);
  };

  const level = useMemo(() => xpToLevel(editableData.experiencePoints), [editableData.experiencePoints]);
  const nextLevelXp = useMemo(() => xpForNextLevel(level), [level]);
  const currentLevelXp = useMemo(() => xpForCurrentLevel(level), [level]);
  const progressPercent = useMemo(() => {
    const xpInLevel = editableData.experiencePoints - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;
    return Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
  }, [editableData.experiencePoints, currentLevelXp, nextLevelXp]);

  const totalSkills = useMemo(() => {
    return Object.values(editableData.skills).reduce((sum, v) => sum + v, 0);
  }, [editableData.skills]);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ===== Sidebar ===== */}
      <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col animate-slide-in-left flex-shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-border">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary 
                       transition-colors cursor-pointer text-xs mb-3"
          >
            <span>←</span>
            <span>Kembali</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚛</span>
            <div>
              <h1 className="text-sm font-bold text-text-primary">Truckers Tool</h1>
              <p className="text-xs text-text-muted">Profile Editor</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all
                         cursor-pointer ${
                           activeTab === tab.id
                             ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
                             : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                         }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Info */}
        <div className="p-4 border-t border-border space-y-2">
          <h4 className="text-xs text-text-muted font-semibold uppercase tracking-wider">Info Cepat</h4>
          <div className="text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Profile:</span>
              <span className="text-text-primary font-mono">{profileId.substring(0, 12)}</span>
            </div>
            <div className="flex justify-between text-text-secondary mt-1">
              <span>Uang:</span>
              <span className="text-success font-medium">€{editableData.money.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-text-secondary mt-1">
              <span>XP:</span>
              <span className="text-gold font-medium">{editableData.experiencePoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Bar */}
        <header className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-4 flex-shrink-0 gap-2">
          <div className="text-sm text-text-muted truncate min-w-0">
            Truckers Tool — <span className="text-text-primary font-medium">Editor</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-text-muted font-mono hidden lg:inline">
              {profileId.substring(0, 12)}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`text-sm font-bold px-4 py-2 rounded-lg transition-all cursor-pointer
                         flex items-center gap-2 flex-shrink-0 whitespace-nowrap
                         ${hasChanges
                           ? 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20'
                           : 'bg-bg-card text-text-muted border border-border cursor-not-allowed'
                         }
                         disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : (
                <>
                  💾 Save
                </>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6 max-w-5xl">
              {/* Profile Overview Header */}
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">Profile Overview</h2>
                <p className="text-text-muted text-sm">Ringkasan profil dan progres Anda</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Level Circle */}
                <div className="glass rounded-2xl p-5 flex flex-col items-center">
                  <div
                    className="level-ring w-32 h-32 animate-glow-ring"
                    style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
                  >
                    <div className="level-ring-inner w-full h-full">
                      <span className="text-gold text-xs font-semibold uppercase tracking-widest">Level</span>
                      <span className="text-4xl font-bold text-text-primary">{level}</span>
                      <span className="text-xs text-text-muted">
                        {editableData.experiencePoints.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-3">
                    Next Level: {nextLevelXp.toLocaleString()} XP
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">💰</span>
                      <span className="text-text-muted text-xs">Uang</span>
                    </div>
                    <p className="text-xl font-bold text-success">
                      €{editableData.money.toLocaleString()}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">⭐</span>
                      <span className="text-text-muted text-xs">Experience</span>
                    </div>
                    <p className="text-xl font-bold text-gold">
                      {editableData.experiencePoints.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🔧</span>
                      <span className="text-text-muted text-xs">Total Skill Points</span>
                    </div>
                    <p className="text-xl font-bold text-accent">
                      {totalSkills} <span className="text-xs text-text-muted font-normal">/ 36</span>
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎮</span>
                      <span className="text-text-muted text-xs">Level</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary">
                      {level}
                    </p>
                    <div className="mt-2 w-full bg-bg-primary rounded-full h-1.5">
                      <div
                        className="bg-gold h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Overview */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span>🛠️</span> Skills Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'adr', label: 'ADR', icon: '☣️' },
                    { key: 'long_dist', label: 'Long Distance', icon: '🛣️' },
                    { key: 'heavy', label: 'Heavy Cargo', icon: '🏋️' },
                    { key: 'fragile', label: 'Fragile', icon: '📦' },
                    { key: 'urgent', label: 'Just-in-Time', icon: '⏰' },
                    { key: 'mechanical', label: 'Eco Drive', icon: '🌿' },
                  ].map((skill) => (
                    <div key={skill.key} className="bg-bg-primary rounded-xl p-3 text-center">
                      <span className="text-xl">{skill.icon}</span>
                      <p className="text-xs text-text-muted mt-1 truncate">{skill.label}</p>
                      <p className="text-lg font-bold text-text-primary mt-1">
                        {editableData.skills[skill.key as keyof typeof editableData.skills]}
                        <span className="text-text-muted text-xs font-normal">/6</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="animate-fade-in">
              <ProfileEditor data={editableData} onChange={handleChange} />
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="animate-fade-in">
              <UserEditor data={editableData} onChange={handleChange} />
            </div>
          )}

          {activeTab === 'garage' && (
            <div className="animate-fade-in">
              <div className="space-y-6">
                <TruckEditor />
                <GarageEditor />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="h-10 bg-bg-secondary border-t border-border flex items-center justify-center px-6 flex-shrink-0">
          <p className="text-xs text-text-muted">
            v2.0.0 • Berjalan secara lokal • Data tidak dikirim ke server manapun
          </p>
        </footer>
      </main>
    </div>
  );
}
