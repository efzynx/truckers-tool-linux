import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface FileUploadProps {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const MAX_SIZE_MB = 50;
const ACCEPTED_TYPES = '.sii,.zip';

export default function FileUpload({ onUpload, loading, error }: FileUploadProps) {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['sii', 'zip'].includes(ext)) {
      return `Tipe file .${ext || '?'} tidak didukung. Hanya .sii dan .zip yang diterima.`;
    }
    // Check size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    setLocalError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }, [validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  const displayError = localError || error;

  const fileIcon = selectedFile?.name.endsWith('.zip') ? 'folder_zip' : 'description';

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group
          ${dragActive ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/10 hover:border-primary/40 bg-surface/30'}
          ${loading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />

        <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
          {/* Upload Icon */}
          <div className={`relative size-16 rounded-full flex items-center justify-center transition-all duration-300
            ${dragActive ? 'bg-primary/20 shadow-[0_0_20px_rgba(249,140,6,0.3)]' : 'bg-surface border border-white/10 group-hover:border-primary/30 group-hover:shadow-neon-sm'}`}>
            <span className={`material-symbols-outlined text-3xl transition-colors ${dragActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`}>
              {dragActive ? 'downloading' : 'cloud_upload'}
            </span>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className={`font-display font-bold text-sm tracking-wide transition-colors ${dragActive ? 'text-primary' : 'text-text-main'}`}>
              {dragActive ? t('path.uploadRelease') : t('path.uploadDragDrop')}
            </p>
            <p className="text-text-muted text-xs font-mono mt-1">
              {t('path.uploadOr')} <span className="text-primary underline underline-offset-2">{t('path.uploadChoose')}</span> {t('path.uploadFromComp')}
            </p>
          </div>

          {/* Accepted formats */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-text-muted bg-white/5 px-2 py-0.5 rounded">.sii</span>
            <span className="text-[10px] font-mono text-text-muted bg-white/5 px-2 py-0.5 rounded">.zip</span>
            <span className="text-[10px] font-mono text-text-muted">• max {MAX_SIZE_MB}MB</span>
          </div>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && !loading && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-primary/20 animate-fade-in">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">{fileIcon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-white truncate">{selectedFile.name}</p>
            <p className="text-xs text-text-muted font-mono">
              {(selectedFile.size / 1024).toFixed(1)} KB
              {selectedFile.name.endsWith('.zip') && ' • Archive'}
              {selectedFile.name.endsWith('.sii') && ' • Save File'}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setLocalError(null); }}
            className="size-8 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-primary/20 animate-pulse">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl animate-spin">sync</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">{t('path.uploadProgressTitle')}</p>
            <p className="text-xs text-text-muted font-mono">{t('path.uploadProgressDesc')}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fade-in">
          <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
          <p className="text-xs font-mono">{displayError}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || loading}
        className="w-full bg-primary hover:bg-orange-500 active:scale-[0.98] text-black font-display font-bold text-xl py-4 rounded-xl shadow-neon transition-all duration-200 flex items-center justify-center group relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {!loading && (
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
        )}
        {loading ? (
          <span className="material-symbols-outlined mr-2 text-2xl animate-spin">data_usage</span>
        ) : (
          <span className="material-symbols-outlined mr-2 text-2xl">upload_file</span>
        )}
        {loading ? 'UPLOADING...' : 'UPLOAD & ANALYZE'}
      </button>
    </div>
  );
}
