const STYLES = {
  admin: 'bg-brand-100 text-brand-700',
  user: 'bg-slate-100 text-slate-600',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-amber-100 text-amber-700',
};

export default function Badge({ tone = 'user', children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[tone] || STYLES.user}`}>
      {children}
    </span>
  );
}
