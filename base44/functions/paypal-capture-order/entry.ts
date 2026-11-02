import { createClientFromRequest } from "npm:@base44/sdk";
const API = "https://api-m.sandbox.paypal.com";
const out = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function getToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID") || "", secret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  if (!id || !secret) throw new Error("PayPal credentials are missing.");
  const r = await fetch(API + "/v1/oauth2/token", { method: "POST", headers: { Authorization: "Basic " + btoa(id + ":" + secret), "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!r.ok) throw new Error("PayPal authentication failed.");
  return (await r.json()).access_token as string;
}
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return out({ error: "Method not allowed." }, 405);
  try {
    const b = createClientFromRequest(req), user = await b.auth.me();
    if (!user) return out({ error: "Sign in to continue." }, 401);
    const body = await req.json().catch(() => ({})), orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) return out({ error: "A PayPal order ID is required." }, 400);
    const payments = b.asServiceRole.entities.PaymentTransaction;
    const rows = await payments.filter({ paypal_order_id: orderId }, "-created_date", 1), payment = rows?.[0];
    if (!payment || payment.customer_id !== user.id) return out({ error: "Payment order not found." }, 404);
    if (payment.status === "completed") return out({ success: true, status: "completed", amount: payment.amount, currency: payment.currency });
    const access = await getToken(), url = API + "/v2/checkout/orders/" + encodeURIComponent(orderId);
    let response = await fetch(url, { headers: { Authorization: "Bearer " + access } });
    if (!response.ok) return out({ error: "Could not verify the PayPal order." }, 502);
    let order = await response.json();
    if (order.status !== "COMPLETED") {
      response = await fetch(url + "/capture", { method: "POST", headers: { Authorization: "Bearer " + access, "Content-Type": "application/json", "PayPal-Request-Id": "capture-" + orderId }, body: "{}" });
      const result = await response.json();
      if (!response.ok) return out({ error: "PayPal did not complete the payment capture." }, 502);
      order = result;
    }
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED") return out({ error: "PayPal has not confirmed payment completion." }, 409);
    if (capture.amount?.currency_code !== payment.currency || Number(capture.amount?.value).toFixed(2) !== Number(payment.amount).toFixed(2)) return out({ error: "Captured amount does not match the saved estimate." }, 409);
    await payments.update(payment.id, { status: "completed", paypal_capture_id: capture.id, captured_at: new Date().toISOString() });
    await b.asServiceRole.entities.ServiceRequest.update(payment.service_request_id, { payment_status: "paid" });
    return out({ success: true, status: "completed", orderId, captureId: capture.id, amount: payment.amount, currency: payment.currency });
  } catch (_e) { return out({ error: "Unable to verify payment completion." }, 500); }
});
