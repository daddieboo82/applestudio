import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const orderId = params.get('token');
  const [state, setState] = useState({ loading: true, error: '', payment: null });

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setState({ loading: false, error: 'PayPal did not return an order reference.', payment: null });
      return () => { active = false; };
    }
    base44.functions.invoke('paypal-capture-order', { orderId })
      .then((result) => {
        const data = result?.data || result;
        if (!data?.success || data.status !== 'completed') {
          throw new Error(data?.error || 'Payment has not been confirmed.');
        }
        if (active) setState({ loading: false, error: '', payment: data });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error?.message || 'We could not confirm this payment.', payment: null });
      });
    return () => { active = false; };
  }, [orderId]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <section className="rounded-xl border border-border bg-card p-8">
        {state.loading ? (
          <>
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
            <h1 className="mt-5 font-heading text-2xl font-medium">Confirming your payment…</h1>
            <p className="mt-3 text-sm text-muted-foreground">We are checking the transaction directly with PayPal. Please keep this page open.</p>
          </>
        ) : state.payment ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="mt-5 font-heading text-2xl font-medium">Payment confirmed</h1>
            <p className="mt-3 text-sm text-muted-foreground">PayPal confirmed your Sandbox payment. Your service request is marked paid; this is not confirmation that service work has been completed.</p>
            <p className="mt-5 font-mono text-xs text-muted-foreground">Transaction: {state.payment.captureId || state.payment.orderId}</p>
            <p className="mt-2 font-heading text-2xl">{state.payment.currency} {state.payment.amount}</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="mt-5 font-heading text-2xl font-medium">Payment not confirmed</h1>
            <p role="alert" className="mt-3 text-sm text-muted-foreground">{state.error}</p>
            <p className="mt-3 text-xs text-muted-foreground">Do not submit another payment until you have checked your PayPal Sandbox activity.</p>
          </>
        )}
        <Link to="/" className="mt-8 inline-flex rounded-full border border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em]">Return to website</Link>
      </section>
    </main>
  );
}
