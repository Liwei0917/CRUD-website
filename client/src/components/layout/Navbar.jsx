import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Badge from '../ui/Badge.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <button
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
          >
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
              <div className="px-4 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
                <div className="mt-1">
                  <Badge tone={user?.role === 'admin' ? 'admin' : 'user'}>{user?.role}</Badge>
                </div>
              </div>
              <hr className="my-1 border-slate-100" />
              <button
                onClick={logout}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
