import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DEVICE_CLASSES, SERVICES, formatUsd, getQuote } from '@/lib/pricing';

export default function Hero() {
  const [serviceId, setServiceId] = useState('system_repair');
  const [deviceClassId, setDeviceClassId] = useState('iphone');

  const quote = useMemo(
    () => getQuote({ serviceId, deviceClassId, quantity: 1 }),
    [serviceId, deviceClassId],
  );
  const bulk = useMemo(
    () => getQuote({ serviceId, deviceClassId, quantity: 5 }),
    [serviceId, deviceClassId],
  );
  const bulkSaving = bulk.unitPrice < quote.unitPrice;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 lattice opacity-70" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-accent/10 blur-[150px]" />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-10">
        <div className="animate-rise lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              At-home guidance · Pay per service
            </span>
          </div>

          <h1 className="mt-7 font-heading text-[2.6rem] font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-[4.2rem]">
            Get help with your Apple device.
            <span className="block text-primary">One simple step at a time.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell our AI guide what is happening in your own words. It explains the next step without
            command lines, technical jargon, or asking you to know your device specifications.
            You stay at home and stay in control.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/guide"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Start with AI Guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              View service pricing
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-7">
            {[
              { k: 'Plain English', v: 'Step-by-step help' },
              { k: 'At home', v: 'You stay in control' },
              { k: 'No commands', v: 'No terminal needed' },
            ].map((item) => (
              <div key={item.v}>
                <dt className="font-heading text-lg font-medium tracking-tight text-foreground">
                  {item.k}
                </dt>
                <dd className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {item.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-rise lg:col-span-5" style={{ animationDelay: '120ms' }}>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card/90 p-5 shadow-[0_30px_80px_-40px_rgba(0,242,255,0.35)] backdrop-blur sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Quick service estimate
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                ESTIMATE
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  1 / What kind of device?
                </span>
                <select
                  value={deviceClassId}
                  onChange={(e) => setDeviceClassId(e.target.value)}
                  className="mt-2 w-full appearance-none rounded-md border border-border bg-background px-3 py-3 font-body text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {DEVICE_CLASSES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  2 / What do you need help with?
                </span>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-2 w-full appearance-none rounded-md border border-border bg-background px-3 py-3 font-body text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Not sure which choice is right? Ask the AI guide instead. You do not need to know
                the model number or technical details.
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background/70 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Estimate per device
                  </p>
                  <p className="mt-1 font-heading text-4xl font-medium tracking-tight text-foreground">
                    {formatUsd(quote.unitPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Reference price
                  </p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    {formatUsd(quote.benchmark)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                  Estimate only
                </span>
                {bulkSaving && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatUsd(bulk.unitPrice)} each from 5 devices
                  </span>
                )}
              </div>
            </div>

            <Link
              to="/guide"
              className="mt-4 flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
            >
              Let AI help me choose
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Desktop USB auto-detection companion is still in development
          </p>
        </div>
      </div>
    </section>
  );
}
