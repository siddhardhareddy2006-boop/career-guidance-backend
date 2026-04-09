import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { CareerResource } from '../models/CareerResource.js';
import { CounselingSession } from '../models/CounselingSession.js';
import { EngagementEvent } from '../models/EngagementEvent.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authRequired, requireRole('admin'));

router.get('/resources', async (_req, res) => {
  const list = await CareerResource.find().sort({ updatedAt: -1 }).lean();
  res.json(list);
});

router.get('/stats', async (_req, res) => {
  const [students, counselors, admins, resources, sessions, eventsLast7d] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'counselor' }),
    User.countDocuments({ role: 'admin' }),
    CareerResource.countDocuments({ isPublished: true }),
    CounselingSession.countDocuments(),
    EngagementEvent.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);
  const byAction = await EngagementEvent.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
  ]);
  res.json({
    users: { students, counselors, admins },
    resources,
    sessions,
    engagement: { eventsLast7d, byAction },
  });
});

router.get('/staff', async (_req, res) => {
  const [admins, counselors] = await Promise.all([
    User.find({ role: 'admin' }).select('name email role createdAt updatedAt').sort({ name: 1 }).lean(),
    User.find({ role: 'counselor' }).select('name email role createdAt updatedAt').sort({ name: 1 }).lean(),
  ]);
  res.json({ admins, counselors });
});

router.post('/staff', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  if (!['admin', 'counselor'].includes(role)) {
    return res.status(400).json({ message: 'Role must be admin or counselor' });
  }
  const normalized = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) return res.status(409).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    email: normalized,
    passwordHash,
    name: String(name).trim(),
    role,
  });
  res.status(201).json({
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.patch('/staff/:id', async (req, res) => {
  const staff = await User.findById(req.params.id);
  if (!staff || !['admin', 'counselor'].includes(staff.role)) {
    return res.status(404).json({ message: 'Staff member not found' });
  }
  const { name, role, password } = req.body;
  const targetId = staff._id.toString();

  if (role === 'counselor' && staff.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot demote the only administrator' });
    }
  }
  if (role && role !== 'admin' && targetId === req.userId) {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'You cannot remove admin access from the only administrator' });
    }
  }

  if (name !== undefined && String(name).trim()) staff.name = String(name).trim();
  if (password !== undefined && String(password).length > 0) {
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    staff.passwordHash = await bcrypt.hash(String(password), 10);
  }
  if (role && ['admin', 'counselor'].includes(role)) staff.role = role;

  await staff.save();
  res.json({
    _id: staff._id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  });
});

router.delete('/staff/:id', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const staff = await User.findById(req.params.id);
  if (!staff || !['admin', 'counselor'].includes(staff.role)) {
    return res.status(404).json({ message: 'Staff member not found' });
  }
  if (staff.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) return res.status(400).json({ message: 'Cannot delete the only administrator' });
  }
  if (staff.role === 'counselor') {
    const openSessions = await CounselingSession.countDocuments({
      counselor: staff._id,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (openSessions > 0) {
      return res.status(400).json({
        message: `This counselor has ${openSessions} pending or confirmed session(s). Resolve them before removing this account.`,
      });
    }
    await User.updateMany({ assignedCounselor: staff._id }, { $set: { assignedCounselor: null } });
  }
  await User.findByIdAndDelete(staff._id);
  res.json({ ok: true });
});

router.get('/students', async (_req, res) => {
  const students = await User.find({ role: 'student' })
    .select('name email interests skills assignedCounselor createdAt')
    .populate('assignedCounselor', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(students);
});

router.patch('/students/:id/assign-counselor', async (req, res) => {
  const { counselorId } = req.body;
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!counselorId) {
    student.assignedCounselor = null;
    await student.save();
    const updated = await User.findById(student._id)
      .select('-passwordHash')
      .populate('assignedCounselor', 'name email')
      .lean();
    return res.json(updated);
  }
  const counselor = await User.findOne({ _id: counselorId, role: 'counselor' });
  if (!counselor) return res.status(400).json({ message: 'Invalid counselor' });
  student.assignedCounselor = counselorId;
  await student.save();
  const updated = await User.findById(student._id)
    .select('-passwordHash')
    .populate('assignedCounselor', 'name email')
    .lean();
  res.json(updated);
});

router.get('/engagement', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const events = await EngagementEvent.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email role')
    .lean();
  res.json(events);
});

export default router;
