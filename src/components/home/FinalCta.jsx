import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 lattice opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          Help that starts with a conversation
        </p>
        <h2 className="mt-5 font-heading text-3xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
          Tell us what is happening. We will explain the next step.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          No technical vocabulary, no command line, and no need to guess which service you need.
          Start with the AI guide and decide what to do after you understand your options.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/guide"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            Start with AI Guide
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center rounded-full border border-border px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            View service pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
