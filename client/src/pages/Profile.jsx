import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import TagInput from '../components/TagInput';
import { Loading } from '../components/Spinner';
import { api } from '../api';

const EMPTY = {
  headline: '',
  bio: '',
  skills: [],
  interests: [],
  education: [],
  experience: [],
  experienceYears: 0,
  targetRole: '',
  links: { github: '', linkedin: '', portfolio: '' },
};

export default function Profile() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/profile')
      .then((data) => setForm({ ...EMPTY, ...data.profile, links: { ...EMPTY.links, ...(data.profile?.links || {}) } }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLink = (key, value) => setForm((f) => ({ ...f, links: { ...f.links, [key]: value } }));
  const setListItem = (key, idx, field, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((item, i) => (i === idx ? { ...item, [field]: value } : item)) }));
  const addListItem = (key, template) => setForm((f) => ({ ...f, [key]: [...f[key], template] }));
  const removeListItem = (key, idx) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const data = await api('/profile', { method: 'PUT', body: { ...form, experienceYears: Number(form.experienceYears) || 0 } });
      setForm({ ...EMPTY, ...data.profile, links: { ...EMPTY.links, ...(data.profile?.links || {}) } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="Profile"><Loading /></Layout>;

  return (
    <Layout
      title="Your profile"
      subtitle="The richer your profile, the sharper every analysis gets — this powers career matching, roadmaps and interview questions."
      action={saved ? <span className="chip-success self-center">Profile saved ✓</span> : null}
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="section-title">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="headline">Headline</label>
              <input id="headline" className="input" placeholder="Final-year CS student | Aspiring Data Scientist" value={form.headline} onChange={(e) => set('headline', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="targetRole">Target role</label>
              <input id="targetRole" className="input" placeholder="e.g. Full-Stack Developer" value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Short bio</label>
            <textarea id="bio" rows={3} className="input resize-y" placeholder="What are you studying / building / looking for?" value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="github">GitHub URL</label>
              <input id="github" className="input" placeholder="github.com/you" value={form.links.github} onChange={(e) => setLink('github', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="linkedin">LinkedIn URL</label>
              <input id="linkedin" className="input" placeholder="linkedin.com/in/you" value={form.links.linkedin} onChange={(e) => setLink('linkedin', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="portfolio">Portfolio URL</label>
              <input id="portfolio" className="input" placeholder="you.dev" value={form.links.portfolio} onChange={(e) => setLink('portfolio', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="section-title">Skills & interests</h2>
          <TagInput label="Skills" value={form.skills} onChange={(v) => set('skills', v)} placeholder="React, SQL, Python… (Enter to add)" />
          <TagInput label="Interests" value={form.interests} onChange={(v) => set('interests', v)} placeholder="web development, AI, design… (Enter to add)" />
          <div className="max-w-[200px]">
            <label className="label" htmlFor="years">Years of experience</label>
            <input id="years" type="number" min="0" max="60" className="input" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Education</h2>
            <button type="button" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => addListItem('education', { degree: '', institution: '', year: '' })}>+ Add</button>
          </div>
          {form.education.length === 0 && <p className="text-sm text-slate-400">No education entries yet.</p>}
          {form.education.map((item, i) => (
            <div key={i} className="grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-[2fr_2fr_1fr_auto]">
              <input className="input" placeholder="Degree (B.Tech CSE)" value={item.degree} onChange={(e) => setListItem('education', i, 'degree', e.target.value)} />
              <input className="input" placeholder="Institution" value={item.institution} onChange={(e) => setListItem('education', i, 'institution', e.target.value)} />
              <input className="input" placeholder="Year" value={item.year} onChange={(e) => setListItem('education', i, 'year', e.target.value)} />
              <button type="button" onClick={() => removeListItem('education', i)} className="cursor-pointer rounded-lg px-3 text-slate-400 transition hover:text-rose-600" aria-label="Remove education entry">✕</button>
            </div>
          ))}
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Experience</h2>
            <button type="button" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => addListItem('experience', { title: '', company: '', duration: '', description: '' })}>+ Add</button>
          </div>
          {form.experience.length === 0 && <p className="text-sm text-slate-400">No experience entries yet — internships and projects count too.</p>}
          {form.experience.map((item, i) => (
            <div key={i} className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto]">
                <input className="input" placeholder="Title (Frontend Intern)" value={item.title} onChange={(e) => setListItem('experience', i, 'title', e.target.value)} />
                <input className="input" placeholder="Company / Project" value={item.company} onChange={(e) => setListItem('experience', i, 'company', e.target.value)} />
                <input className="input" placeholder="Duration" value={item.duration} onChange={(e) => setListItem('experience', i, 'duration', e.target.value)} />
                <button type="button" onClick={() => removeListItem('experience', i)} className="cursor-pointer rounded-lg px-3 text-slate-400 transition hover:text-rose-600" aria-label="Remove experience entry">✕</button>
              </div>
              <input className="input" placeholder="What did you do there?" value={item.description} onChange={(e) => setListItem('experience', i, 'description', e.target.value)} />
            </div>
          ))}
        </section>

        <div className="sticky bottom-4 flex items-center gap-4 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-200 backdrop-blur">
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {saved && <span className="text-sm font-semibold text-emerald-600">Saved!</span>}
        </div>
      </form>
    </Layout>
  );
}
