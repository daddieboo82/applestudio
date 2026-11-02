import { createClientFromRequest } from "npm:@base44/sdk";
const API = "https://api-m.sandbox.paypal.com";
const out = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function getToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID") || "";
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  if (!id || !secret) throw new Error("PayPal Sandbox credentials are missing.");
  const r = await fetch(API + "/v1/oauth2/token", { method: "POST", headers: { Authorization: "Basic " + btoa(id + ":" + secret), "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!r.ok) throw new Error("PayPal authentication failed.");
  return (await r.json()).access_token as string;
}

const SERVICE_PRICES: Record<string, { base: number; benchmark: number }> = {
  system_repair: { base: 39, benchmark: 69 },
  data_recovery: { base: 79, benchmark: 129 },
  diagnostics: { base: 19, benchmark: 39 },
  refurb_audit: { base: 12, benchmark: 25 },
};
const DEVICE_MULTIPLIERS: Record<string, number> = {
  iphone: 1.15, ipad: 1.0, "macbook-air": 1.45, "macbook-pro": 1.65,
  imac: 1.45, "mac-mini": 1.35, "mac-studio": 1.85, "mac-pro": 2.1,
  watch: 0.8, "apple-tv": 0.9, airpods: 0.7, homepod: 0.7, "vision-pro": 1.9,
};
function retail(value: number) { return Math.max(10, Math.round(value)) - 1 + 0.99; }
async function calculateServerQuote(base44: ReturnType<typeof createClientFromRequest>, request: Record<string, unknown>) {
  const service = SERVICE_PRICES[String(request.service)];
  const multiplier = DEVICE_MULTIPLIERS[String(request.device_class)];
  const quantity = Number(request.device_count);
  if (!service || !multiplier || !Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    throw new Error("The service, device type, or quantity is invalid.");
  }
  const configs = await base44.asServiceRole.entities.PricingConfig.filter({ key: "global" });
  const config = configs?.[0];
  const marginFloor = Number(config?.margin_floor);
  const undercut = Number(config?.undercut_pct);
  const margin = Number.isFinite(marginFloor) && marginFloor >= 1 && marginFloor <= 5 ? marginFloor : 1.22;
  const undercutPct = Number.isFinite(undercut) && undercut >= 0 && undercut <= 50 ? undercut : 12;
  const cost = service.base * multiplier;
  const floor = cost * margin;
  const benchmark = service.benchmark * multiplier;
  const list = Math.max(retail(benchmark * (1 - undercutPct / 100)), retail(floor));
  const tiers = [{ max: 1, discount: 0 }, { max: 4, discount: 0.1 }, { max: 9, discount: 0.18 }, { max: 24, discount: 0.26 }, { max: 500, discount: 0.34 }];
  const tier = tiers.find((item) => quantity <= item.max) || tiers[0];
  const rawUnit = list * (1 - tier.discount);
  const unitPrice = rawUnit >= floor ? retail(rawUnit) : retail(list);
  return { unitPrice, total: Number((unitPrice * quantity).toFixed(2)) };
}
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return out({ error: "Method not allowed." }, 405);
  try {
    const b = createClientFromRequest(req);
    let user;
    try { user = await b.auth.me(); } catch { return out({ error: "Sign in to continue." }, 401); }
    if (!user) return out({ error: "Sign in to continue." }, 401);
    const body = await req.json().catch(() => ({}));
    const id = typeof body.serviceRequestId === "string" ? body.serviceRequestId : "";
    if (!id) return out({ error: "A service request is required." }, 400);
    const requests = b.asServiceRole.entities.ServiceRequest;
    const request = await requests.get(id);
    if (!request || request.created_by_id !== user.id) return out({ error: "Service request not found." }, 404);
    if (request.status === "declined" || request.status === "completed" || request.payment_status === "paid") return out({ error: "This request is not payable." }, 409);
    if (request.ownership_confirmed !== true) return out({ error: "Device ownership confirmation is required." }, 403);
    const quote = await calculateServerQuote(b, request as Record<string, unknown>);
    const amount = quote.total;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return out({ error: "The calculated estimate is invalid." }, 400);
    if (Number(request.quoted_total).toFixed(2) !== amount.toFixed(2)) {
      await requests.update(request.id, { quoted_unit_price: quote.unitPrice, quoted_total: amount });
    }
    const access = await getToken();
    const response = await fetch(API + "/v2/checkout/orders", {
      method: "POST",
      headers: { Authorization: "Bearer " + access, "Content-Type": "application/json", "PayPal-Request-Id": "service-" + request.id + "-" + crypto.randomUUID() },
      body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: request.id, custom_id: request.id, invoice_id: request.reference, description: "Apple device recovery service - " + (request.service_label || request.service), amount: { currency_code: "USD", value: amount.toFixed(2) } }], payment_source: { paypal: { experience_context: { user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: "https://appledevicerecovery.com/payment/return", cancel_url: "https://appledevicerecovery.com/payment/cancel?requestId=" + encodeURIComponent(request.id) } } } }),
    });
    const order = await response.json();
    if (!response.ok || !order.id) return out({ error: "PayPal could not create the checkout order." }, 502);
    await b.asServiceRole.entities.PaymentTransaction.create({ service_request_id: request.id, customer_id: user.id, customer_email: user.email, paypal_order_id: order.id, amount: amount.toFixed(2), currency: "USD", status: "created", environment: "sandbox" });
    await requests.update(request.id, { payment_status: "pending", paypal_order_id: order.id });
    const link = order.links?.find((x: { rel: string }) => x.rel === "payer-action" || x.rel === "approve");
    if (!link?.href) return out({ error: "PayPal did not return an approval link." }, 502);
    return out({ success: true, orderId: order.id, approvalUrl: link.href, amount: amount.toFixed(2), currency: "USD" });
  } catch (_e) { return out({ error: "Unable to start PayPal checkout." }, 500); }
});
