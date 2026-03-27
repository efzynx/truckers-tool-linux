import { useState, useEffect } from 'react';
import { getMods } from '../hooks/useApi';

export interface ModItem {
  type: string;
  id: string;
  name: string;
}

interface ModInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveFilePath?: string;
}

export default function ModInspectorModal({ isOpen, onClose, saveFilePath }: ModInspectorModalProps) {
  const [mods, setMods] = useState<ModItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mod' | 'dlc'>('mod');

  useEffect(() => {
    if (isOpen && saveFilePath) {
      fetchMods();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, saveFilePath]);

  const fetchMods = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMods(saveFilePath as string);
      if (result.success) {
        setMods(result.mods || []);
      } else {
        setError(result.error || 'Gagal memuat daftar mod.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredMods = mods.filter(m => {
    if (activeTab === 'mod') return m.type === 'mod';
    return m.type === 'dlc' || m.type === 'rdlc';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-neon-sm">
              <span className="material-symbols-outlined">discover_tune</span>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide uppercase">Mod Inspector</h2>
              <p className="text-xs font-mono text-text-muted">Melihat daftar Mod & DLC aktif</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 pt-4 flex gap-2 border-b border-white/5 bg-background-dark/50">
          <button 
            onClick={() => setActiveTab('mod')} 
            className={`px-4 py-2 border-b-2 font-display text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'mod' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          >
            MODS ({mods.filter(m => m.type === 'mod').length})
          </button>
          <button 
            onClick={() => setActiveTab('dlc')} 
            className={`px-4 py-2 border-b-2 font-display text-xs font-bold tracking-widest uppercase transition-all ${(activeTab === 'dlc') ? 'border-blue-400 text-blue-400' : 'border-transparent text-text-muted hover:text-white'}`}
          >
            DLC ({mods.filter(m => m.type === 'dlc' || m.type === 'rdlc').length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-text-muted">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
              <p className="font-mono text-xs">Menganalisis info.sii...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5">error</span>
              <div>
                <p className="text-sm font-bold">Gagal Memeriksa Mod</p>
                <p className="text-xs opacity-80 mt-1">{error}</p>
                {saveFilePath && !saveFilePath.includes('temp') && (
                    <p className="text-xs opacity-60 mt-2 font-mono">Pastikan `info.sii` berada di folder dashboard yang tepat.</p>
                )}
              </div>
            </div>
          )}

          {!loading && !error && filteredMods.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted text-center">
              <span className="material-symbols-outlined text-4xl opacity-30">view_in_ar</span>
              <p className="mt-2 text-sm">Tidak ditemukan {activeTab === 'mod' ? 'Mod' : 'DLC'} yang aktif</p>
            </div>
          )}

          {!loading && !error && filteredMods.length > 0 && (
            <div className="flex flex-col gap-2">
              {filteredMods.map((mod, index) => (
                <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${activeTab === 'mod' ? 'bg-primary/10 text-primary' : 'bg-blue-400/10 text-blue-400'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {activeTab === 'mod' ? 'widgets' : 'stars'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-display font-medium text-white group-hover:text-primary transition-colors">
                        {mod.name}
                      </span>
                      {mod.id && (
                        <span className="text-[10px] font-mono text-text-muted mt-0.5">
                          ID: {mod.id}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-1 rounded-full border ${activeTab === 'mod' ? 'border-primary/20 bg-primary/5 text-primary' : 'border-blue-400/20 bg-blue-400/5 text-blue-400'}`}>
                    {mod.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-background-dark/50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-white/10 text-xs font-display font-bold tracking-widest uppercase hover:bg-white/5 text-text-muted hover:text-white transition-all">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
