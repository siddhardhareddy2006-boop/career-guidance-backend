import { Router } from 'express';
import { CounselingSession } from '../models/CounselingSession.js';
import { User } from '../models/User.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { EngagementEvent } from '../models/EngagementEvent.js';

const router = Router();

router.post('/', authRequired, async (req, res) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ message: 'Only students can book sessions' });
  }
  const { counselorId, scheduledAt, topic, durationMinutes, studentNotes } = req.body;
  if (!counselorId || !scheduledAt) {
    return res.status(400).json({ message: 'counselorId and scheduledAt required' });
  }
  const counselor = await User.findOne({ _id: counselorId, role: 'counselor' });
  if (!counselor) return res.status(400).json({ message: 'Invalid counselor' });
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ message: 'Invalid date' });
  }
  const session = await CounselingSession.create({
    student: req.userId,
    counselor: counselorId,
    scheduledAt: when,
    durationMinutes: durationMinutes || 45,
    topic: topic || '',
    studentNotes: studentNotes || '',
    status: 'pending',
  });
  await EngagementEvent.create({
    user: req.userId,
    action: 'session_booked',
    path: '/sessions',
    meta: { sessionId: session._id, counselorId },
  });
  const populated = await CounselingSession.findById(session._id)
    .populate('counselor', 'name email')
    .populate('student', 'name email')
    .lean();
  res.status(201).json(populated);
});

router.get('/mine', authRequired, async (req, res) => {
  let query;
  if (req.userRole === 'student') {
    query = { student: req.userId };
  } else if (req.userRole === 'counselor') {
    query = { counselor: req.userId };
  } else if (req.userRole === 'admin') {
    query = {};
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const list = await CounselingSession.find(query)
    .sort({ scheduledAt: -1 })
    .populate('counselor', 'name email')
    .populate('student', 'name email')
    .lean();
  res.json(list);
});

router.patch('/:id', authRequired, async (req, res) => {
  const session = await CounselingSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Not found' });
  const isCounselor = req.userRole === 'counselor' && session.counselor.equals(req.userId);
  const isStudent = req.userRole === 'student' && session.student.equals(req.userId);
  const isAdmin = req.userRole === 'admin';
  if (!isCounselor && !isStudent && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { status, counselorNotes, studentNotes, scheduledAt } = req.body;
  if (status && (isCounselor || isAdmin)) session.status = status;
  if (counselorNotes !== undefined && (isCounselor || isAdmin)) session.counselorNotes = counselorNotes;
  if (studentNotes !== undefined && isStudent) session.studentNotes = studentNotes;
  if (scheduledAt && (isStudent || isAdmin)) {
    const d = new Date(scheduledAt);
    if (!Number.isNaN(d.getTime())) session.scheduledAt = d;
  }
  await session.save();
  const populated = await CounselingSession.findById(session._id)
    .populate('counselor', 'name email')
    .populate('student', 'name email')
    .lean();
  res.json(populated);
});

export default router;
