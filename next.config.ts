import type { NextConfig } from "next";
import fs from "fs";
import yaml from "js-yaml";

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// Read backend port from settings.yml
let backendPort = 8097;
try {
  if (fs.existsSync('./settings.yml')) {
    const raw = fs.readFileSync('./settings.yml', 'utf-8');
    const settings = yaml.load(raw) as { app?: { port_backend?: number } };
    if (settings?.app?.port_backend) {
      backendPort = settings.app.port_backend;
    }
  }
} catch {
  // fallback to default
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  experimental: {
    proxyClientMaxBodySize: '50mb',
    cpus: 2,
    workerThreads: false,
    memoryBasedWorkersCount: false,
  },
  ...(process.env.IS_ELECTRON === 'true'
    ? {
        output: 'export',
        trailingSlash: true,
        assetPrefix: '.',
        images: { unoptimized: true }
      }
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `http://localhost:${backendPort}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
