import { Fingerprint, FileCheck2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeading from '@/components/site/SectionHeading';

const POINTS = [
  {
    icon: FileCheck2,
    title: 'Use services only on devices you own or are authorized to manage',
    body: 'The guide helps you understand the ownership checks before a supported workflow begins. Never provide passwords, verification codes, or account recovery keys in chat.',
  },
  {
    icon: Fingerprint,
    title: 'No Activation Lock removal',
    body: 'The suite does not remove, bypass, or work around Activation Lock, Find My, Apple Account authentication, passcodes, or organization management controls.',
  },
  {
    icon: ShieldCheck,
    title: 'Understand every step before you approve it',
    body: 'The AI explains what an action changes and warns before a restore or erase can delete data. You remain in control and must approve any destructive action yourself.',
  },
];

export default function Ownership() {
  return (
    <section id="ownership" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              index="05"
              eyebrow="Ownership and safety"
              title="Clear guidance. No security bypasses."
              description="A trustworthy recovery process explains what it can do, what it cannot do, and what may happen to your data."
            />
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Supported approach</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The intended suite focuses on owner-authorized diagnostics, supported official recovery and restoration, and simple instructions that help you make informed decisions at home.
              </p>
              <Link to="/guide" className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary hover:opacity-80">
                Ask about a recovery step <ShieldCheck className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="flex gap-4 rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/30">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="font-heading text-sm font-medium tracking-tight">{point.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
