import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange }) {
  const set = (next) => onChange(Math.min(500, Math.max(1, next)));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Step 3 — How many devices
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Volume pricing applies automatically.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
        <button
          type="button"
          aria-label="Fewer devices"
          onClick={() => set(value - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min="1"
          max="500"
          value={value}
          onChange={(e) => set(Number(e.target.value) || 1)}
          className="w-14 bg-transparent text-center font-heading text-base font-medium text-foreground outline-none"
        />
        <button
          type="button"
          aria-label="More devices"
          onClick={() => set(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}