import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition';
const linkClass = ({ isActive }) =>
  `${linkBase} ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

const Icon = ({ children }) => <span className="text-lg leading-none">{children}</span>;

export default function Sidebar({ open, onNavigate }) {
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onNavigate} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            C
          </div>
          <span className="text-lg font-semibold text-slate-800">CRUD App</span>
        </div>

        <nav className="space-y-1">
          <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
            <Icon>🏠</Icon> Dashboard
          </NavLink>
          <NavLink to="/profile" className={linkClass} onClick={onNavigate}>
            <Icon>👤</Icon> Profile
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={linkClass} onClick={onNavigate}>
              <Icon>🛡️</Icon> User Control
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}
