import { useState } from 'react';
import type { GameData } from '../../types';

interface ProfileEditorProps {
  data: GameData;
  onChange: (updates: Partial<GameData>) => void;
}

const presets = [
  { label: '+€100K', value: 100_000 },
  { label: '+€500K', value: 500_000 },
  { label: '+€1M', value: 1_000_000 },
  { label: '+€5M', value: 5_000_000 },
  { label: '+€10M', value: 10_000_000 },
  { label: '+€100M', value: 100_000_000 },
];

export default function ProfileEditor({ data, onChange }: ProfileEditorProps) {
  const [money, setMoney] = useState(data.money.toString());

  const handleMoneyChange = (value: string) => {
    setMoney(value);
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onChange({ money: num });
    }
  };

  const addMoney = (amount: number) => {
    const current = parseInt(money, 10) || 0;
    const newVal = current + amount;
    setMoney(newVal.toString());
    onChange({ money: newVal });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
          <span>💰</span> Bank & Finance
        </h2>
        <p className="text-text-muted text-sm">Kelola uang dalam game Anda</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <label className="block text-text-secondary text-sm mb-2 font-medium">
          Current Money
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold text-lg font-bold">€</span>
            <input
              type="number"
              value={money}
              onChange={(e) => handleMoneyChange(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-xl pl-10 pr-4 py-4 
                         text-text-primary text-2xl font-bold
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                         transition-all"
            />
          </div>
        </div>

        {/* Quick Add Presets */}
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2 font-medium">Quick Add</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => addMoney(preset.value)}
                className="bg-bg-primary border border-border text-text-secondary text-xs font-semibold 
                           py-2.5 px-3 rounded-lg hover:border-accent/40 hover:text-accent 
                           transition-all cursor-pointer active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            Uang akan langsung berubah saat Anda memuat save file di game.
            Disarankan untuk tidak melebihi <span className="text-warning font-medium">999.999.999</span> agar tidak terjadi overflow.
          </p>
        </div>
      </div>
    </div>
  );
}
