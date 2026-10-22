export function Loading({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <span className="muted">{label}…</span>
      <div className="skeleton" /><div className="skeleton short" /><div className="skeleton" />
    </div>
  );
}

export function QueryError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="query-error" role="alert">
      <div><strong>Could not load this data.</strong><p>{message}</p></div>
      <button className="btn" onClick={retry}>Try again</button>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return <div className="empty"><h3>{title}</h3><div className="muted">{children}</div></div>;
}