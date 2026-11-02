import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import usePricingConfig from '@/hooks/usePricingConfig';
import { formatUsd, getQuote } from '@/lib/pricing';

const makeReference = () => {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 6)
      : Math.random().toString(36).slice(2, 8);
  return `UR-${random.toUpperCase()}`;
};

export default function Quote() {
  const [params] = useSearchParams();
  const config = usePricingConfig();
  const serviceId = params.get('service') || 'system_repair';
  const deviceClassId = params.get('device') || 'iphone';
  const quantity = Math.max(1, Math.min(500, Number(params.get('qty')) || 1));
  const quote = useMemo(
    () => getQuote({ serviceId, deviceClassId, quantity, config }),
    [serviceId, deviceClassId, quantity, config],
  );

  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [ownership, setOwnership] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState(null);
  const [serviceRequestId, setServiceRequestId] = useState(null);
  const [startingPayment, setStartingPayment] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((user) => { if (active) setAccount(user); })
      .catch(() => { if (active) setError('We could not load your account details. Please sign in again.'); })
      .finally(() => { if (active) setAccountLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!account?.email) {
      setError('Please sign in again before saving this request.');
      return;
    }
    if (!ownership) {
      setError('Please confirm that you own this device before continuing.');
      return;
    }
    setSubmitting(true);
    try {
      const ref = makeReference();
      const savedRequest = await base44.entities.ServiceRequest.create({
        reference: ref,
        customer_name: account.full_name || '',
        email: account.email,
        service: quote.service.id,
        service_label: quote.service.label,
        device_class: quote.device.id,
        device_label: quote.device.label,
        device_model: '',
        device_count: quote.quantity,
        session_window: 'Self-service with AI guide',
        quoted_unit_price: quote.unitPrice,
        quoted_total: quote.total,
        notes,
        ownership_confirmed: true,
        status: 'received',
      });
      setServiceRequestId(savedRequest.id);
      setReference(ref);
    } catch {
      setError('We could not save that request. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!serviceRequestId) return;
    setError('');
    setStartingPayment(true);
    try {
      const result = await base44.functions.invoke('paypal-create-order', {
        serviceRequestId,
      });
      const data = result?.data || result;
      if (!data?.success || !data?.approvalUrl) {
        throw new Error(data?.error || 'PayPal checkout could not be started.');
      }
      window.location.assign(data.approvalUrl);
    } catch (paymentError) {
      setError(paymentError?.message || 'Unable to start PayPal checkout. Please try again.');
      setStartingPayment(false);
    }
  };

  if (reference) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <div className="rounded-xl border border-border bg-card p-8">
          <CheckCircle2 className="h-7 w-7 text-primary" />
          <h1 className="mt-5 font-heading text-2xl font-medium tracking-tight sm:text-3xl">
            Your service request is saved.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your reference is <span className="font-mono text-foreground">{reference}</span>. No
            device has been connected, changed, or erased by saving this request. Open the AI guide
            to understand the next supported steps from home.
          </p>
          <dl className="mt-7 divide-y divide-border border-y border-border">
            {[
              ['Service', quote.service.label],
              ['Device type', quote.device.label],
              ['Devices', String(quote.quantity)],
              ['Estimated price per device', formatUsd(quote.unitPrice)],
              ['Estimated total', formatUsd(quote.total)],
              ['Account', account?.email || 'Signed-in account'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            This is a saved service request and estimate, not a payment receipt or confirmation that
            a repair has been performed.
          </p>
          {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handlePayment}
              disabled={startingPayment || !serviceRequestId}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {startingPayment ? 'Connecting to PayPal…' : 'Continue to PayPal Sandbox'}
            </button>
            <Link
              to="/guide"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" /> Continue with AI guide
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to pricing
      </Link>

      <div className="mt-7 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="font-heading text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Save your help request.
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            We fill in your account details for you. Tell us what is wrong in your own words. You can leave it blank and ask the AI guide to help.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Signed-in account</p>
            {accountLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading account…</p>
            ) : (
              <p className="mt-2 text-sm text-foreground">{account?.email || 'Account email unavailable'}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                What is wrong? <span className="normal-case tracking-normal">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                maxLength={1200}
                className="mt-2 w-full resize-y rounded-md border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                placeholder="For example: It will not turn on, or I cannot see my photos. You can leave this blank too."
              />
            </label>

            <label className="flex items-start gap-3 rounded-md border border-border bg-card p-3.5">
              <input
                type="checkbox"
                checked={ownership}
                onChange={(event) => setOwnership(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                I own this device or have permission from its owner. I understand that Activation
                Lock and other account or organization security controls will not be bypassed.
              </span>
            </label>

            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting || accountLoading || !account?.email}
              className="w-full rounded-full bg-primary px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save estimate and continue'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Estimate summary</p>
            <p className="mt-4 text-sm text-foreground">{quote.service.label}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {quote.device.label} · {quote.quantity} device{quote.quantity > 1 ? 's' : ''}
            </p>
            <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Per device</p>
                <p className="mt-1 font-heading text-3xl font-medium tracking-tight">{formatUsd(quote.unitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Estimated total</p>
                <p className="mt-1 font-heading text-xl font-medium tracking-tight text-primary">{formatUsd(quote.total)}</p>
              </div>
            </div>
            <p className="mt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
              Tier applied: {quote.activeTier.label} · Reference benchmark {formatUsd(quote.benchmark)}
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.05] p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Need help choosing?</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The AI guide can explain each service in plain language and help you choose without
              asking for technical specifications.
            </p>
            <Link to="/guide" className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary hover:opacity-80">
              Ask the AI guide <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
