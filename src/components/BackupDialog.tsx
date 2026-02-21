interface BackupDialogProps {
  profileName: string;
  onBackup: () => void;
  onSkip: () => void;
  loading: boolean;
}

export default function BackupDialog({ profileName, onBackup, onSkip, loading }: BackupDialogProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full animate-scale-up">
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-accent/5">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">💾</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">
              Backup Profile?
            </h2>
            <p className="text-text-secondary">
              Apakah Anda ingin mem-backup profile{' '}
              <span className="text-accent font-semibold">"{profileName}"</span>{' '}
              sebelum mengedit?
            </p>
          </div>

          <div className="bg-bg-primary/50 border border-border rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-lg">📋</span>
              <div className="text-sm text-text-secondary">
                <p className="mb-1">Backup akan membuat salinan folder profil ke:</p>
                <code className="text-accent text-xs bg-accent/10 px-2 py-1 rounded">
                  {profileName}-backup.bak
                </code>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onBackup}
              disabled={loading}
              className="flex-1 bg-accent text-white font-bold py-3 px-6 rounded-xl
                         hover:bg-accent-hover transition-all duration-200 cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Membackup...
                </>
              ) : (
                <>
                  ✅ Ya, Backup
                </>
              )}
            </button>
            <button
              onClick={onSkip}
              disabled={loading}
              className="flex-1 bg-bg-primary border border-border text-text-secondary font-medium 
                         py-3 px-6 rounded-xl
                         hover:text-text-primary hover:border-accent/40 transition-all duration-200 
                         cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tidak, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
