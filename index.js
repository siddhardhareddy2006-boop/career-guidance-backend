import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import counselorRoutes from './routes/counselors.js';
import sessionRoutes from './routes/sessions.js';
import adminRoutes from './routes/admin.js';
import engagementRoutes from './routes/engagement.js';
import careerPathRoutes from './routes/careerPaths.js';
import careerInsightsRoutes from './routes/careerInsights.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/counselors', counselorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/career-paths', careerPathRoutes);
app.use('/api/career-insights', careerInsightsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

connectDB().catch((err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});
