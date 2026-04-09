import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { EngagementEvent } from '../models/EngagementEvent.js';
import { SavedCareerPath } from '../models/SavedCareerPath.js';
import { authRequired } from '../middleware/auth.js';
import { generateCareerInsightsFromProfile } from '../services/careerAi.js';

const router = Router();

router.post('/generate', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name interests skills');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const interests = user.interests || [];
    const skills = user.skills || [];
    if (interests.length === 0 && skills.length === 0) {
      return res.status(400).json({
        message: 'Add at least one interest or skill on your profile before generating suggestions.',
      });
    }

    const result = await generateCareerInsightsFromProfile({
      name: user.name,
      interests,
      skills,
    });

    await EngagementEvent.create({
      user: user._id,
      action: 'career_insights_generated',
      path: '/career-insights',
      meta: { pathCount: result.paths?.length },
    });

    res.json({
      introduction: result.introduction,
      paths: result.paths,
    });
  } catch (e) {
    if (e.code === 'MISSING_API_KEY') {
      return res.status(503).json({
        message:
          'Personalized career suggestions are not configured. Add CAREER_INSIGHTS_API_KEY to the server .env file.',
      });
    }
    if (e.code === 'INSIGHTS_PROVIDER_ERROR') {
      const status = e.status >= 400 && e.status < 600 ? e.status : 502;
      return res.status(status).json({ message: e.message || 'Suggestions service unavailable' });
    }
    if (e.code === 'INSIGHTS_EMPTY' || e.code === 'INSIGHTS_PARSE' || e.code === 'INSIGHTS_SHAPE') {
      return res.status(502).json({ message: e.message || 'Unexpected response from suggestions service' });
    }
    console.error(e);
    res.status(500).json({ message: 'Could not generate career insights' });
  }
});

router.post('/saved-path', authRequired, async (req, res) => {
  const { path: pathPayload, introduction } = req.body;
  if (!pathPayload || typeof pathPayload !== 'object') {
    return res.status(400).json({ message: 'path object is required' });
  }
  const title = String(pathPayload.title || '').trim();
  if (!title) {
    return res.status(400).json({ message: 'path.title is required' });
  }
  const user = await User.findById(req.userId).select('interests skills');
  const doc = await SavedCareerPath.create({
    user: req.userId,
    title,
    summary: String(pathPayload.summary || ''),
    whyItFits: String(pathPayload.whyItFits || ''),
    typicalRoles: Array.isArray(pathPayload.typicalRoles) ? pathPayload.typicalRoles.map(String) : [],
    skillsToDevelop: Array.isArray(pathPayload.skillsToDevelop) ? pathPayload.skillsToDevelop.map(String) : [],
    nextSteps: Array.isArray(pathPayload.nextSteps) ? pathPayload.nextSteps.map(String) : [],
    educationPaths: String(pathPayload.educationPaths || ''),
    introduction: typeof introduction === 'string' ? introduction.trim() : '',
    interestsSnapshot: user?.interests || [],
    skillsSnapshot: user?.skills || [],
  });
  const out = doc.toObject();
  delete out.aiModel;
  res.status(201).json(out);
});

router.get('/saved-path/:id', authRequired, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  const doc = await SavedCareerPath.findOne({ _id: req.params.id, user: req.userId })
    .select('-aiModel')
    .lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.delete('/saved-path/:id', authRequired, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  const result = await SavedCareerPath.deleteOne({ _id: req.params.id, user: req.userId });
  if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});

export default router;
