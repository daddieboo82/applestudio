import { ArrowRight, ShieldCheck } from 'lucide-react';
import { formatUsd } from '@/lib/pricing';

export default function PriceSummary({ quote, onReserve }) {
  const recommended = quote.recommendedTier;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Your estimate
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Live
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-foreground">{quote.service.label}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {quote.device.label} · {quote.service.turnaround}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="font-heading text-4xl font-medium tracking-tight text-foreground">
            {formatUsd(quote.unitPrice)}
            <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              / device
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Typical tool
          </p>
          <p className="mt-1 font-mono text-sm text-muted-foreground line-through">
            {formatUsd(quote.benchmark)}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2.5 border-t border-border pt-4 font-body text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Devices</span>
          <span className="text-foreground">{quote.quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tier applied</span>
          <span className="text-foreground">{quote.activeTier.label}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">You save vs typical</span>
          <span className="text-primary">{formatUsd(quote.savingsPerDevice * quote.quantity)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-muted-foreground">Total</span>
          <span className="font-heading text-lg font-medium tracking-tight text-foreground">
            {formatUsd(quote.total)}
          </span>
        </div>
      </div>

      {recommended.id !== quote.activeTier.id && (
        <div className="mt-5 rounded-lg border border-accent/30 bg-accent/[0.07] p-3.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
            Recommended tier
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground/85">
            Book {recommended.min}+ devices and the price drops to{' '}
            <span className="text-foreground">{formatUsd(recommended.unit)}</span> each — the
            deepest tier that still gives every session a technician.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onReserve}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
      >
        Reserve this price
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="mt-3 flex items-start gap-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
        <ShieldCheck className="mt-px h-3 w-3 shrink-0 text-primary" />
        Fixed at diagnosis · No fix, no fee · 12-month warranty
      </p>
    </div>
  );
}