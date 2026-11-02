import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';
import { formatUsd, getQuote } from '@/lib/pricing';

const quote = getQuote({ serviceId: 'system_repair', deviceClassId: 'iphone', quantity: 5 });

export default function PricingPreview() {
  return (
    <section id="pricing-preview" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            index="03"
            eyebrow="Pay per device"
            title="The more devices, the lower the price. That is the whole model."
            description="No licence, no seats, no monthly minimum. One iPhone or forty — the price per device is published before you commit, and every session runs remotely."
          />

          <ul className="mt-8 space-y-3">
            {[
              'Quoted per device, not per hour',
              'Price drops automatically from two devices',
              'Same warranty at every volume tier',
              'Refurbisher rates for shops and resellers',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/pricing"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open the price engine
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Example scale — {quote.service.label}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {quote.device.label} · per device
                </p>
              </div>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                Recommended
              </span>
            </div>

            <div className="divide-y divide-border">
              {quote.tiers.map((tier) => {
                const recommended = tier.id === quote.recommendedTier.id;
                return (
                  <div
                    key={tier.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      recommended ? 'bg-accent/[0.06]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          recommended ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                      <span className="font-body text-sm text-foreground/90">{tier.label}</span>
                    </div>
                    <div className="text-right">
                      {tier.eligible ? (
                        <>
                          <span className="font-heading text-base font-medium tracking-tight">
                            {formatUsd(tier.unit)}
                          </span>
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            {Math.round(tier.discount * 100)}% off
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          By quote
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border bg-background/60 px-5 py-4">
              <p className="font-mono text-[10px] leading-relaxed uppercase tracking-[0.16em] text-muted-foreground">
                Volume pricing is capped by the margin floor — the badge marks the deepest tier we
                can honour without cutting technician time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}