import { Router } from 'express';
import { User } from '../models/User.js';

const router = Router();

router.get('/', async (_req, res) => {
  const counselors = await User.find({ role: 'counselor' })
    .select('name email createdAt')
    .sort({ name: 1 })
    .lean();
  res.json(counselors);
});

export default router;
