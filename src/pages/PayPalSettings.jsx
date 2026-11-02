import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleAlert, Copy, ExternalLink, Loader2, LockKeyhole, ShieldCheck, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SECRET_NAMES = ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'];

function StatusRow({ label, detail, ready }) {
  const Icon = ready ? CheckCircle2 : CircleAlert;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ready ? 'text-emerald-500' : 'text-amber-500'}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      </div>
      <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {ready ? 'Configured' : 'Missing'}
      </span>
    </div>
  );
}

export default function PayPalSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState('sandbox');
  const [credentials, setCredentials] = useState(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [pageError, setPageError] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((current) => { if (active) setUser(current); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    setChecking(true);
    setPageError('');
    base44.functions.invoke('paypal-status', { environment, action: 'status' })
      .then((result) => {
        if (!active) return;
        setCredentials(result?.credentials || null);
        if (result?.success === false) setPageError(result.message || 'Could not read PayPal configuration.');
      })
      .catch(() => {
        if (active) setPageError('The secure PayPal status service could not be reached.');
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [user, environment, refreshKey]);

  const copySecretNames = async () => {
    try {
      await navigator.clipboard.writeText(SECRET_NAMES.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setPageError('Your browser did not allow copying. You can select the secret names manually.');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setPageError('');
    try {
      const result = await base44.functions.invoke('paypal-status', { environment, action: 'test' });
      setCredentials(result?.credentials || credentials);
      setTestResult(result);
    } catch {
      setTestResult({
        success: false,
        connectionStatus: 'error',
        message: 'The secure PayPal connection test could not be reached. Check that you are signed in as the app administrator.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-5 py-20"><div className="h-8 w-48 animate-pulse rounded bg-card" /></div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-medium">Owner access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">PayPal settings are available only to the app administrator.</p>
        <Link to="/admin" className="mt-6 inline-flex rounded-full border border-border px-4 py-2 text-sm">Back to staff console</Link>
      </div>
    );
  }

  const clientReady = credentials?.clientIdConfigured === true;
  const secretReady = credentials?.clientSecretConfigured === true;
  const webhookReady = credentials?.webhookIdConfigured === true;
  const connected = testResult?.connectionStatus === 'connected';

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link to="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to staff console
      </Link>

      <div className="mt-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Owner settings</p>
          <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight">PayPal payments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Configure one-time customer payments. Credentials stay in Base44's private backend secret store and are never shown on this page.
          </p>
        </div>
      </div>

      <section className="mt-9 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">PayPal environment</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sandbox is the configured environment while payment processing is being tested.</p>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">Sandbox only</span>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-background/70 p-4">
          <p className="text-sm font-medium">{environment === 'sandbox' ? 'Test payments only' : 'Real customer payments'}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {environment === 'sandbox'
              ? 'Use your PayPal sandbox app credentials. No real customer money is moved.'
              : 'Live mode authenticates against PayPal Live. Do not enable customer checkout until payment capture and webhook verification are implemented and tested.'}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Secure credential status</h2>
            <p className="mt-1 text-xs text-muted-foreground">Status is checked by a private backend function. Secret values are never returned to the browser.</p>
          </div>
          <button type="button" onClick={() => setRefreshKey((v) => v + 1)} disabled={checking} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh status
          </button>
        </div>
        <div className="grid gap-3">
          <StatusRow label="PayPal Client ID" detail="PAYPAL_CLIENT_ID — must contain the real Client ID for the selected environment." ready={clientReady} />
          <StatusRow label="PayPal Client Secret" detail="PAYPAL_CLIENT_SECRET — must contain the matching secret. Never paste it into chat or customer-facing fields." ready={secretReady} />
          <StatusRow label="PayPal Webhook ID" detail="PAYPAL_WEBHOOK_ID — add this after registering and verifying the HTTPS webhook endpoint." ready={webhookReady} />
        </div>
        {checking && <p className="mt-3 text-xs text-muted-foreground">Checking secure backend configuration…</p>}
        {pageError && <p role="alert" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700">{pageError}</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold">PayPal webhook endpoint</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Register this HTTPS endpoint in your PayPal Sandbox REST app. The function verifies PayPal's signature before recording events. It must be deployed before PayPal can deliver successfully.</p>
        <code className="mt-3 block break-all rounded-lg border border-border bg-background px-3 py-3 text-xs text-foreground">https://universal-apple-device-recovery-sui-7f97bfa5.base44.app/api/functions/paypal-webhook</code>
        <p className="mt-3 text-xs text-muted-foreground">Subscribe to PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED, and PAYMENT.CAPTURE.REVERSED.</p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Test PayPal connection</h2>
            <p className="mt-1 text-xs text-muted-foreground">This checks PayPal authentication only. It does not create an order or charge anyone.</p>
          </div>
          <button type="button" onClick={testConnection} disabled={testing || checking || !clientReady || !secretReady} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Test connection
          </button>
        </div>
        {testResult && (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${connected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            {connected ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /> : <CircleAlert className="mt-0.5 h-5 w-5 text-amber-500" />}
            <div>
              <p className="text-sm font-semibold">{connected ? 'PayPal authenticated' : 'Connection not verified'}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{testResult.message}</p>
            </div>
          </div>
        )}
        {!clientReady || !secretReady ? <p className="mt-3 text-xs text-muted-foreground">Enter real credentials in the secure backend secret store before testing.</p> : null}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Credential secret names</h2>
          <button type="button" onClick={copySecretNames} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground">
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy names'}
          </button>
        </div>
        <div className="mt-3 space-y-2 font-mono text-xs text-muted-foreground">
          {SECRET_NAMES.map((name) => <div key={name} className="rounded-lg border border-border bg-background px-3 py-2">{name}</div>)}
        </div>
        <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          Open PayPal Developer Dashboard <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <h2 className="text-sm font-semibold">Sandbox checkout is not live yet</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The Sandbox order, capture, payment-record, and signature-verified webhook code is now in the source repository. It has not been deployed to Base44 or tested against your PayPal Sandbox account yet. Do not accept customer payments until deployment, secret configuration, webhook registration, and an end-to-end Sandbox test are complete. Live payments are not enabled.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
