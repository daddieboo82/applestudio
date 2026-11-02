import { Link } from 'react-router-dom';
import { ArrowUpRight, Cpu, HardDrive, Layers, Stethoscope } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';
import { DEVICE_CLASSES, SERVICES, formatUsd, getQuote } from '@/lib/pricing';

const lowestPrice = (service) =>
  Math.min(
    ...DEVICE_CLASSES.map(
      (device) => getQuote({ serviceId: service.id, deviceClassId: device.id, quantity: 1 }).unitPrice,
    ),
  );

const ICONS = {
  wrench: Cpu,
  drive: HardDrive,
  stethoscope: Stethoscope,
  layers: Layers,
};

export default function ServiceGrid() {
  return (
    <section id="services" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            index="01"
            eyebrow="Supported service paths"
            title="Choose the kind of help you need."
            description="The AI guide helps explain each service in everyday language. Final availability depends on the supported device workflow and a verified compatibility check."
          />
          <Link to="/guide" className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary hover:underline">
            Ask AI to choose <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = ICONS[service.icon] || Cpu;
            const featured = i === 0;
            return (
              <div key={service.id} className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40 ${featured ? 'md:col-span-2' : ''}`}>
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    from {formatUsd(lowestPrice(service))}
                  </span>
                </div>
                <h3 className="mt-6 font-heading text-lg font-medium tracking-tight">{service.label}</h3>
                <p className={`mt-2 text-sm leading-relaxed text-muted-foreground ${featured ? 'max-w-md' : ''}`}>
                  {service.blurb}
                </p>
                <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span>At-home workflow</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>Compatibility checked first</span>
                </div>
                <Link to="/guide" className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary hover:opacity-80">
                  Understand this service <ArrowUpRight className="h-3 w-3" />
                </Link>
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:bg-primary/10" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
