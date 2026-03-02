import * as path from 'path';
import * as os from 'os';

/**
 * Resolves a path that might contain '~' (home directory expansion)
 */
export function expandHomeDir(filepath: string): string {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

/**
 * Checks if a requested path is safe to access.
 * This prevents Directory Traversal / Path Traversal vulnerabilities
 * (e.g. sending req.body.path = "../../../etc/passwd").
 * 
 * Allows:
 * 1. Paths that are explicitly inside the allowedBasePaths (from settings.yml)
 * 2. Paths that contain legitimate game footprints (Euro Truck Simulator 2/profiles or American Truck Simulator/profiles)
 *    useful for Linux users using Wine/Proton which places prefixes elsewhere.
 * 
 * @param requestedPath The directory path supplied by the client
 * @param allowedBasePaths Array of allowed root directories from settings.yml
 * @returns boolean true if safe, false if attempting traversal
 */
export function isSafePath(requestedPath: string, allowedBasePaths: string[]): boolean {
  if (!requestedPath) {
    return false;
  }

  // 1. Resolve to an absolute path, effectively neutralizing '../' and './'
  const resolvedRequestedPath = path.resolve(expandHomeDir(requestedPath));

  // 2. Allow if the requested path is inside explicitly allowed base paths from settings
  if (allowedBasePaths.length > 0) {
    for (const basePath of allowedBasePaths) {
      if (!basePath) continue;
      const resolvedBasePath = path.resolve(expandHomeDir(basePath));
      if (resolvedRequestedPath.startsWith(resolvedBasePath)) {
        return true;
      }
    }
  }

  // 3. Fallback for custom locations (Wine/Proton/Lutris prefixes)
  // As long as the path specifically points to a known ETS2/ATS profile directory structure.
  // We check if the path contains the distinctive profile folder structure.
  
  // Normalize path separators to forward slash for easier matching across OS
  const normalizedPath = resolvedRequestedPath.replace(/\\/g, '/');
  
  const hasGameFootprint = 
     normalizedPath.includes('/Euro Truck Simulator 2/profiles') ||
     normalizedPath.includes('/American Truck Simulator/profiles');

  if (hasGameFootprint) {
    return true;
  }

  // If neither condition is met, block it.
  return false;
}
