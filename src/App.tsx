"use client";

import { useState, useCallback } from 'react';
import type { AppStep, GameType, Profile, Save, GameData } from './types';
import { scanProfiles, backupProfile, scanSaves, decryptSave, parseContent, saveChanges } from './hooks/useApi';
import WelcomeScreen from './components/WelcomeScreen';
import PathInput from './components/PathInput';
import ProfileList from './components/ProfileList';
import SaveList from './components/SaveList';
import Dashboard from './components/Dashboard';

function App() {
  // ---- App State Machine ----
  const [step, setStep] = useState<AppStep>('welcome');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [saves, setSaves] = useState<Save[]>([]);
  const [selectedSave, setSelectedSave] = useState<Save | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [siiContent, setSiiContent] = useState<string>('');
  const [siiFilePath, setSiiFilePath] = useState<string>('');

  // ---- Loading & Error states ----
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleProfileSelect = useCallback(async (profile: Profile) => {
    setSelectedProfile(profile);
    setBackupLoading(true);
    setScanError(null);
    try {
      const result = await scanSaves(profile.path);
      if (result.success) {
        setSaves(result.saves);
        setStep('save-select');
      } else {
        setScanError(result.error || 'Gagal scan saves');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBackupLoading(false);
    }
  }, []);

  const proceedToDecrypt = useCallback(async (savePath: string) => {
    try {
      // Decrypt the save file
      const decryptResult = await decryptSave(savePath);

      setSiiContent(decryptResult.content);
      setSiiFilePath(decryptResult.filePath);

      // Parse the content
      const parseResult = await parseContent(decryptResult.content);
      if (!parseResult.success) {
      setScanError(parseResult.error || 'Gagal mem-parse data');
      setStep('save-select');
      return;
    }

    setGameData(parseResult.data);
    setStep('dashboard');
  } catch (err) {
    setScanError(err instanceof Error ? err.message : 'Network error');
    setStep('save-select');
  }
}, []);

const handleSaveSelect = useCallback(async (save: Save, useBackup: boolean) => {
  setSelectedSave(save);
  
  if (useBackup && selectedProfile) {
    setBackupLoading(true);
    try {
      const result = await backupProfile(selectedProfile.path);
      if (result.success) {
        await proceedToDecrypt(save.path);
      } else {
        setScanError(result.error || 'Gagal backup');
        setStep('save-select');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBackupLoading(false);
    }
  } else {
    setBackupLoading(true);
    await proceedToDecrypt(save.path);
    setBackupLoading(false);
  }
}, [proceedToDecrypt, selectedProfile]);

const handleExit = useCallback(() => {
  setStep('welcome');
  setSelectedGame(null);
  setProfiles([]);
  setSelectedProfile(null);
  setSaves([]);
  setSelectedSave(null);
  setGameData(null);
  setSiiContent('');
  setSiiFilePath('');
  setScanError(null);
}, []);

  const handleSave = useCallback(
    async (updatedData: GameData) => {
      setSaving(true);
      try {
        const result = await saveChanges(siiFilePath, siiContent, updatedData);
        if (result.success) {
          setGameData(updatedData);
          // Update the siiContent with the new values for subsequent saves
          // Re-parse to get fresh content
          if (selectedSave) {
            const decryptResult = await decryptSave(selectedSave.path);
            if (decryptResult.success) {
              setSiiContent(decryptResult.content);
            }
          }
        }
      } finally {
        setSaving(false);
      }
    },
    [siiFilePath, siiContent, selectedSave]
  );



  // ---- Render ----

  switch (step) {
    case 'welcome':
      return <WelcomeScreen onSelect={handleGameSelect} />;

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
          loading={backupLoading}
        />
      );

    case 'save-select':
      return (
        <SaveList
          saves={saves}
          onSelect={handleSaveSelect}
          onBack={() => setStep('profile-select')}
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
