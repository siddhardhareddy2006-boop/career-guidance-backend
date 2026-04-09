import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { CareerResource } from '../models/CareerResource.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { EngagementEvent } from '../models/EngagementEvent.js';

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

router.get('/', async (req, res) => {
  const { category, tag, q, pathSlug } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = new RegExp(category, 'i');
  if (tag) filter.tags = tag;
  if (pathSlug) filter.careerPathSlug = pathSlug;
  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { summary: new RegExp(q, 'i') },
      { tags: new RegExp(q, 'i') },
    ];
  }
  const list = await CareerResource.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const doc = await CareerResource.findOne({ _id: req.params.id, isPublished: true }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const userId = optionalUserId(req);
  EngagementEvent.create({
    user: userId,
    action: 'resource_view',
    path: req.originalUrl,
    meta: { resourceId: doc._id, title: doc.title },
  }).catch(() => {});
  res.json(doc);
});

router.post('/', authRequired, requireRole('admin'), async (req, res) => {
  const { title, category, summary, content, tags, careerPathSlug, isPublished } = req.body;
  if (!title || !category || !summary) {
    return res.status(400).json({ message: 'title, category, summary required' });
  }
  const doc = await CareerResource.create({
    title,
    category,
    summary,
    content: content || '',
    tags: Array.isArray(tags) ? tags : [],
    careerPathSlug: careerPathSlug || '',
    isPublished: isPublished !== false,
    createdBy: req.userId,
  });
  res.status(201).json(doc);
});

router.put('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const updates = req.body;
  const allowed = ['title', 'category', 'summary', 'content', 'tags', 'careerPathSlug', 'isPublished'];
  const patch = {};
  for (const k of allowed) if (k in updates) patch[k] = updates[k];
  const doc = await CareerResource.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.delete('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const doc = await CareerResource.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
