// PM2 Ecosystem Config — Truckers Tool Linux
// Usage: pm2 start ecosystem.config.cjs

const fs = require('fs');
const yaml = require('js-yaml');

try {
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
  }
} catch (err) {
  // abaikan error jika tidak bisa membuat folder
}

// Read settings
let portFrontend = 3214;
let portBackend = 8097;

try {
  if (fs.existsSync('./settings.yml')) {
    const raw = fs.readFileSync('./settings.yml', 'utf-8');
    const settings = yaml.load(raw);
    if (settings?.app?.port_frontend) portFrontend = settings.app.port_frontend;
    if (settings?.app?.port_backend) portBackend = settings.app.port_backend;
  }
} catch {
  // use defaults
}

module.exports = {
  apps: [
    {
      name: 'ttl-frontend',
      script: 'node_modules/.bin/next',
      args: `start -p ${portFrontend}`,
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: portFrontend,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
    },
    {
      name: 'ttl-backend',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      cwd: './',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
    },
  ],
};
