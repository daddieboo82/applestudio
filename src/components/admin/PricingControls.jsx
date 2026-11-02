import { formatUsd, getQuote } from '@/lib/pricing';

export default function PricingControls({ draft, onChange, onSave, saving, saved }) {
  const preview = getQuote({
    serviceId: 'data_recovery',
    deviceClassId: 'iphone',
    quantity: 1,
    config: { margin_floor: Number(draft.margin_floor), undercut_pct: Number(draft.undercut_pct) },
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Pricing engine controls
      </p>

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="flex items-center justify-between font-body text-sm">
            <span className="text-foreground">Margin floor</span>
            <span className="font-mono text-[11px] text-primary">
              ×{Number(draft.margin_floor).toFixed(2)} cost
            </span>
          </span>
          <input
            type="range"
            min="1.05"
            max="1.8"
            step="0.01"
            value={draft.margin_floor}
            onChange={(event) => onChange('margin_floor', event.target.value)}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between font-body text-sm">
            <span className="text-foreground">Undercut market</span>
            <span className="font-mono text-[11px] text-primary">{Number(draft.undercut_pct)}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={draft.undercut_pct}
            onChange={(event) => onChange('undercut_pct', event.target.value)}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
          />
        </label>
      </div>

      <div className="mt-5 rounded-md border border-border bg-background p-3.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          Preview · data recovery, iPhone 11 – 13
        </p>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-heading text-lg font-medium tracking-tight">
            {formatUsd(preview.unitPrice)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground line-through">
            {formatUsd(preview.benchmark)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
            −{Math.round(100 - (preview.unitPrice / preview.benchmark) * 100)}%
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Apply to live pricing'}
      </button>
    </div>
  );
}