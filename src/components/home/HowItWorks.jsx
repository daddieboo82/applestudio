import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Plug, Sparkles, ShieldCheck } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';

const STEPS = [
  {
    n: '01',
    icon: MessageCircle,
    title: 'Explain it in your own words',
    body: 'Tell the AI guide what you see or what you want to do. You do not need to know model numbers, firmware names, or technical terms.',
  },
  {
    n: '02',
    icon: Plug,
    title: 'Connect when the app is ready',
    body: 'The planned Windows and macOS companion will detect a connected, supported Apple device automatically. You will not have to identify its specifications yourself.',
  },
  {
    n: '03',
    icon: Sparkles,
    title: 'Follow one simple step',
    body: 'The guide explains what to click, what to expect, and what each choice means. If something looks different, tell the guide and it will adjust the instructions.',
  },
  {
    n: '04',
    icon: ShieldCheck,
    title: 'Stay in control',
    body: 'You review every action before it happens. The guide explains data-loss risks before any restore or erase, and never performs a destructive action without your approval.',
  },
];

export default function HowItWorks() {
  return (
    <section id="process" className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeading
          index="02"
          eyebrow="Guided for everyone"
          title="You do not need a technician to explain every button."
          description="The goal is a simple at-home experience: describe the problem, follow clear instructions, and remain in control of every device action."
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="bg-background p-6 transition-colors hover:bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-primary">{step.n}</span>
                  <Icon className="h-4 w-4 text-primary/70" />
                </div>
                <h3 className="mt-5 font-heading text-base font-medium tracking-tight">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            The AI guide is available in this website now. The downloadable desktop companion and automatic USB device detection are still under development; the site will identify that clearly until the companion is released.
          </p>
          <Link to="/guide" className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary hover:opacity-80">
            Try the AI guide <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
