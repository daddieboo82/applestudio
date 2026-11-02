import { formatUsd } from '@/lib/pricing';

export default function TierTable({ quote, onSelect }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Volume lattice
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
          per device
        </span>
      </div>
      <div className="divide-y divide-border">
        {quote.tiers.map((tier) => {
          const active = tier.id === quote.activeTier.id;
          const recommended = tier.id === quote.recommendedTier.id;
          return (
            <button
              key={tier.id}
              type="button"
              disabled={!tier.eligible}
              onClick={() => onSelect(tier.min)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                active ? 'bg-primary/[0.06]' : 'hover:bg-card/60'
              } ${!tier.eligible ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? 'bg-primary' : recommended ? 'bg-accent' : 'bg-border'
                  }`}
                />
                <span className="text-sm text-foreground/90">{tier.label}</span>
                {recommended && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-accent">
                    Best value
                  </span>
                )}
              </span>
              <span className="flex items-baseline gap-2">
                {tier.eligible ? (
                  <>
                    <span className="font-heading text-sm font-medium tracking-tight">
                      {formatUsd(tier.unit)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      −{Math.round(tier.discount * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    By quote
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}