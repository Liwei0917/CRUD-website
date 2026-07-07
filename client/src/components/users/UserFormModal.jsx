import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';

const empty = { name: '', email: '', password: '', role: 'user', isActive: true };

/**
 * Create/edit user modal. When `user` is provided it edits; otherwise it creates.
 * `onSubmit(payload)` should return a promise; errors are surfaced inline.
 */
export default function UserFormModal({ open, user, onClose, onSubmit }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        user
          ? { name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive }
          : empty
      );
      setError('');
    }
  }, [open, user]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      // Don't send an empty password on edit (means "leave unchanged").
      if (isEdit && !payload.password) delete payload.password;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.details?.map((d) => d.message).join(', ') || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Create user'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} form="user-form">
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <Alert type="error">{error}</Alert>
        <Input label="Full name" value={form.name} onChange={set('name')} required />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
        <Input
          label={isEdit ? 'New password (leave blank to keep)' : 'Password'}
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
          required={!isEdit}
          placeholder={isEdit ? '••••••••' : ''}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={form.role}
              onChange={set('role')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={set('isActive')}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600">Active</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
