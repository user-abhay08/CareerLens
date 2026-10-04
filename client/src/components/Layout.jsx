import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/profile', label: 'Profile', icon: '🧑‍💼' },
  { to: '/resume', label: 'Resume Analyzer', icon: '📄' },
  { to: '/careers', label: 'Career Matches', icon: '🎯' },
  { to: '/roadmap', label: 'Skill Roadmap', icon: '🗺️' },
  { to: '/interview', label: 'Interview Prep', icon: '🎤' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-md shadow-indigo-500/30">🔭</span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Career<span className="text-indigo-600">Lens</span>
      </span>
    </div>
  );
}

export default function Layout({ children, title, subtitle, action }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* decorative gradient */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-100/60 to-transparent" />

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 pb-6 pt-6">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-md shadow-indigo-500/25">
            <p className="text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-indigo-100">{user?.email}</p>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="mt-3 w-full cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar + nav */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
          >
            Log out
          </button>
        </div>
      </div>
      <nav className="fixed inset-x-0 top-[57px] z-20 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'text-slate-500'
              }`
            }
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Main */}
      <main className="relative px-4 pb-20 pt-32 lg:ml-64 lg:px-10 lg:pt-12">
        <div className="mx-auto max-w-5xl">
          {(title || action) && (
            <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">{title}</h1>}
                {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>}
              </div>
              {action}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
