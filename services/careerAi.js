const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are a career education assistant for students. Provide balanced, realistic guidance only—no guarantees about jobs or income. Encourage the student to verify details with counselors and official sources. Output must be valid JSON matching the user's requested schema exactly, with no markdown fences or extra text.`;

function buildUserPrompt({ name, interests, skills }) {
  return `Student first name or display name: ${name || 'Student'}

Interests (from their profile): ${interests.length ? interests.join(', ') : '(none listed)'}
Skills (from their profile): ${skills.length ? skills.join(', ') : '(none listed)'}

Respond with a JSON object using exactly these keys:
- "introduction": string (2-4 sentences welcoming them and tying their interests/skills to exploration)
- "paths": array of 3 to 5 objects, each with:
  - "title": string (career path / field name)
  - "summary": string (2-3 sentences describing the path)
  - "whyItFits": string (1-2 sentences linking to their stated interests and/or skills)
  - "typicalRoles": array of 3-5 short job title strings
  - "skillsToDevelop": array of 4-8 concrete skills or topics to build next
  - "nextSteps": array of 4-6 actionable next steps (school clubs, courses, projects, networking, etc.)
  - "educationPaths": string (brief note on common education routes: degree, bootcamp, apprenticeship, self-taught, etc.—not prescriptive)

Keep language clear and appropriate for high school or early college students.`;
}

export async function generateCareerInsightsFromProfile({ name, interests, skills }) {
  const apiKey =
    process.env.CAREER_INSIGHTS_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.CHATGPT_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('MISSING_API_KEY');
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const model = (
    process.env.CAREER_INSIGHTS_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-4o-mini'
  ).trim();

  const res = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt({
            name,
            interests: interests || [],
            skills: skills || [],
          }),
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error?.message || res.statusText || 'Insights request failed');
    err.code = 'INSIGHTS_PROVIDER_ERROR';
    err.status = res.status;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    const err = new Error('Empty response from insights service');
    err.code = 'INSIGHTS_EMPTY';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error('Invalid response format');
    err.code = 'INSIGHTS_PARSE';
    throw err;
  }

  if (!parsed.introduction || !Array.isArray(parsed.paths)) {
    const err = new Error('Response missing required fields');
    err.code = 'INSIGHTS_SHAPE';
    throw err;
  }

  return {
    introduction: parsed.introduction,
    paths: parsed.paths,
  };
}
