import { useState, useCallback } from 'react';
import type { AppStep, GameType, Profile, GameData } from './types';
import { scanProfiles, backupProfile, decryptProfile, parseContent, saveChanges } from './hooks/useApi';
import WelcomeScreen from './components/WelcomeScreen';
import GameSelector from './components/GameSelector';
import PathInput from './components/PathInput';
import ProfileList from './components/ProfileList';
import BackupDialog from './components/BackupDialog';
import Dashboard from './components/Dashboard';

function App() {
  // ---- App State Machine ----
  const [step, setStep] = useState<AppStep>('welcome');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [siiContent, setSiiContent] = useState<string>('');
  const [siiFilePath, setSiiFilePath] = useState<string>('');

  // ---- Loading & Error states ----
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  // ---- Handlers ----

  const handleGameSelect = useCallback((game: GameType) => {
    setSelectedGame(game);
    setStep('path-input');
  }, []);

  const handleScanProfiles = useCallback(async (path: string) => {
    setScanLoading(true);
    setScanError(null);
    try {
      const result = await scanProfiles(path);
      if (result.success) {
        setProfiles(result.profiles);
        setStep('profile-select');
      } else {
        setScanError(result.error || 'Gagal scan profiles');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setScanLoading(false);
    }
  }, []);

  const handleProfileSelect = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    setStep('backup-confirm');
  }, []);

  const proceedToDecrypt = useCallback(async () => {
    if (!selectedProfile) return;

    try {
      // Decrypt the save file
      const decryptResult = await decryptProfile(selectedProfile.path);
      if (!decryptResult.success) {
        setScanError(decryptResult.error || 'Gagal mendekripsi');
        setStep('profile-select');
        return;
      }

      setSiiContent(decryptResult.content);
      setSiiFilePath(decryptResult.filePath);

      // Parse the content
      const parseResult = await parseContent(decryptResult.content);
      if (!parseResult.success) {
        setScanError(parseResult.error || 'Gagal mem-parse data');
        setStep('profile-select');
        return;
      }

      setGameData(parseResult.data);
      setStep('dashboard');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
      setStep('profile-select');
    }
  }, [selectedProfile]);

  const handleBackup = useCallback(async () => {
    if (!selectedProfile) return;
    setBackupLoading(true);
    try {
      const result = await backupProfile(selectedProfile.path);
      if (result.success) {
        await proceedToDecrypt();
      } else {
        setScanError(result.error || 'Gagal backup');
        setStep('profile-select');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBackupLoading(false);
    }
  }, [selectedProfile, proceedToDecrypt]);

  const handleSkipBackup = useCallback(async () => {
    setBackupLoading(true);
    await proceedToDecrypt();
    setBackupLoading(false);
  }, [proceedToDecrypt]);

  const handleSave = useCallback(
    async (updatedData: GameData) => {
      setSaving(true);
      setSaveSuccess(null);
      try {
        const result = await saveChanges(siiFilePath, siiContent, updatedData);
        setSaveSuccess(result.success);
        if (result.success) {
          setGameData(updatedData);
          // Update the siiContent with the new values for subsequent saves
          // Re-parse to get fresh content
          const decryptResult = await decryptProfile(selectedProfile!.path);
          if (decryptResult.success) {
            setSiiContent(decryptResult.content);
          }
        }
      } catch {
        setSaveSuccess(false);
      } finally {
        setSaving(false);
        // Auto-hide the save status after 4 seconds
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    },
    [siiFilePath, siiContent, selectedProfile]
  );

  const handleExit = useCallback(() => {
    setStep('welcome');
    setSelectedGame(null);
    setProfiles([]);
    setSelectedProfile(null);
    setGameData(null);
    setSiiContent('');
    setSiiFilePath('');
    setSaveSuccess(null);
    setScanError(null);
  }, []);

  // ---- Render ----

  switch (step) {
    case 'welcome':
      return <WelcomeScreen onContinue={() => setStep('game-select')} />;

    case 'game-select':
      return <GameSelector onSelect={handleGameSelect} />;

    case 'path-input':
      return (
        <PathInput
          game={selectedGame!}
          onScan={handleScanProfiles}
          loading={scanLoading}
          error={scanError}
          onBack={() => setStep('game-select')}
        />
      );

    case 'profile-select':
      return (
        <ProfileList
          profiles={profiles}
          onSelect={handleProfileSelect}
          onBack={() => setStep('path-input')}
        />
      );

    case 'backup-confirm':
      return (
        <BackupDialog
          profileName={selectedProfile?.name || ''}
          onBackup={handleBackup}
          onSkip={handleSkipBackup}
          loading={backupLoading}
        />
      );

    case 'dashboard':
      return (
        <Dashboard
          data={gameData!}
          onSave={handleSave}
          saving={saving}
          onBack={handleExit}
          profileId={selectedProfile?.name || ''}
        />
      );

    default:
      return null;
  }
}

export default App;
