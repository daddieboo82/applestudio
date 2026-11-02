import { createClientFromRequest } from "npm:@base44/sdk";

const MODEL = "gemini-3.8-flash";
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const requestsByIp = new Map<string, number[]>();

const SYSTEM_GUIDE = `You are the Universal Apple Device Recovery Suite's patient, plain-language self-service guide.
Guide non-technical customers through safe, legitimate Apple device troubleshooting one small step at a time.

- Assume the customer has no technical experience. Never shame them or use unexplained jargon.
- Give one action at a time, in short numbered steps only when needed.
- Ask at most ONE simple question at the end of a reply. Offer 2-4 simple choices when helpful.
- Never ask for model numbers, chip names, firmware versions, serial numbers, IMEI numbers, command output, logs, or technical specifications.
- Never request passwords, Apple Account credentials, verification codes, recovery keys, payment details, or security answers.
- Never ask the user to run Terminal, PowerShell, Command Prompt, scripts, registry edits, or download unofficial firmware.
- Do not claim this website can inspect USB hardware, detect a connected device, change settings, run a repair, or erase anything.
- Do not promise a repair, restore, data recovery, or compatibility result is guaranteed.
- For an erase or restore, clearly warn that it can permanently delete data. Ask whether the customer has a backup before explaining how to proceed. Never initiate an erase.
- Support only legitimate, owner-authorized diagnosis, account recovery, official restore/recovery, and organization-managed release processes.
- Never bypass or defeat Activation Lock, Find My, Apple Account authentication, screen passcodes, MDM, supervision, or other access controls.
- For Activation Lock, direct the owner to https://iforgot.apple.com, a previous owner to remove the device from Find My, or an organization-owned device to its IT administrator.
- Keep the user in control. Never claim a remote technician is connected or a device session has started.
- Answer the immediate question, then guide the next step. Do not dump an entire technical manual.
Return concise, helpful plain English.`;

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string", description: "The next plain-language guidance message. Ask at most one question." },
    choices: { type: "array", items: { type: "string" }, description: "Zero to four short response choices the customer can tap." }
  },
  required: ["message", "choices"]
};

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  if (requestsByIp.size > 2000) {
    for (const [key, times] of requestsByIp) {
      if (!times.some((time) => now - time < WINDOW_MS)) requestsByIp.delete(key);
    }
  }
  return false;
}

function safeDiagnostic(error: unknown) {
  const item = error as Record<string, any>;
  const status = Number(item?.status || item?.response?.status || 0) || null;
  const code = String(item?.code || item?.data?.error?.code || item?.response?.data?.error?.code || "").slice(0, 80);
  const message = String(
    item?.data?.error?.message ||
    item?.data?.message ||
    item?.response?.data?.error?.message ||
    item?.response?.data?.message ||
    item?.message ||
    "The AI provider did not return further details."
  ).replace(/[\r\n]+/g, " ").slice(0, 220);
  return { status, code, message };
}

async function callGemini(apiKey: string, input: string, health = false, model = MODEL) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    signal: AbortSignal.timeout(25_000),
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      model,
      input,
      store: false,
      generation_config: { thinking_level: "low", max_output_tokens: health ? 32 : 1200 },
      ...(health ? {} : {
        system_instruction: SYSTEM_GUIDE,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: ANSWER_SCHEMA
        }
      })
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(String(data?.error?.message || `Gemini API request failed (HTTP ${response.status}).`));
    (error as any).status = response.status;
    (error as any).code = data?.error?.status || data?.error?.code || "";
    throw error;
  }

  const outputText = String(
    data?.output_text ||
    data?.steps?.filter((step: any) => step?.type === "model_output")
      ?.flatMap((step: any) => step?.content || [])
      ?.filter((part: any) => part?.type === "text")
      ?.map((part: any) => part.text)
      ?.join("") ||
    ""
  ).trim();

  if (!outputText) throw new Error("Gemini returned an empty response.");
  return outputText;
}

async function callGeminiWithFallback(apiKey: string, input: string, health = false) {
  const models = [MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;
  for (const model of models) {
    try {
      const reply = await callGemini(apiKey, input, health, model);
      return { reply, model };
    } catch (error) {
      lastError = error;
      const status = Number((error as any)?.status || 0);
      if (status !== 429 && status !== 503) throw error;
      console.warn("Gemini model temporarily unavailable; trying fallback", { model, status });
    }
  }
  throw lastError || new Error("All configured Gemini models are unavailable.");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  let action = "chat";
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    action = body?.action === "health" ? "health" : "chat";

    if (action === "health") {
      const user = await base44.auth.me();
      if (!user || user.role !== "admin") {
        return Response.json({ success: false, error: "Admin access required." }, { status: 403 });
      }
    } else {
      const forwarded = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
      const ip = forwarded.split(",")[0].trim() || "unknown";
      if (limited(ip)) {
        return Response.json({ success: false, error: "Too many guide requests. Please wait one minute and try again." }, { status: 429 });
      }
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    if (!apiKey.trim()) {
      const diagnostic = {
        status: 503,
        code: "GEMINI_API_KEY_MISSING",
        message: "Add GEMINI_API_KEY to the app's secure Base44 secrets."
      };
      return action === "health"
        ? Response.json({ success: false, diagnostic })
        : Response.json({ success: false, error: "The AI provider is not configured yet." }, { status: 503 });
    }

    if (action === "health") {
      const result = await callGeminiWithFallback(apiKey, "Reply with exactly this word and nothing else: READY", true);
      const normalized = result.reply.replace(/[^A-Z]/gi, "").toUpperCase();
      return Response.json({ success: normalized === "READY", reply: result.reply, model: result.model, provider: "Google Gemini API" });
    }

    const messages = Array.isArray(body?.messages) ? body.messages.slice(-10) : [];
    const history = messages
      .filter((item: any) => (item?.role === "user" || item?.role === "assistant") && typeof item?.text === "string")
      .map((item: any) => `${item.role === "assistant" ? "GUIDE" : "CUSTOMER"}: ${item.text.slice(0, 1200)}`)
      .join("\n");
    if (!history || history.length > 14_000) {
      return Response.json({ success: false, error: "Please send a shorter message." }, { status: 400 });
    }

    const prompt = `Conversation so far:\n${history}\n\nReply as the guide. Be practical, safe, and concise.`;
    const result = await callGeminiWithFallback(apiKey, prompt);
    const outputText = result.reply;
    let answer;
    try {
      answer = JSON.parse(outputText);
    } catch {
      answer = { message: outputText, choices: [] };
    }
    return Response.json({
      success: true,
      model: result.model,
      answer: {
        message: String(answer?.message || answer?.answer || "I can help with the next step. Tell me what you see."),
        choices: Array.isArray(answer?.choices) ? answer.choices.filter((value: unknown) => typeof value === "string").slice(0, 4) : []
      }
    });
  } catch (error) {
    const diagnostic = error instanceof DOMException && error.name === "TimeoutError"
      ? { status: 504, code: "GEMINI_REQUEST_TIMEOUT", message: "Gemini did not respond within 25 seconds. Check the Google AI Studio project, API access, and quota." }
      : safeDiagnostic(error);
    console.error("Recovery Guide Gemini API request failed", diagnostic);
    if (action === "health") {
      return Response.json({ success: false, diagnostic });
    }
    return Response.json({
      success: false,
      error: "The AI guide could not complete this request."
    }, { status: diagnostic.status === 429 ? 429 : 502 });
  }
});
