import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

const REPO_OWNER = 'efzynx';
const REPO_NAME = 'truckers-tool-linux';

interface VersionInfo {
  stable: string | null;
  beta: string | null;
  alpha: string | null;
  currentVersion: string;
  stableUrl: string | null;
  betaUrl: string | null;
  alphaUrl: string | null;
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
      alpha: null,
      currentVersion,
      stableUrl: null,
      betaUrl: null,
      alphaUrl: null,
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
        const betaRelease = (releases as any[]).find((r) => r.prerelease === true && String(r.tag_name).toLowerCase().includes('beta'));
        if (betaRelease) {
          result.beta = (betaRelease.tag_name as string).replace(/^[vV]/, '');
          result.betaUrl = betaRelease.html_url;
        }

        const alphaRelease = (releases as any[]).find((r) => r.prerelease === true && String(r.tag_name).toLowerCase().includes('alpha'));
        if (alphaRelease) {
          result.alpha = (alphaRelease.tag_name as string).replace(/^[vV]/, '');
          result.alphaUrl = alphaRelease.html_url;
        }
      }
    } catch { /* ignore */ }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

export default router;
