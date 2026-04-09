import mongoose from 'mongoose';
import { Router } from 'express';
import { SavedCareerPath } from '../models/SavedCareerPath.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  let personalPaths = [];
  if (req.userId && mongoose.Types.ObjectId.isValid(req.userId)) {
    const saved = await SavedCareerPath.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
    personalPaths = saved.map((d) => ({
      slug: `saved-${d._id.toString()}`,
      title: d.title || 'Career path',
      blurb:
        String(d.summary || d.whyItFits || '')
          .trim()
          .slice(0, 280) || 'Saved from your personalized suggestions.',
      skillsHint: Array.isArray(d.skillsToDevelop) ? d.skillsToDevelop.slice(0, 8) : [],
      resourceCount: 0,
      isPersonalSaved: true,
    }));
  }
  res.json(personalPaths);
});

export default router;
