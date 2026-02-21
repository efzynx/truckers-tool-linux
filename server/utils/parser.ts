/**
 * Parser & updater for the decrypted game.sii file.
 * Uses Regex to extract and update values from the C-struct-like plain text format.
 */

export interface ParsedGameData {
  money: number;
  experiencePoints: number;
  skills: {
    adr: number;
    long_dist: number;
    heavy: number;
    fragile: number;
    urgent: number;
    mechanical: number;
  };
}

/**
 * Parse the decrypted game.sii content and extract editable values.
 * 
 * The file structure has key blocks:
 * - `economy : _nameless.XXXX.XXXX { ... }` — contains experience_points, skills
 * - `bank : _nameless.XXXX.XXXX { ... }` — contains money_account
 */
export function parseGameData(content: string): ParsedGameData {
  // ---- Money (from bank block) ----
  const moneyMatch = content.match(/bank\s*:\s*_nameless\.[^\{]*\{[\s\S]*?money_account:\s*(\d+)/);
  const money = moneyMatch ? parseInt(moneyMatch[1], 10) : 0;

  // ---- Experience Points (from economy block — first occurrence) ----
  const xpMatch = content.match(/economy\s*:\s*_nameless\.[^\{]*\{[\s\S]*?experience_points:\s*(\d+)/);
  const experiencePoints = xpMatch ? parseInt(xpMatch[1], 10) : 0;

  // ---- Skills (from economy block, right after experience_points) ----
  // We extract the economy block first, then parse skills within it
  const economyBlockMatch = content.match(/economy\s*:\s*_nameless\.[^\{]*\{([\s\S]*?)\n\}/);
  const economyBlock = economyBlockMatch ? economyBlockMatch[1] : '';

  const parseSkill = (key: string): number => {
    const match = economyBlock.match(new RegExp(`\\b${key}:\\s*(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  };

  return {
    money,
    experiencePoints,
    skills: {
      adr: parseSkill('adr'),
      long_dist: parseSkill('long_dist'),
      heavy: parseSkill('heavy'),
      fragile: parseSkill('fragile'),
      urgent: parseSkill('urgent'),
      mechanical: parseSkill('mechanical'),
    },
  };
}

/**
 * Apply updates to the game.sii content using Regex replace.
 * Only replaces values within the correct blocks to avoid affecting
 * other sections (e.g., driver experience_points).
 */
export function applyUpdates(
  content: string,
  updates: {
    money?: number;
    experiencePoints?: number;
    skills?: {
      adr?: number;
      long_dist?: number;
      heavy?: number;
      fragile?: number;
      urgent?: number;
      mechanical?: number;
    };
  }
): string {
  let result = content;

  // ---- Update money_account in bank block ----
  if (updates.money !== undefined) {
    result = result.replace(
      /(bank\s*:\s*_nameless\.[^\{]*\{[\s\S]*?money_account:\s*)\d+/,
      `$1${updates.money}`
    );
  }

  // ---- Update experience_points in economy block ----
  if (updates.experiencePoints !== undefined) {
    result = result.replace(
      /(economy\s*:\s*_nameless\.[^\{]*\{[\s\S]*?experience_points:\s*)\d+/,
      `$1${updates.experiencePoints}`
    );
  }

  // ---- Update skills in economy block ----
  if (updates.skills) {
    // We need to find the economy block and replace skills within it
    const economyBlockRegex = /(economy\s*:\s*_nameless\.[^\{]*\{)([\s\S]*?)(\n\})/;
    const blockMatch = result.match(economyBlockRegex);

    if (blockMatch) {
      let economyContent = blockMatch[2];

      const skillKeys = ['adr', 'long_dist', 'heavy', 'fragile', 'urgent', 'mechanical'] as const;

      for (const key of skillKeys) {
        if (updates.skills[key] !== undefined) {
          const skillRegex = new RegExp(`(\\b${key}:\\s*)\\d+`);
          economyContent = economyContent.replace(skillRegex, `$1${updates.skills[key]}`);
        }
      }

      result = result.replace(economyBlockRegex, `${blockMatch[1]}${economyContent}${blockMatch[3]}`);
    }
  }

  return result;
}
