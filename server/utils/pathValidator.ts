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
 * (e.g. sending req.body.path = "../../etc/passwd").
 *
 * Allows:
 * 1. Paths that are explicitly inside the allowedBasePaths (from settings.yml)
 * 2. XDG Desktop Portal FUSE paths (/run/flatpak/doc/ or /run/user/<uid>/doc/)
 *    These are granted explicitly by the user via the native file-chooser dialog
 *    inside the Flatpak sandbox — the portal is the security boundary, so they
 *    are inherently safe to trust here.
 * 3. Paths that contain legitimate game footprints (Euro Truck Simulator 2/profiles
 *    or American Truck Simulator/profiles) — useful for Wine/Proton custom prefixes.
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

  // Normalize path separators to forward slash for easier matching
  const normalizedPath = resolvedRequestedPath.replace(/\\/g, '/');

  // 3. Allow XDG Desktop Portal FUSE paths (Flatpak sandbox).
  // When the user picks a folder via the native file chooser in a Flatpak app,
  // Electron's dialog.showOpenDialog returns a portal-mounted path like:
  //   /run/flatpak/doc/<hash>/...
  //   /run/user/<uid>/doc/<hash>/...
  // The portal FUSE mount is only accessible within this sandbox session and
  // was explicitly authorised by the user, so it is safe to allow.
  const isPortalPath =
    normalizedPath.startsWith('/run/flatpak/doc/') ||
    /^\/run\/user\/\d+\/doc\//.test(normalizedPath);

  if (isPortalPath) {
    return true;
  }

  // 4. Fallback for custom locations (Wine/Proton/Lutris prefixes).
  // Allow if the path contains the distinctive ETS2/ATS profile folder structure.
  const hasGameFootprint =
    normalizedPath.includes('/Euro Truck Simulator 2/profiles') ||
    normalizedPath.includes('/American Truck Simulator/profiles');

  if (hasGameFootprint) {
    return true;
  }

  // If none of the above conditions are met, block it.
  return false;
}
