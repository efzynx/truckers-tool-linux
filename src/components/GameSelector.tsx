import type { GameType } from '../types';

interface GameSelectorProps {
  onSelect: (game: GameType) => void;
}

const games = [
  {
    id: 'ets2' as GameType,
    name: 'Euro Truck Simulator 2',
    shortName: 'ETS2',
    icon: '🇪🇺',
    description: 'Eropa — Dari London ke Istanbul',
    defaultPath: '~/.local/share/Euro Truck Simulator 2/profiles/',
    image: '/images/ets2_hero.png',
    gradient: 'from-blue-600/30 via-blue-900/20 to-transparent',
    borderColor: 'hover:border-blue-400/60',
  },
  {
    id: 'ats' as GameType,
    name: 'American Truck Simulator',
    shortName: 'ATS',
    icon: '🇺🇸',
    description: 'Amerika — Dari California ke Montana',
    defaultPath: '~/.local/share/American Truck Simulator/profiles/',
    image: '/images/ats_hero.png',
    gradient: 'from-red-600/30 via-red-900/20 to-transparent',
    borderColor: 'hover:border-red-400/60',
  },
];

export default function GameSelector({ onSelect }: GameSelectorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Top branding */}
      <div className="absolute top-6 left-8 text-text-muted text-sm font-medium flex items-center gap-2">
        <span className="text-lg">🚛</span> Truckers Tool
      </div>

      <div className="max-w-4xl w-full animate-fade-in">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-text-primary mb-3 tracking-tight">
            Pilih Game
          </h2>
          <p className="text-text-secondary text-lg">
            Pilih game yang ingin kamu edit save-nya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, i) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`relative overflow-hidden rounded-2xl border border-border ${game.borderColor}
                         transition-all duration-500 cursor-pointer
                         hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]
                         group text-left h-[340px]`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Background image */}
              <img
                src={game.image}
                alt={game.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 
                           group-hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent" />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-6 z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{game.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">
                      {game.shortName}
                    </h3>
                    <p className="text-text-secondary text-sm font-medium">
                      {game.name}
                    </p>
                  </div>
                </div>

                <p className="text-text-muted text-sm mb-4">{game.description}</p>

                {/* Detected Path badge */}
                <div className="glass-light rounded-lg px-3 py-2 flex items-center gap-2 max-w-full overflow-hidden">
                  <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">📁</span>
                  <code className="text-xs text-text-secondary font-mono truncate block min-w-0">
                    {game.defaultPath}
                  </code>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-text-muted text-xs mt-8">
          v{__APP_VERSION__} • Berjalan secara lokal • Data tidak dikirim ke server manapun
        </p>
      </div>
    </div>
  );
}

export { games };
