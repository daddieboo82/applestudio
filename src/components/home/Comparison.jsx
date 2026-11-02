import { Minus, Check } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';

const ROWS = [
  { label: 'How you get help', us: 'AI explains one step at a time', them: 'Often requires specialist knowledge' },
  { label: 'Device details', us: 'No model or firmware entry in the guide', them: 'May ask you to identify specifications' },
  { label: 'Where it happens', us: 'At home, on your own computer', them: 'May require travel or shipping' },
  { label: 'Who controls actions', us: 'You review and approve each action', them: 'Depends on the tool or service' },
  { label: 'Data safety', us: 'Clear warnings before destructive steps', them: 'May require you to interpret technical prompts' },
  { label: 'Pricing', us: 'Per-service estimate shown first', them: 'May use licences or subscriptions' },
];

export default function Comparison() {
  return (
    <section className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading
          index="04"
          eyebrow="Built for everyday users"
          title="Advanced recovery should not require advanced knowledge."
          description="The difference is the experience: plain-language guidance, visible choices, and the device owner staying in control."
        />

        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-background">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-card/60">
            <div className="px-4 py-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:px-5 sm:text-[10px]">Compare</div>
            <div className="border-l border-border px-4 py-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-primary sm:px-5 sm:text-[10px]">Universal Suite</div>
            <div className="border-l border-border px-4 py-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:px-5 sm:text-[10px]">Typical process</div>
          </div>
          <div className="divide-y divide-border">
            {ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.1fr_1fr_1fr]">
                <div className="px-4 py-4 font-body text-xs text-muted-foreground sm:px-5 sm:text-sm">{row.label}</div>
                <div className="flex items-start gap-2 border-l border-border px-4 py-4 sm:px-5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-xs leading-relaxed text-foreground sm:text-sm">{row.us}</span>
                </div>
                <div className="flex items-start gap-2 border-l border-border px-4 py-4 sm:px-5">
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{row.them}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
