"use client";

import { useState, useCallback } from 'react';
import type { AppStep, GameType, Profile, Save, GameData, UploadedSave, UploadedProfile, UploadResponse } from './types';
import { scanProfiles, backupProfile, scanSaves, decryptSave, parseContent, saveChanges, downloadSave, uploadProfileFile, decryptUploadedSave, cleanupUpload } from './hooks/useApi';
import WelcomeScreen from './components/WelcomeScreen';
import PathInput from './components/PathInput';
import ProfileList from './components/ProfileList';
import SaveList from './components/SaveList';
import UploadProfileList from './components/UploadProfileList';
import UploadSaveList from './components/UploadSaveList';
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

  // ---- Upload State ----
  const [uploadedProfiles, setUploadedProfiles] = useState<UploadedProfile[]>([]);
  const [selectedUploadProfile, setSelectedUploadProfile] = useState<UploadedProfile | null>(null);
  const [selectedUploadSaveName, setSelectedUploadSaveName] = useState<string>('');
  const [uploadTempDir, setUploadTempDir] = useState<string>('');
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isZipUpload, setIsZipUpload] = useState(false);

  // ---- Loading & Error states ----
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
      const decryptResult = await decryptSave(savePath);

      setSiiContent(decryptResult.content);
      setSiiFilePath(decryptResult.filePath);

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

  // ---- Upload Handlers ----

  const handleFileUpload = useCallback(async (file: File) => {
    setScanLoading(true);
    setScanError(null);
    setIsUploadMode(true);

    try {
      const result: UploadResponse = await uploadProfileFile(file);

      if (!result.success) {
        setScanError(result.error || 'Gagal upload file');
        return;
      }

      if (result.tempDir) {
        setUploadTempDir(result.tempDir);
      }

      if (result.type === 'sii') {
        // SII: directly parse and go to dashboard
        setSiiContent(result.content || '');
        setSiiFilePath(result.filePath || '');

        const parseResult = await parseContent(result.content || '');
        if (!parseResult.success) {
          setScanError(parseResult.error || 'Gagal mem-parse data');
          return;
        }

        setGameData(parseResult.data);
        setSelectedProfile({ name: file.name.replace('.sii', ''), path: '', isBackup: false });
        setIsZipUpload(false);
        setStep('dashboard');
      } else if (result.type === 'zip') {
        // ZIP: show profile list first
        if (result.profiles && result.profiles.length > 0) {
          setUploadedProfiles(result.profiles);
          setIsZipUpload(true);
          setStep('upload-profile-select');
        } else {
          setScanError('Tidak ditemukan profile/save game di dalam file ZIP.');
        }
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setScanLoading(false);
    }
  }, []);

  const handleUploadProfileSelect = useCallback((profile: UploadedProfile) => {
    setSelectedUploadProfile(profile);
    setSelectedProfile({ name: profile.name, path: '', isBackup: false });
    setStep('upload-save-select');
  }, []);

  const handleUploadedSaveSelect = useCallback(async (save: UploadedSave) => {
    setBackupLoading(true);
    setScanError(null);
    setSelectedUploadSaveName(save.saveName);

    try {
      const decryptResult = await decryptUploadedSave(save.fullPath);

      if (!decryptResult.success) {
        setScanError(decryptResult.error || 'Gagal mendekripsi file');
        return;
      }

      setSiiContent(decryptResult.content);
      setSiiFilePath(decryptResult.filePath);

      const parseResult = await parseContent(decryptResult.content);
      if (!parseResult.success) {
        setScanError(parseResult.error || 'Gagal mem-parse data');
        return;
      }

      setGameData(parseResult.data);
      setSelectedProfile({ name: save.profileName, path: '', isBackup: false });
      setStep('dashboard');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBackupLoading(false);
    }
  }, []);

  const handleExit = useCallback(async () => {
    // Cleanup temp directory if in upload mode
    if (isUploadMode && uploadTempDir) {
      try {
        await cleanupUpload(uploadTempDir);
      } catch {
        // Silent cleanup failure
      }
    }

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
    setUploadedProfiles([]);
    setSelectedUploadProfile(null);
    setSelectedUploadSaveName('');
    setUploadTempDir('');
    setIsUploadMode(false);
    setIsZipUpload(false);
  }, [isUploadMode, uploadTempDir]);

  const handleSave = useCallback(
    async (updatedData: GameData) => {
      setSaving(true);
      try {
        const result = await saveChanges(siiFilePath, siiContent, updatedData);
        if (result.success) {
          setGameData(updatedData);
          // Update the siiContent with the new values for subsequent saves
          if (isUploadMode) {
            const savePath = siiFilePath.replace(/\/game\.sii$/, '');
            const decryptResult = await decryptUploadedSave(savePath);
            if (decryptResult.success) {
              setSiiContent(decryptResult.content);
            }
          } else if (selectedSave) {
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
    [siiFilePath, siiContent, selectedSave, isUploadMode]
  );

  const handleDownload = useCallback(
    async (updatedData: GameData) => {
      setDownloading(true);
      try {
        await downloadSave(siiContent, updatedData);
      } catch (err) {
        console.error('Download error:', err);
      } finally {
        setDownloading(false);
      }
    },
    [siiContent]
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
          onUpload={handleFileUpload}
          loading={scanLoading}
          error={scanError}
          onBack={() => setStep('welcome')}
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

    case 'upload-profile-select':
      return (
        <UploadProfileList
          profiles={uploadedProfiles}
          onSelect={handleUploadProfileSelect}
          onBack={() => setStep('path-input')}
          loading={backupLoading}
        />
      );

    case 'upload-save-select':
      return (
        <UploadSaveList
          saves={selectedUploadProfile?.saves || []}
          profileName={selectedUploadProfile?.name || ''}
          onSelect={handleUploadedSaveSelect}
          onBack={() => uploadedProfiles.length > 1 ? setStep('upload-profile-select') : setStep('path-input')}
          loading={backupLoading}
        />
      );

    case 'dashboard':
      return (
        <Dashboard
          data={gameData!}
          onSave={handleSave}
          onDownload={handleDownload}
          saving={saving}
          downloading={downloading}
          onBack={handleExit}
          profileId={selectedProfile?.name || ''}
          uploadContext={{
            isUploadMode,
            isZipUpload,
            gameType: selectedGame,
            profileName: selectedUploadProfile?.name || selectedProfile?.name || '',
            saveName: selectedUploadSaveName,
          }}
        />
      );

    default:
      return null;
  }
}

export default App;
