import { useState } from 'react';

export default function TagInput({ value = [], onChange, placeholder = 'Type and press Enter', label }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setDraft('');
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-300 transition focus-within:ring-2 focus-within:ring-indigo-500">
        {value.map((tag) => (
          <span key={tag} className="chip-accent">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="ml-0.5 cursor-pointer text-indigo-400 transition hover:text-indigo-700" aria-label={`Remove ${tag}`}>
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 placeholder-slate-400 outline-none"
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={add}
        />
      </div>
    </div>
  );
}
