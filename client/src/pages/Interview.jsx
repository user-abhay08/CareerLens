import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

function Feedback({ feedback }) {
  const good = feedback.score >= 7;
  const ok = feedback.score >= 5 && !good;
  return (
    <div className="mt-4 rounded-xl bg-indigo-50/60 p-5 ring-1 ring-indigo-100">
      <div className="flex items-center gap-3">
        <span className={`text-3xl font-extrabold ${good ? 'text-emerald-600' : ok ? 'text-indigo-600' : 'text-amber-600'}`}>
          {feedback.score}<span className="text-sm text-slate-400">/10</span>
        </span>
        <p className="text-sm font-bold text-indigo-900">AI feedback on your answer</p>
      </div>
      {feedback.strengths?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600">What worked</p>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm text-slate-600"><span className="text-emerald-500">✓</span>{s}</li>)}
          </ul>
        </div>
      )}
      {feedback.improvements?.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-amber-600">Improve</p>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => <li key={i} className="flex gap-2 text-sm text-slate-600"><span className="text-amber-500">→</span>{s}</li>)}
          </ul>
        </div>
      )}
      {feedback.improvedAnswer && (
        <details className="mt-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">Show a polished model answer</summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{feedback.improvedAnswer}</p>
        </details>
      )}
    </div>
  );
}

export default function Interview() {
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [past, setPast] = useState([]);

  const loadPast = () =>
    api('/interview/sessions')
      .then((d) => setPast(d.sessions || []))
      .catch(() => {});

  useEffect(() => {
    loadPast();
  }, []);

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const d = await api('/interview/sessions', { method: 'POST', body: { role: role.trim(), difficulty } });
      setSession(d.session);
      setQIndex(0);
      setAnswer('');
      setNotice(d.notice || '');
      loadPast();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const goTo = (idx) => {
    setQIndex(idx);
    setAnswer(session?.answers?.find((a) => a.questionIndex === idx)?.answer || '');
  };

  const submitAnswer = async () => {
    setGrading(true);
    setError('');
    try {
      const d = await api(`/interview/sessions/${session.id || session._id}/answer`, {
        method: 'POST',
        body: { questionIndex: qIndex, answer },
      });
      setSession(d.session);
      setNotice(d.notice || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setGrading(false);
    }
  };

  const question = session?.questions?.[qIndex];
  const graded = session?.answers?.find((a) => a.questionIndex === qIndex);
  const answeredCount = session?.answers?.length || 0;

  return (
    <Layout
      title="Interview prep"
      subtitle="Practice a realistic interview for any role. Answer in your own words and get instant scoring with a model answer."
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}
      {notice && <p className="banner-warn mb-4">{notice}</p>}

      <form onSubmit={start} className="card mb-8 grid gap-3 p-6 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="role">Role</label>
          <input id="role" className="input" placeholder="e.g. Frontend Developer" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" className="input cursor-pointer" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button type="submit" disabled={busy || !role.trim()} className="btn-primary">
          {busy ? (<><Spinner className="h-4 w-4" /> Preparing…</>) : '🎤 Start session'}
        </button>
      </form>

      {busy && <Loading label="Generating interview questions…" />}

      {!busy && session && question && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip-accent">{session.role}</span>
              <span className="chip capitalize">{session.difficulty}</span>
            </div>
            {/* progress dots */}
            <div className="flex items-center gap-1.5">
              {session.questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2.5 cursor-pointer rounded-full transition-all ${
                    i === qIndex ? 'w-6 bg-indigo-600' : session.answers?.some((a) => a.questionIndex === i) ? 'w-2.5 bg-emerald-400' : 'w-2.5 bg-slate-200'
                  }`}
                  aria-label={`Go to question ${i + 1}`}
                />
              ))}
              <span className="ml-2 text-xs font-semibold text-slate-400">{qIndex + 1}/{session.questions.length}</span>
            </div>
          </div>

          <h2 className="mt-6 text-lg font-bold leading-snug text-slate-900">{question.question}</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">Evaluates: {question.focus}</p>

          <textarea
            rows={6}
            className="input mt-5 resize-y"
            placeholder="Type your answer — structure it (Situation → Action → Result) and add numbers where you can."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={submitAnswer} disabled={grading || answer.trim().length < 5} className="btn-primary">
              {grading ? (<><Spinner className="h-4 w-4" /> Grading…</>) : graded ? 'Re-grade answer' : 'Submit for feedback'}
            </button>
            {qIndex < session.questions.length - 1 && (
              <button onClick={() => goTo(qIndex + 1)} className="btn-secondary">Next question →</button>
            )}
            {qIndex > 0 && (
              <button onClick={() => goTo(qIndex - 1)} className="btn-secondary">← Previous</button>
            )}
            <span className="ml-auto text-xs font-medium text-slate-400">{answeredCount}/{session.questions.length} answered</span>
          </div>

          {graded && <Feedback feedback={graded} />}

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600">Peek at the reference answer (try first!)</summary>
            <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-500 ring-1 ring-slate-200">{question.sampleAnswer}</p>
          </details>
        </div>
      )}

      {!busy && !session && past.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Past sessions</h2>
          <div className="grid gap-3">
            {past.map((s) => (
              <button
                key={s.id || s._id}
                onClick={() => { setSession(s); setQIndex(0); setAnswer(''); }}
                className="card card-hover flex items-center justify-between p-4 text-left"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.role} <span className="ml-1 text-xs font-medium capitalize text-slate-400">· {s.difficulty}</span></p>
                  <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()} · {s.answers?.length || 0}/{s.questions?.length || 0} answered</p>
                </div>
                <span className="chip">{s.status}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!busy && !session && past.length === 0 && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl ring-1 ring-emerald-100">🎤</div>
          <p className="mt-4 text-sm font-semibold text-slate-700">No interview sessions yet</p>
          <p className="mt-1 text-xs text-slate-400">Pick a role above and answer 5 AI-generated questions.</p>
        </div>
      )}
    </Layout>
  );
}
