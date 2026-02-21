import type { Profile } from '../types';

interface ProfileListProps {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
  onBack: () => void;
}

export default function ProfileList({ profiles, onSelect, onBack }: ProfileListProps) {
  const activeProfiles = profiles.filter((p) => !p.isBackup);
  const backupProfiles = profiles.filter((p) => p.isBackup);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Top bar */}
      <div className="absolute top-6 left-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary 
                     transition-colors cursor-pointer text-sm glass rounded-lg px-3 py-1.5"
        >
          <span>←</span>
          <span>Kembali</span>
        </button>
        <span className="text-text-muted text-sm">
          <span className="text-lg mr-1">🚛</span> Truckers Tool
        </span>
      </div>

      <div className="max-w-3xl w-full animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-primary mb-2 tracking-tight">
            Profil Ditemukan
          </h2>
          <p className="text-text-secondary">
            Ditemukan <span className="text-accent font-bold">{activeProfiles.length}</span> profil
            {backupProfiles.length > 0 && (
              <span> dan <span className="text-text-muted">{backupProfiles.length} cadangan</span></span>
            )}
          </p>
        </div>

        {activeProfiles.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-text-secondary">Tidak ada profil yang ditemukan di path ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProfiles.map((profile) => (
              <button
                key={profile.path}
                onClick={() => onSelect(profile)}
                className="glass rounded-xl p-5 text-left
                           hover:border-accent/50 transition-all duration-300
                           cursor-pointer group active:scale-[0.97]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center
                                  group-hover:bg-accent/20 transition-colors">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-text-primary font-semibold truncate group-hover:text-accent transition-colors">
                      {profile.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-text-muted font-mono truncate">{profile.path}</p>
                <div className="mt-3 flex justify-end">
                  <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Select →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Backup profiles */}
        {backupProfiles.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm text-text-muted font-semibold mb-3 uppercase tracking-wider">
              Profil Cadangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {backupProfiles.map((profile) => (
                <div
                  key={profile.path}
                  className="glass rounded-xl p-4 text-left opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span className="text-text-muted text-sm truncate">{profile.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
