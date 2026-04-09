import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { CareerResource } from '../models/CareerResource.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/career_guidance';

function defaultCareerResources(createdBy) {
  return [
    {
      title: 'How to get an internship (any field)',
      category: 'Guide',
      summary:
        'A practical timeline: where to look, how to apply early, and how to stand out when you have little experience.',
      content: `Start 4–6 months before you want to start: list target organizations, roles, and deadlines. Use your school career center, Handshake-style boards, company sites, and warm intros from professors or alumni.

Tailor each application: one clear page on why that team and what you already tried (projects, jobs, volunteering). Follow up politely two weeks after applying.

For interviews, prepare three stories: a time you learned fast, a time you worked with others, and a time you fixed a mistake. Ask questions about the work, not only perks.`,
      tags: ['internships', 'applications', 'early-career'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Stay sharp when work tools keep changing',
      category: 'Guide',
      summary:
        'New software and automation show up in almost every field—how to stay useful, curious, and in control.',
      content: `Treat new tools as helpers that shift how some tasks get done, not a reason to stop building judgment, communication, and domain knowledge. Employers still value people who can frame problems, verify outputs, and take responsibility.

When you use drafting, search, or analysis tools, always check facts, cite sources when it matters, and keep practicing the underlying skill (writing, analysis, spreadsheets, code) so you can steer the work—not just accept the first output.

Stay curious: follow one reputable industry or skills update each quarter; talk with peers about fairness, privacy, and quality so you build a grounded point of view.`,
      tags: ['future-of-work', 'skills', 'technology'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Interview prep that works for any career',
      category: 'Guide',
      summary: 'Behavioral and role-specific prep, questions to ask, and how to reduce nerves.',
      content: `Research the organization: mission, recent news, and the role’s stated responsibilities. Prepare 5–7 STAR stories (Situation, Task, Action, Result) drawn from school, work, or projects.

Practice out loud with a friend or record yourself. For technical or case interviews, use official prep guides and past prompts if available.

Plan questions you will ask them: team structure, success in year one, how feedback works. Send a short thank-you within 24 hours referencing something specific you discussed.`,
      tags: ['interviews', 'communication', 'prep'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Resumes and applications that get read',
      category: 'Guide',
      summary: 'Structure, keywords, and honesty—so recruiters and ATS systems can see your fit quickly.',
      content: `Lead with impact: bullets that start with strong verbs and include numbers or scope when possible (“Organized events for 120 students” beats “Helped with events”).

Mirror language from the job description without copying blindly; match skills and tools you truly have. One page is enough for most students and new grads.

Proofread twice; ask someone else to read for clarity. Keep a master resume and trim versions per application rather than one generic spray-and-pray.`,
      tags: ['resume', 'applications', 'job-search'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Networking when you feel awkward',
      category: 'Guide',
      summary: 'Low-pressure ways to meet people in fields you might like—without cringe.',
      content: `Start with curiosity, not a transaction. Informational chats are short (20–30 minutes): ask how they got there, what a typical week looks like, and what they’d do differently.

Use alumni tools, LinkedIn, clubs, and conferences. Always personalize the first message with why them and one specific question.

After a conversation, send a thank-you and, months later, a brief update if you acted on their advice. Relationships compound slowly—that’s normal.`,
      tags: ['networking', 'relationships', 'job-search'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Choosing a direction without locking in too early',
      category: 'Guide',
      summary: 'How to explore majors and careers while staying open and evidence-based.',
      content: `Run small experiments: elective courses, shadowing, part-time work, or volunteer roles in adjacent areas. Track what energizes you versus what drains you.

Separate identity from label: a major is a container for skills, not your whole future. Many paths are reachable through multiple doors.

Talk to a counselor about requirements and timelines so exploration doesn’t accidentally delay graduation. Revisit your plan each semester with one concrete next step.`,
      tags: ['exploration', 'majors', 'planning'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Side projects and portfolios (any discipline)',
      category: 'Guide',
      summary:
        'Show what you can do with a small, finished piece of work—coding, writing, design, research, or community impact.',
      content: `Pick a scope you can finish in weeks, not months: one artifact with a clear audience or outcome. Document the problem, your process, and what you learned.

For non-tech fields, portfolios can be writing samples, campaign plans, lab summaries, lesson plans, or curated volunteer outcomes. Host them simply: PDF, personal site, or platform link.

Quality over quantity: two strong pieces beat ten half-done tabs. Refresh or remove work that no longer represents you.`,
      tags: ['portfolio', 'projects', 'credibility'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Your first offer: negotiate with care',
      category: 'Guide',
      summary: 'Basics of salary research, timing, and professional tone for entry-level roles.',
      content: `Before you negotiate, gather benchmarks: government data, industry surveys, and your school’s salary reports. Consider total package: base, bonus, benefits, PTO, flexibility, and growth.

If you negotiate, do it after a written offer, in one concise email or call: express enthusiasm, state your ask with a number or range, and give a brief reason (experience, competing offer, market data).

Not every employer has room to move; a polite no is still a win if you decided consciously. Get the final terms in writing before you resign other options.`,
      tags: ['salary', 'negotiation', 'offers'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Ambition without burnout',
      category: 'Wellbeing',
      summary: 'Sustainable habits for students and early professionals juggling pressure.',
      content: `Sleep, movement, and predictable downtime are not luxuries—they protect judgment and mood. Block calendar time for deep work and for rest the way you block classes.

Say no to optional commitments that don’t align with your priorities this term. Use campus counseling or advising early; small adjustments beat crisis mode.

Redefine success periodically: grades and titles are one slice. Relationships, health, and skill growth matter for a long career.`,
      tags: ['wellbeing', 'mental-health', 'balance'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
    {
      title: 'Your online professional presence',
      category: 'Guide',
      summary: 'LinkedIn, email, and public profiles that support—not undermine—your applications.',
      content: `Use a clear headshot and headline that states your goal or role (“Aspiring nurse | Clinical volunteer”). Summary: three lines on what you’re learning and what you want next.

Connect with context; engage thoughtfully with posts in your target field. Google yourself and clean up public accounts employers might see.

Keep emails professional: firstname.lastname style when possible, and respond within a business day when job-hunting.`,
      tags: ['linkedin', 'personal-brand', 'digital'],
      careerPathSlug: '',
      isPublished: true,
      createdBy,
    },
  ];
}

async function seed() {
  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash('demo1234', 10);

  let admin = await User.findOne({ email: 'admin@careerguide.demo' });
  if (!admin) {
    admin = await User.create({
      email: 'admin@careerguide.demo',
      passwordHash,
      name: 'Demo Admin',
      role: 'admin',
    });
    console.log('Created admin: admin@careerguide.demo / demo1234');
  }

  let counselor = await User.findOne({ email: 'counselor@careerguide.demo' });
  if (!counselor) {
    counselor = await User.create({
      email: 'counselor@careerguide.demo',
      passwordHash,
      name: 'Jamie Counselor',
      role: 'counselor',
    });
    console.log('Created counselor: counselor@careerguide.demo / demo1234');
  }

  const removed = await CareerResource.deleteMany({});
  console.log(`Removed ${removed.deletedCount} existing career resource(s).`);
  const inserted = await CareerResource.insertMany(defaultCareerResources(admin._id));
  console.log(`Inserted ${inserted.length} default career resources.`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
