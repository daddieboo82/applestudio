import { createClientFromRequest } from "npm:@base44/sdk";

const isRealSecret = (value: string) =>
  Boolean(value && value.trim() && !value.startsWith("REPLACE_WITH_"));

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const environment = body.environment === "live" ? "live" : "sandbox";
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID") || "";
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") || "";

    const credentials = {
      clientIdConfigured: isRealSecret(clientId),
      clientSecretConfigured: isRealSecret(clientSecret),
      webhookIdConfigured: isRealSecret(webhookId),
    };

    if (body.action !== "test") {
      return Response.json({ success: true, environment, credentials, connectionStatus: "not_tested" });
    }

    if (!credentials.clientIdConfigured || !credentials.clientSecretConfigured) {
      return Response.json({
        success: false, environment, credentials, connectionStatus: "not_configured",
        message: "Add your real PayPal Client ID and Client Secret in secure Base44 backend secrets before testing.",
      });
    }

    const host = environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const tokenResponse = await fetch(`${host}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      return Response.json({
        success: false, environment, credentials, connectionStatus: "failed",
        message: tokenResponse.status === 401
          ? "PayPal rejected these credentials. Check that the Client ID and Secret belong to the selected environment."
          : `PayPal connection test failed (HTTP ${tokenResponse.status}). Check the selected environment and try again.`,
      });
    }

    const token = await tokenResponse.json();
    return Response.json({
      success: true, environment, credentials, connectionStatus: "connected",
      tokenExpiresIn: Number(token.expires_in) || null,
      message: "PayPal authenticated successfully. No payment was created or charged.",
    });
  } catch (_error) {
    return Response.json({ success: false, connectionStatus: "error", message: "The PayPal settings check could not be completed. Try again." }, { status: 500 });
  }
});