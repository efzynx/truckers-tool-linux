import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const REPO_OWNER = 'efzynx';
const REPO_NAME = 'truckers-tool-linux';

interface VersionInfo {
  stable: string | null;
  beta: string | null;
  currentVersion: string;
  stableUrl: string | null;
  betaUrl: string | null;
}

router.get('/check-update', async (_req: Request, res: Response) => {
  try {
    // Read current version from package.json
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    const currentVersion = pkg.version;

    const result: VersionInfo = {
      stable: null,
      beta: null,
      currentVersion,
      stableUrl: null,
      betaUrl: null,
    };

    // Fetch latest stable release
    try {
      const stableRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
      );
      if (stableRes.ok) {
        const data = (await stableRes.json()) as { tag_name: string; html_url: string };
        result.stable = data.tag_name.replace(/^[vV]/, '');
        result.stableUrl = data.html_url;
      }
    } catch { /* ignore */ }

    // Fetch latest pre-release
    try {
      const releasesRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`
      );
      if (releasesRes.ok) {
        const releases = await releasesRes.json();
        const prerelease = (releases as any[]).find((r) => r.prerelease === true);
        if (prerelease) {
          result.beta = (prerelease.tag_name as string).replace(/^[vV]/, '');
          result.betaUrl = prerelease.html_url;
        }
      }
    } catch { /* ignore */ }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

export default router;
