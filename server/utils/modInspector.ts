/**
 * Parser untuk file info.sii (menyimpan metadata save game termasuk Mod/DLC)
 */

export interface ParsedDependency {
  type: string; // "mod", "dlc", "rdlc"
  id: string;   // e.g. "zeemods.dc13-super"
  name: string; // e.g. "Scania DC13-SUPER Sound & Engine Pack"
}

/**
 * Mem-parse teks konten info.sii hasil dekripsi untuk mengekstrak array dependencies[X]
 */
export function parseModDependencies(content: string): ParsedDependency[] {
  const lines = content.split('\n');
  const dependencies: ParsedDependency[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    
    // Format: dependencies[0]: "mod|id|nama" atau "dlc|id|nama"
    const match = trimmed.match(/^dependencies\[\d+\]:\s*"([^"]+)"/);
    if (match) {
      const rawString = match[1]; // e.g. "mod|zeemods.dc13-super_g5_v1.0|Scania DC13..."
      const parts = rawString.split('|');

      if (parts.length >= 3) {
        dependencies.push({
          type: parts[0],
          id: parts[1],
          name: parts[2]
        });
      } else if (parts.length === 2) {
        // Fallback jika tidak ada ID (biasanya DLC hanya dlc|eut2_east)
        dependencies.push({
          type: parts[0],
          id: '',
          name: parts[1]
        });
      } else {
        // Fallback aman
        dependencies.push({
          type: 'unknown',
          id: '',
          name: rawString
        });
      }
    }
  }

  return dependencies;
}
