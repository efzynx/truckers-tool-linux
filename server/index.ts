import express from 'express';
import cors from 'cors';
import profilesRouter from './routes/profiles.js';
import decryptRouter from './routes/decrypt.js';
import saveRouter from './routes/save.js';
import updateRouter from './routes/update.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', profilesRouter);
app.use('/api', decryptRouter);
app.use('/api', saveRouter);
app.use('/api', updateRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚛 Truckers Tool API running on http://localhost:${PORT}`);
});
