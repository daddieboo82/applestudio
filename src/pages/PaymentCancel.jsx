import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentCancel() {
  const [params] = useSearchParams();
  const requestId = params.get('requestId');
  return (
    <main className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <section className="rounded-xl border border-border bg-card p-8">
        <h1 className="font-heading text-2xl font-medium">Checkout was cancelled</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">PayPal returned you to the website without completing checkout. Your service request remains saved, but it is not marked as paid.</p>
        {requestId && <p className="mt-4 font-mono text-xs text-muted-foreground">Request reference ID: {requestId}</p>}
        <Link to="/pricing" className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground">Return to pricing</Link>
      </section>
    </main>
  );
}
