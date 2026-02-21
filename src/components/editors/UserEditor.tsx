import { useState } from 'react';
import type { GameData } from '../../types';

interface UserEditorProps {
  data: GameData;
  onChange: (updates: Partial<GameData>) => void;
}

const skillInfo = [
  { key: 'adr', label: 'ADR (Hazardous)', icon: '☣️', desc: 'Muatan berbahaya' },
  { key: 'long_dist', label: 'Long Distance', icon: '🛣️', desc: 'Jarak jauh' },
  { key: 'heavy', label: 'Heavy Cargo', icon: '🏋️', desc: 'Muatan berat / bernilai tinggi' },
  { key: 'fragile', label: 'Fragile Cargo', icon: '📦', desc: 'Muatan rapuh' },
  { key: 'urgent', label: 'Just-in-Time', icon: '⏰', desc: 'Pengiriman tepat waktu' },
  { key: 'mechanical', label: 'Eco Driving', icon: '🌿', desc: 'Mengemudi hemat bahan bakar' },
];

const xpPresets = [
  { label: '5K XP', value: 5_000 },
  { label: '50K XP', value: 50_000 },
  { label: '200K XP', value: 200_000 },
  { label: '500K XP', value: 500_000 },
  { label: '1M XP', value: 1_000_000 },
  { label: '5M XP', value: 5_000_000 },
];

export default function UserEditor({ data, onChange }: UserEditorProps) {
  const [xp, setXp] = useState(data.experiencePoints.toString());

  const handleXpChange = (value: string) => {
    setXp(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      onChange({ experiencePoints: num });
    }
  };

  const setXpTo = (value: number) => {
    setXp(value.toString());
    onChange({ experiencePoints: value });
  };

  const handleSkillChange = (key: string, value: number) => {
    const clamped = Math.min(6, Math.max(0, value));
    onChange({
      skills: { ...data.skills, [key]: clamped },
    });
  };

  const setAllSkills = (value: number) => {
    const clamped = Math.min(6, Math.max(0, value));
    const newSkills = Object.fromEntries(
      skillInfo.map((s) => [s.key, clamped])
    );
    onChange({ skills: newSkills as GameData['skills'] });
  };

  return (
    <div className="space-y-6">
      {/* XP Section */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
          <span>⭐</span> Experience Points
        </h2>
        <p className="text-text-muted text-sm">XP menentukan Level in-game driver Anda</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <label className="block text-text-secondary text-sm mb-2 font-medium">
          Total Experience Points
        </label>
        <input
          type="number"
          value={xp}
          onChange={(e) => handleXpChange(e.target.value)}
          min="0"
          className="w-full bg-bg-input border border-border rounded-xl px-4 py-4 
                     text-text-primary text-2xl font-bold
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                     transition-all"
        />

        {/* XP Presets */}
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2 font-medium">Set XP To</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {xpPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setXpTo(preset.value)}
                className="bg-bg-primary border border-border text-text-secondary text-xs font-semibold 
                           py-2.5 px-3 rounded-lg hover:border-gold/40 hover:text-gold
                           transition-all cursor-pointer active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
            <span>🛠️</span> Driver Skills
          </h2>
          <p className="text-text-muted text-sm">Setiap skill memiliki level maksimal 6</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAllSkills(0)}
            className="text-xs bg-bg-primary border border-border text-text-muted px-3 py-1.5 rounded-lg
                       hover:border-danger/40 hover:text-danger transition-all cursor-pointer"
          >
            Reset All
          </button>
          <button
            onClick={() => setAllSkills(6)}
            className="text-xs bg-accent/15 border border-accent/20 text-accent px-3 py-1.5 rounded-lg
                       hover:bg-accent/25 transition-all cursor-pointer font-medium"
          >
            Max All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {skillInfo.map((skill) => {
          const value = data.skills[skill.key as keyof typeof data.skills];
          return (
            <div key={skill.key} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-primary">{skill.label}</h4>
                  <p className="text-xs text-text-muted">{skill.desc}</p>
                </div>
                <span className="text-lg font-bold text-text-primary">
                  {value}<span className="text-text-muted text-xs font-normal">/6</span>
                </span>
              </div>

              {/* Skill Level Buttons */}
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleSkillChange(skill.key, i)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer
                               ${value === i
                                 ? 'bg-accent text-white shadow-md shadow-accent/20'
                                 : value > i
                                   ? 'bg-accent/20 text-accent'
                                   : 'bg-bg-primary text-text-muted hover:bg-bg-card'
                               }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
