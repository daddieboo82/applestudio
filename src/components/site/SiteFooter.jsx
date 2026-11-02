import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'Get help',
    links: [
      { label: 'AI step-by-step guide', to: '/guide' },
      { label: 'Services', to: '/#services' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { label: 'How it works', to: '/#process' },
      { label: 'Ownership policy', to: '/#ownership' },
      { label: 'Staff console', to: '/admin' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'hello@universalrecovery.suite', to: 'mailto:hello@universalrecovery.suite' },
      { label: 'Ask the AI guide', to: '/guide' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary">
                UR
              </span>
              <span className="font-heading text-sm font-medium tracking-tight">
                Universal Apple Recovery Suite
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              At-home guidance for supported Apple device diagnosis and recovery. The AI guide
              explains each step in plain language while you remain in control.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('mailto:') ? (
                      <a href={link.to} className="text-sm text-foreground/80 transition-colors hover:text-primary">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="text-sm text-foreground/80 transition-colors hover:text-primary">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 h-px w-full overflow-hidden bg-border">
          <div className="h-px w-full origin-left animate-pulse-line bg-primary" />
        </div>

        <div className="mt-5 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Universal Apple Recovery Suite</span>
          <span>We do not remove or bypass Activation Lock</span>
        </div>
      </div>
    </footer>
  );
}
