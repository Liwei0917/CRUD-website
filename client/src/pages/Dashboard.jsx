import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usersApi } from '../api/users.js';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(isAdmin);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    usersApi
      .stats()
      .then((s) => active && setStats(s))
      .catch(() => active && setStats(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          You are signed in as <Badge tone={isAdmin ? 'admin' : 'user'}>{user?.role}</Badge>
        </p>
      </div>

      {isAdmin ? (
        loading ? (
          <div className="flex justify-center py-10 text-brand-600">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={stats?.total?.toLocaleString() ?? '—'} icon="👥" />
              <StatCard label="Admins" value={stats?.admins?.toLocaleString() ?? '—'} icon="🛡️" />
              <StatCard label="Regular users" value={stats?.users?.toLocaleString() ?? '—'} icon="👤" />
              <StatCard label="Active" value={stats?.active?.toLocaleString() ?? '—'} icon="✅" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">Admin tools</h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage all user accounts — create, view, edit and delete.
              </p>
              <Link
                to="/users"
                className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Open User Control
              </Link>
            </div>
          </>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Your account</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and update your personal details from the profile page.
            </p>
            <Link
              to="/profile"
              className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go to Profile
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Need admin access?</h2>
            <p className="mt-1 text-sm text-slate-500">
              User management tools are available to administrators only. Contact an admin if you
              need elevated permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
