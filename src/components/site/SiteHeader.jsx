import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sparkles, X } from 'lucide-react';

const NAV = [
  { label: 'Services', to: '/#services' },
  { label: 'Process', to: '/#process' },
  { label: 'AI Guide', to: '/guide' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/#faq' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold tracking-tight text-primary">
            UR
          </span>
          <span className="font-heading text-sm font-medium leading-tight tracking-tight">
            Universal Apple
            <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Recovery Suite
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/guide"
            className="ml-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 pb-6 pt-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-border/60 py-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/guide"
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" />
            Ask AI Guide
          </Link>
        </div>
      )}
    </header>
  );
}
