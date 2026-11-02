import { createClientFromRequest } from "npm:@base44/sdk";

const API = "https://api-m.sandbox.paypal.com";
const out = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function getToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID") || "";
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  if (!id || !secret) throw new Error("PayPal Sandbox credentials are missing.");
  const response = await fetch(API + "/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(id + ":" + secret), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed.");
  return (await response.json()).access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return out({ error: "Method not allowed." }, 405);
  try {
    const event = await req.json();
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") || "";
    if (!webhookId) return out({ error: "PAYPAL_WEBHOOK_ID is not configured." }, 503);

    const verificationPayload = {
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    };
    if (Object.values(verificationPayload).some((value) => !value)) return out({ error: "Missing PayPal signature headers." }, 400);

    const access = await getToken();
    const verificationResponse = await fetch(API + "/v1/notifications/verify-webhook-signature", {
      method: "POST",
      headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
      body: JSON.stringify(verificationPayload),
    });
    if (!verificationResponse.ok) return out({ error: "Could not verify PayPal webhook signature." }, 400);
    const verification = await verificationResponse.json();
    if (verification.verification_status !== "SUCCESS") return out({ error: "Unverified PayPal webhook." }, 400);

    const base44 = createClientFromRequest(req);
    const payments = base44.asServiceRole.entities.PaymentTransaction;
    const eventType = event.event_type;
    const resource = event.resource || {};

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (!orderId || !resource.id) return out({ error: "Capture event is missing its order or capture ID." }, 400);
      const rows = await payments.filter({ paypal_order_id: orderId }, "-created_date", 1);
      const payment = rows?.[0];
      if (!payment) return out({ received: true, unmatched: true });
      const orderResponse = await fetch(API + "/v2/checkout/orders/" + encodeURIComponent(orderId), {
        headers: { Authorization: "Bearer " + access },
      });
      if (!orderResponse.ok) return out({ error: "Could not retrieve PayPal order details." }, 502);
      const order = await orderResponse.json();
      const capture = order.purchase_units?.[0]?.payments?.captures?.find((item: { id: string }) => item.id === resource.id);
      if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED") return out({ error: "PayPal order or capture is not completed." }, 409);
      if (capture.amount?.currency_code !== payment.currency || Number(capture.amount?.value).toFixed(2) !== Number(payment.amount).toFixed(2)) {
        return out({ error: "Capture amount does not match the recorded transaction." }, 409);
      }
      if (payment.status !== "completed") {
        await payments.update(payment.id, { status: "completed", paypal_capture_id: capture.id, captured_at: new Date().toISOString() });
        await base44.asServiceRole.entities.ServiceRequest.update(payment.service_request_id, { payment_status: "paid" });
      }
      return out({ received: true, processed: true });
    }

    if (eventType === "PAYMENT.CAPTURE.REFUNDED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      const captureId = resource.id || resource.supplementary_data?.related_ids?.capture_id;
      if (!captureId) return out({ error: "Refund event is missing capture ID." }, 400);
      const rows = await payments.filter({ paypal_capture_id: captureId }, "-created_date", 1);
      const payment = rows?.[0];
      if (!payment) return out({ received: true, unmatched: true });
      await payments.update(payment.id, { status: "refunded" });
      await base44.asServiceRole.entities.ServiceRequest.update(payment.service_request_id, { payment_status: "refunded" });
      return out({ received: true, processed: true });
    }

    return out({ received: true, ignored: true, eventType });
  } catch (_error) {
    return out({ error: "Webhook processing failed." }, 500);
  }
});
