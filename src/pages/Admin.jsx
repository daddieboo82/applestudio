import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CONFIG } from '@/lib/pricing';
import RequestsTable from '@/components/admin/RequestsTable';
import PricingControls from '@/components/admin/PricingControls';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [configId, setConfigId] = useState(null);
  const [draft, setDraft] = useState({
    margin_floor: DEFAULT_CONFIG.margin_floor,
    undercut_pct: DEFAULT_CONFIG.undercut_pct,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiCheck, setAiCheck] = useState({ status: 'not-tested', message: 'Run a test to check the Recovery Guide AI connection.', checkedAt: null, latency: null });
  const [aiChecking, setAiChecking] = useState(false);

  const runAiHealthCheck = async () => {
    if (aiChecking) return;
    setAiChecking(true);
    const startedAt = Date.now();
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        model: 'gemini_3_8_flash',
        prompt: 'This is a short service health check for the Universal Apple Device Recovery Suite. Reply with exactly this word and nothing else: READY',
      });
      const latency = Date.now() - startedAt;
      const reply = typeof response === 'string' ? response.trim() : String(response?.message || response?.answer || '').trim();
      if (reply.toUpperCase() !== 'READY') {
        throw new Error('The AI service returned an unexpected health-check response.');
      }
      setAiCheck({
        status: 'online',
        message: 'The configured AI model returned the expected READY response. The customer Recovery Guide can reach the model.',
        checkedAt: new Date().toISOString(),
        latency,
      });
    } catch (error) {
      const statusCode = error?.status || error?.response?.status || null;
      const message = statusCode === 401 || statusCode === 403
        ? 'The AI integration rejected the request. Check the app AI integration permissions and configuration.'
        : statusCode === 429
          ? 'The AI service is rate-limiting requests. Wait and test again.'
          : statusCode >= 500
            ? 'The AI provider or integration returned a server error. Try again later.'
            : 'The AI health check failed. Review the browser and Base44 function diagnostics for the underlying error.';
      setAiCheck({ status: 'offline', message, checkedAt: new Date().toISOString(), latency: Date.now() - startedAt });
    } finally {
      setAiChecking(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      if (me?.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const [requestRows, configRows] = await Promise.all([
        base44.entities.ServiceRequest.list('-created_date', 100),
        base44.entities.PricingConfig.filter({ key: 'global' }),
      ]);

      setRequests(requestRows);
      const config = Array.isArray(configRows) ? configRows[0] : null;
      if (config) {
        setConfigId(config.id);
        setDraft({
          margin_floor: Number(config.margin_floor) || DEFAULT_CONFIG.margin_floor,
          undercut_pct: Number.isFinite(Number(config.undercut_pct))
            ? Number(config.undercut_pct)
            : DEFAULT_CONFIG.undercut_pct,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleStatus = async (id, status) => {
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    await base44.entities.ServiceRequest.update(id, { status });
  };

  const handleDraft = (key, value) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      key: 'global',
      margin_floor: Number(draft.margin_floor),
      undercut_pct: Number(draft.undercut_pct),
    };
    if (configId) {
      await base44.entities.PricingConfig.update(configId, payload);
    } else {
      const created = await base44.entities.PricingConfig.create(payload);
      setConfigId(created.id);
    }
    setSaving(false);
    setSaved(true);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="h-6 w-40 animate-pulse rounded bg-card" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-heading text-2xl font-medium tracking-tight">Staff console</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This area is limited to workspace admins. Ask an admin to grant your account the admin
          role, then reload this page.
        </p>
      </div>
    );
  }

  const openCount = requests.filter(
    (request) => request.status !== 'completed' && request.status !== 'declined',
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-primary/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Staff console
            </span>
          </div>
          <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight">
            Quotes and pricing
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/admin/payments" className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/15">
            PayPal settings
          </Link>
          <div>
            <p className="font-heading text-2xl font-medium tracking-tight">{requests.length}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Total requests
            </p>
          </div>
          <div>
            <p className="font-heading text-2xl font-medium tracking-tight text-primary">{openCount}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Open
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="ai-health-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${aiCheck.status === 'online' ? 'bg-emerald-500' : aiCheck.status === 'offline' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Service monitoring</p>
            </div>
            <h2 id="ai-health-heading" className="mt-2 font-heading text-xl font-medium">Recovery Guide AI</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{aiCheck.message}</p>
            {aiCheck.checkedAt && (
              <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                Last checked {new Date(aiCheck.checkedAt).toLocaleString()} · {aiCheck.latency} ms
              </p>
            )}
          </div>
          <button type="button" onClick={runAiHealthCheck} disabled={aiChecking} className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/15 disabled:cursor-wait disabled:opacity-50">
            {aiChecking ? 'Testing connection…' : 'Test AI connection'}
          </button>
        </div>
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          This on-demand check sends a short test prompt to the same Base44 AI model used by the customer guide. It does not include customer conversations or device information. A successful test confirms model connectivity at that moment, not uninterrupted future availability.
        </p>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Incoming sessions
          </h2>
          <div className="mt-3">
            <RequestsTable requests={requests} onStatusChange={handleStatus} />
          </div>
        </div>
        <div className="lg:col-span-4">
          <PricingControls
            draft={draft}
            onChange={handleDraft}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
        </div>
      </div>
    </div>
  );
}