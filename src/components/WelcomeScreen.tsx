interface WelcomeScreenProps {
  onContinue: () => void;
}

const features = [
  {
    icon: '💰',
    title: 'Edit Money',
    desc: 'Manage your in-game currency.',
    color: 'from-green-500/20 to-emerald-900/10',
  },
  {
    icon: '⭐',
    title: 'Edit XP & Level',
    desc: 'Adjust driver experience and level.',
    color: 'from-amber-500/20 to-yellow-900/10',
  },
  {
    icon: '🔧',
    title: 'Edit Skills',
    desc: 'Unlock driver abilities.',
    color: 'from-blue-500/20 to-cyan-900/10',
  },
];

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-tire-tread relative overflow-hidden">
      {/* Subtle radial glow behind content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(25,127,230,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-2xl w-full animate-fade-in relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-float">🚛</div>
          <h1 className="text-5xl font-bold text-text-primary mb-2 tracking-tight">
            Truckers Tool
          </h1>
          <p className="text-text-secondary text-lg">
            Save Editor untuk ETS2 & ATS
          </p>
        </div>

        {/* Warning Card */}
        <div className="glass rounded-2xl p-5 mb-8 border-l-4 border-l-warning">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">⚠️</div>
            <div>
              <h2 className="text-warning font-semibold text-sm uppercase tracking-wider mb-1">
                Important
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                This tool is recommended for{' '}
                <span className="text-text-primary font-medium">New Profiles</span>{' '}
                or profiles{' '}
                <span className="text-danger font-medium">
                  NOT linked to Steam Cloud
                </span>
                . Using it on active Steam Cloud profiles may cause synchronization conflicts.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`glass rounded-xl p-6 text-center transition-all duration-300 
                         hover:scale-[1.03] hover:border-accent/40 cursor-default group`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-accent text-white font-bold py-4 px-8 rounded-xl
                     hover:bg-accent-hover transition-all duration-300 
                     text-lg cursor-pointer
                     shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:shadow-xl
                     active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>🎮</span> Start Editing <span>→</span>
        </button>

        <p className="text-center text-text-muted text-xs mt-5">
          v2.0.0 • Running locally • Data not sent to any server
        </p>
      </div>
    </div>
  );
}
