import { Router } from 'express';
import { EngagementEvent } from '../models/EngagementEvent.js';
import jwt from 'jsonwebtoken';

const router = Router();

function optionalUserId(req) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return p.sub;
  } catch {
    return null;
  }
}

router.post('/track', async (req, res) => {
  const { action, path, meta } = req.body;
  const allowed = ['page_view', 'career_path_view'];
  if (!action || !allowed.includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }
  const userId = optionalUserId(req);
  await EngagementEvent.create({
    user: userId,
    action,
    path: path || '',
    meta: meta && typeof meta === 'object' ? meta : {},
  });
  res.status(201).json({ ok: true });
});

export default router;
