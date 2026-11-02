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
    const amount = Number(request.quoted_total);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return out({ error: "The saved estimate has an invalid amount." }, 400);
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
