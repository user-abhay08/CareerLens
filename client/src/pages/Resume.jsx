import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import ScoreRing from '../components/ScoreRing';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

function AnalysisResult({ analysis }) {
  const r = analysis.result;
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={r.atsScore} label="ATS score" size={130} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="chip">{analysis.fileName}</span>
              <span>via {analysis.provider}</span>
              {analysis.roleContext && <span className="chip-accent">🎯 {analysis.roleContext}</span>}
            </div>
            <p className="mt-3 leading-relaxed text-slate-600">{r.summary}</p>
            {r.keywords?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">ATS keywords found</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.keywords.map((k) => <span key={k} className="chip">{k}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-bold text-emerald-600">✓ Strengths</h3>
          <ul className="mt-3 space-y-2.5">
            {(r.strengths || []).map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600"><span className="text-emerald-500">•</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-amber-600">⚠ Fix these</h3>
          <ul className="mt-3 space-y-2.5">
            {(r.weaknesses || []).map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-600"><span className="text-amber-500">•</span>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {r.missingSkills?.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title">Missing skills for your direction</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.missingSkills.map((k) => <span key={k} className="chip-accent">{k}</span>)}
          </div>
        </div>
      )}

      {r.suggestedRoles?.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title">Suggested roles</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.suggestedRoles.map((role) => <span key={role} className="chip-accent">{role}</span>)}
          </div>
        </div>
      )}

      {r.rewrittenBullets?.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="border-b border-slate-100 p-6 pb-4 section-title">Rewrite weak bullets</h3>
          <div className="divide-y divide-slate-100">
            {r.rewrittenBullets.map((b, i) => (
              <div key={i} className="grid gap-3 p-5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-rose-500">Original</p>
                  <p className="text-sm text-slate-500">{b.original}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-600">Improved</p>
                  <p className="text-sm text-slate-800">{b.improved}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Resume() {
  const [mode, setMode] = useState('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [roleContext, setRoleContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [current, setCurrent] = useState(null);
  const fileInput = useRef(null);

  const loadHistory = () =>
    api('/resume')
      .then((d) => setAnalyses(d.analyses))
      .catch(() => {});

  useEffect(() => {
    loadHistory();
  }, []);

  const analyze = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setCurrent(null);

    if (mode === 'upload' && !file) {
      setError('Choose a PDF file first.');
      return;
    }
    if (mode === 'paste' && text.trim().length < 80) {
      setError('Paste at least a few lines of your resume text.');
      return;
    }
    setBusy(true);
    try {
      let d;
      if (mode === 'upload') {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('roleContext', roleContext);
        d = await api('/resume/analyze', { method: 'POST', formData: fd });
      } else {
        d = await api('/resume/analyze', { method: 'POST', body: { text, roleContext } });
      }
      setCurrent(d.analysis);
      setNotice(d.notice || '');
      setText('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title="Resume analyzer"
      subtitle="Upload a PDF or paste text and get an ATS score, strengths, weaknesses, missing skills and rewritten bullets."
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}
      {notice && <p className="banner-warn mb-4">{notice}</p>}

      <form onSubmit={analyze} className="card mb-8 space-y-5 p-6">
        {/* Segmented control */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {[
            ['upload', '📎 Upload PDF'],
            ['paste', '✍️ Paste text'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === m ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <div
            className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">📄</div>
            {file ? (
              <p className="mt-3 text-sm font-semibold text-slate-800">{file.name} <span className="font-normal text-slate-400">({Math.round(file.size / 1024)} KB)</span></p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Drag & drop your resume here, or{' '}
                <button
                  type="button"
                  className="cursor-pointer font-semibold text-indigo-600 underline-offset-2 hover:underline"
                  onClick={() => fileInput.current?.click()}
                >
                  browse files
                </button>
              </p>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-slate-400">PDF or TXT, up to 5 MB</p>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="text">Resume text</label>
            <textarea
              id="text"
              rows={8}
              className="input resize-y font-mono text-xs"
              placeholder="Paste your full resume text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-4 sm:max-w-md">
          <div>
            <label className="label" htmlFor="role">Target direction (optional)</label>
            <input id="role" className="input" placeholder="e.g. Data Analyst" value={roleContext} onChange={(e) => setRoleContext(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary px-8">
          {busy ? (<><Spinner className="h-4 w-4" /> Analyzing…</>) : 'Analyze resume'}
        </button>
      </form>

      {busy && <Loading label="Reading your resume and scoring it…" />}
      {!busy && current && <AnalysisResult analysis={current} />}

      {analyses.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Past analyses</h2>
          <div className="grid gap-3">
            {analyses.map((a) => (
              <button
                key={a.id || a._id}
                onClick={() => { setCurrent(a); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`card card-hover flex items-center justify-between p-4 text-left ${current && (current.id || current._id) === (a.id || a._id) ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{a.fileName}</p>
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()} · via {a.provider}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-extrabold ${a.result.atsScore >= 70 ? 'text-emerald-600' : a.result.atsScore >= 40 ? 'text-indigo-600' : 'text-amber-600'}`}>{a.result.atsScore}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ATS</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
