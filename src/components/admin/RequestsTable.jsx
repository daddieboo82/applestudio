import { formatUsd } from '@/lib/pricing';

const STATUSES = ['received', 'diagnosing', 'in_progress', 'completed', 'declined'];

export default function RequestsTable({ requests, onStatusChange }) {
  if (!requests.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No session requests yet. Anything submitted from the price engine lands here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="hidden grid-cols-[1.1fr_1.4fr_1.4fr_0.6fr_0.8fr_1fr] gap-3 border-b border-border bg-card/60 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground lg:grid">
        <span>Reference</span>
        <span>Customer</span>
        <span>Device</span>
        <span>Qty</span>
        <span>Total</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-border">
        {requests.map((request) => (
          <div
            key={request.id}
            className="grid gap-2 px-4 py-3.5 lg:grid-cols-[1.1fr_1.4fr_1.4fr_0.6fr_0.8fr_1fr] lg:items-center lg:gap-3"
          >
            <span className="font-mono text-[11px] text-primary">{request.reference}</span>
            <span className="text-sm text-foreground">
              {request.customer_name || '—'}
              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                {request.email}
              </span>
              {request.session_window && (
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-primary/80">
                  {request.session_window}
                </span>
              )}
            </span>
            <span className="text-sm text-foreground/85">
              {request.device_model || request.device_label}
              <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {request.service_label}
              </span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{request.device_count}</span>
            <span className="font-mono text-[11px] text-foreground">
              {formatUsd(request.quoted_total || 0)}
            </span>
            <select
              value={request.status || 'received'}
              onChange={(event) => onStatusChange(request.id, event.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground outline-none focus:border-primary"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}