import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { EngagementEvent } from '../models/EngagementEvent.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, role: 'student' });
    await EngagementEvent.create({
      user: user._id,
      action: 'register',
      path: '/register',
      meta: { email },
    });
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    await EngagementEvent.create({
      user: user._id,
      action: 'login',
      path: '/login',
    });
    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.userId)
    .select('-passwordHash')
    .populate('assignedCounselor', 'name email');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.patch('/me', authRequired, async (req, res) => {
  const { interests, skills } = req.body;
  const update = {};
  if (Array.isArray(interests)) update.interests = interests.map(String);
  if (Array.isArray(skills)) update.skills = skills.map(String);
  const user = await User.findByIdAndUpdate(req.userId, update, { new: true })
    .select('-passwordHash')
    .populate('assignedCounselor', 'name email');
  res.json(user);
});

export default router;
