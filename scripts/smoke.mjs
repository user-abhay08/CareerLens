/* End-to-end API smoke test for CareerLens (run: node scripts/smoke.mjs) */
const BASE = process.env.BASE_URL || 'http://localhost:5000/api';
let failures = 0;

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function check(name, cond, extra = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures += 1;
    console.log(`  ✗ ${name} ${extra}`);
  }
}

const email = `smoke_${Date.now()}@test.dev`;

// 1. Health
let r = await call('/health');
check('GET /health', r.status === 200 && r.data.ok);

// 2. Register
r = await call('/auth/register', { method: 'POST', body: { name: 'Smoke Tester', email, password: 'secret123' } });
check('POST /auth/register', r.status === 201 && r.data.token, JSON.stringify(r.data));
const token = r.data?.token;

// 2b. Duplicate email rejected
r = await call('/auth/register', { method: 'POST', body: { name: 'Dup', email, password: 'secret123' } });
check('duplicate email → 409', r.status === 409);

// 2c. Login
r = await call('/auth/login', { method: 'POST', body: { email, password: 'secret123' } });
check('POST /auth/login', r.status === 200 && r.data.token);

// 2d. Wrong password rejected
r = await call('/auth/login', { method: 'POST', body: { email, password: 'wrong' } });
check('wrong password → 401', r.status === 401);

// 2e. Auth guard
r = await call('/profile');
check('GET /profile without token → 401', r.status === 401);

// 3. Profile
r = await call('/profile', { method: 'PUT', token, body: {
  headline: 'Final-year CS student',
  skills: ['javascript', 'react', 'python', 'sql', 'html', 'css'],
  interests: ['web development', 'ai'],
  experienceYears: 1,
  targetRole: 'Full-Stack Developer',
  education: [{ degree: 'B.Tech CSE', institution: 'Some University', year: '2027' }],
} });
check('PUT /profile', r.status === 200 && r.data.profile.skills.length === 6, JSON.stringify(r.data));

r = await call('/profile', { token });
check('GET /profile', r.status === 200 && r.data.profile.headline === 'Final-year CS student');

// 4. Resume analysis (pasted text)
const resumeText = `ABHAY SHARMA
abhay@example.com | +91 98765 43210 | github.com/abhay

EDUCATION
B.Tech Computer Science, Some University, 2027 (CGPA 8.4)

SKILLS
JavaScript, React, Python, SQL, HTML, CSS, Git

PROJECTS
E-commerce Store — built with React and Node.js, reduced page load time by 35% for 500 users
Library Management System — developed REST APIs in Python with a SQL database

EXPERIENCE
Web Development Intern, Acme Pvt Ltd (2026)
Improved checkout flow conversion rate by 12% and fixed 20+ UI bugs`;

r = await call('/resume/analyze', { method: 'POST', token, body: { text: resumeText, roleContext: 'Full-Stack Developer' } });
check('POST /resume/analyze', r.status === 201 && typeof r.data.analysis.result.atsScore === 'number', JSON.stringify(r.data).slice(0, 300));
check('resume result shape', Array.isArray(r.data?.analysis?.result?.strengths) && r.data.analysis.result.strengths.length > 0);
const analysisId = r.data?.analysis?.id;

r = await call('/resume', { token });
check('GET /resume (history)', r.status === 200 && r.data.analyses.length === 1);

r = await call(`/resume/${analysisId}`, { token });
check('GET /resume/:id', r.status === 200 && r.data.analysis.id === analysisId);

// 4b. Resume too short → 400
r = await call('/resume/analyze', { method: 'POST', token, body: { text: 'too short' } });
check('short resume → 400', r.status === 400);

// 5. Career recommendations
r = await call('/careers/recommend', { method: 'POST', token });
check('POST /careers/recommend', r.status === 201 && r.data.recommendation.careers.length > 0, JSON.stringify(r.data).slice(0, 200));
check('careers have scores', r.data.recommendation.careers.every((c) => c.matchScore >= 0 && c.matchScore <= 100));

r = await call('/careers/recommendations', { token });
check('GET /careers/recommendations', r.status === 200 && r.data.recommendations.length === 1);

// 6. Roadmap
r = await call('/careers/roadmap', { method: 'POST', token, body: { targetRole: 'Full-Stack Developer' } });
check('POST /careers/roadmap', r.status === 201 && r.data.roadmap.phases.length > 0, JSON.stringify(r.data).slice(0, 200));
const roadmapId = r.data?.roadmap?.id;

r = await call(`/careers/roadmaps/${roadmapId}`, { token });
check('GET /careers/roadmaps/:id', r.status === 200 && r.data.roadmap.targetRole === 'Full-Stack Developer');

// 6b. Roadmap validation
r = await call('/careers/roadmap', { method: 'POST', token, body: { targetRole: 'x' } });
check('roadmap short role → 400', r.status === 400);

// 7. Interview
r = await call('/interview/sessions', { method: 'POST', token, body: { role: 'Frontend Developer', difficulty: 'medium' } });
check('POST /interview/sessions', r.status === 201 && r.data.session.questions.length >= 4, JSON.stringify(r.data).slice(0, 200));
const sessionId = r.data?.session?.id;
const qCount = r.data?.session?.questions?.length || 5;

r = await call(`/interview/sessions/${sessionId}/answer`, { method: 'POST', token, body: {
  questionIndex: 0,
  answer: 'For example, at my internship I led the checkout redesign. First I measured the funnel, then I rebuilt the form with validation, and as a result conversion increased 12% over 3 weeks.',
} });
check('POST /interview/sessions/:id/answer', r.status === 200 && typeof r.data.feedback.score === 'number', JSON.stringify(r.data).slice(0, 200));

r = await call('/interview/sessions', { token });
check('GET /interview/sessions', r.status === 200 && r.data.sessions.length === 1);

// 8. Dashboard
r = await call('/dashboard', { token });
check('GET /dashboard', r.status === 200 && r.data.stats.resumesAnalyzed === 1 && r.data.stats.careerMatches === 1, JSON.stringify(r.data).slice(0, 200));

// 9. 404 route
r = await call('/nope');
check('unknown route → 404', r.status === 404);

console.log(failures === 0 ? '\nALL SMOKE TESTS PASSED ✅' : `\n${failures} SMOKE TEST(S) FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);
