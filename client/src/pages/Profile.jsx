import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [details, setDetails] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', password: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const saveDetails = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSavingDetails(true);
    try {
      await updateProfile({ name: details.name, email: details.email });
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSavingDetails(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (pwd.password !== pwd.confirm) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPwd(true);
    try {
      await updateProfile({ currentPassword: pwd.currentPassword, password: pwd.password });
      setPwd({ currentPassword: '', password: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <p className="mt-1 text-slate-500">Manage your personal information and password.</p>
      </div>

      {msg.text && <Alert type={msg.type || 'info'}>{msg.text}</Alert>}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <Badge tone={user?.role === 'admin' ? 'admin' : 'user'}>{user?.role}</Badge>
          </div>
        </div>

        <form onSubmit={saveDetails} className="space-y-4">
          <Input
            label="Full name"
            value={details.name}
            onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={details.email}
            onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
            required
          />
          <Button type="submit" loading={savingDetails}>
            Save changes
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pwd.currentPassword}
            onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
            required
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pwd.password}
            onChange={(e) => setPwd((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={pwd.confirm}
            onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
            required
          />
          <Button type="submit" variant="secondary" loading={savingPwd}>
            Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
