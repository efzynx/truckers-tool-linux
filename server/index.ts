import express from 'express';
import cors from 'cors';
import { getSettings } from './utils/settings.js';
import profilesRouter from './routes/profiles.js';
import decryptRouter from './routes/decrypt.js';
import saveRouter from './routes/save.js';
import updateRouter from './routes/update.js';
import uploadRouter from './routes/upload.js';


const settings = getSettings();
const app = express();
const PORT = process.env.PORT || settings.app.port_backend;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', profilesRouter);
app.use('/api', decryptRouter);
app.use('/api', saveRouter);
app.use('/api', updateRouter);
app.use('/api', uploadRouter);


// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: settings.app.name,
    timestamp: new Date().toISOString(),
  });
});

// Settings endpoint (public, non-sensitive)
app.get('/api/settings', (_req, res) => {
  res.json({
    app: { name: settings.app.name },
    admin: settings.admin,
    paths: settings.paths,
    upload: {
      max_file_size_mb: settings.upload.max_file_size_mb,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚛 Truckers Tool API running on http://localhost:${PORT}`);
});
