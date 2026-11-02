import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Bot, CheckCircle2, CircleHelp, Loader2, RotateCcw, Send, ShieldCheck, Sparkles, Usb } from 'lucide-react';

const STARTERS = [
  { label: 'Get started', prompt: 'Guide me from the beginning. I do not know the technical details of my device.' },
  { label: 'Mac computer', prompt: 'I need help with a Mac computer. Please guide me without asking for model numbers or technical specifications.' },
  { label: 'iPhone or iPad', prompt: 'I need help with an iPhone or iPad. Please guide me in plain language.' },
  { label: 'Another Apple device', prompt: 'I need help with Apple Watch, Apple TV, AirPods, HomePod, or Apple Vision Pro. Help me understand which supported steps apply.' },
  { label: 'Connect my device', prompt: 'Help me connect my Apple device to my computer. Use simple instructions.' },
  { label: 'Understand a problem', prompt: 'Help me describe what is happening with my device and choose a safe next step.' },
  { label: 'Prepare for a restore', prompt: 'Help me check whether a restore is appropriate and understand what data could be erased.' },
  { label: 'I am stuck', prompt: 'I am stuck. Please ask me one simple question at a time and guide me.' },
];

const SYSTEM_GUIDE = `You are the Universal Apple Device Recovery Suite's patient, plain-language self-service guide.
Your job is to guide a non-technical customer through every supported website and at-home process one small step at a time.

TONE AND METHOD:
- Assume the customer has no technical experience. Never shame them or use unexplained jargon.
- Give one action at a time, in short numbered steps only when truly needed. Explain exactly what they should look for.
- Ask at most ONE simple question at the end of a reply. Offer 2-4 simple choices when helpful.
- Do not ask users to provide model numbers, chip names, firmware versions, serial numbers, IMEI numbers, command output, logs, or technical specifications. Help them describe what they can see in ordinary language. For Macs, accept the visible family choice MacBook Air, MacBook Pro, iMac, Mac mini, Mac Studio, or Mac Pro; never ask the user to distinguish Intel, T2, or Apple silicon.
- Never request passwords, Apple Account credentials, verification codes, recovery keys, payment details, or security answers.
- Never ask the user to run Terminal, PowerShell, Command Prompt, scripts, registry edits, or download unofficial firmware.
- Do not claim that this website can inspect a USB port, detect a connected device, change settings, run a repair, or erase anything. Browser chat cannot directly control USB hardware. The downloadable desktop companion that will perform automatic device detection for iPhone, iPad, MacBook Air, MacBook Pro, iMac, Mac mini, Mac Studio, Mac Pro, Apple Watch, Apple TV, AirPods, HomePod, and Apple Vision Pro is not yet available in this project; be honest about that limitation.
- Where appropriate, explain that the future companion app is intended to detect the connected device automatically so users will not have to enter technical details. Do not tell them it is already available.
- Do not promise that a repair, restore, data recovery, or compatibility result is guaranteed. Explain that availability depends on the exact device and supported official workflows.
- For an erase or restore, clearly warn that it can permanently delete data. Ask whether the customer has a backup before explaining how to proceed. Never initiate or pretend to initiate an erase.
- Support only legitimate, owner-authorized diagnosis, account recovery, official restore/recovery, and organization-managed release processes.
- Do not provide instructions to bypass or defeat Activation Lock, Find My, Apple Account authentication, screen passcodes, MDM, supervision, or other access controls. For a lock, direct the owner to Apple's official account/device recovery or the organization's administrator.
- If a request is outside supported scope, explain the limitation calmly and offer the safest legitimate route.
- Keep the user in control; never claim a remote technician is connected or that a device session has started.
- For a process question, answer the immediate question and then guide the next step. Do not dump an entire technical manual.

Return a concise, helpful response in plain English. If the user is unsure, reassure them and ask only what they can easily observe.`;

function makePrompt(messages, latest) {
  const history = messages
    .slice(-10)
    .map((item) => `${item.role === 'assistant' ? 'GUIDE' : 'CUSTOMER'}: ${item.text}`)
    .join('\n');
  return `${SYSTEM_GUIDE}

Conversation so far:
${history || '(This is the start of the conversation.)'}

CUSTOMER: ${latest}

Reply as the guide. Be practical, safe, and concise.`;
}

function normalizeAnswer(result) {
  if (typeof result === 'string') return { message: result, choices: [] };
  if (result && typeof result === 'object') {
    return {
      message: result.message || result.answer || result.response || 'I can help with the next step. Tell me what you see on your screen.',
      choices: Array.isArray(result.choices) ? result.choices.slice(0, 4).filter((x) => typeof x === 'string') : [],
    };
  }
  return { message: 'I can help with the next step. Tell me what you see on your screen.', choices: [] };
}

function makeFallbackReply(latest, history = []) {
  const context = [...history, { role: 'user', text: latest }]
    .filter((item) => item?.text)
    .map((item) => item.text.toLowerCase())
    .join(' ');
  const text = context;
  const latestText = latest.toLowerCase();

  if (/it says activation lock|activation lock|locked to owner/.test(latestText)) {
    return {
      message: "Activation Lock protects the owner's device. I cannot bypass it. If this is your Mac, start at Apple's official account recovery page: https://iforgot.apple.com. If you bought it used, ask the previous owner to remove it from their Find My account. Is this your own Mac or a used purchase?",
      choices: ["It is my Mac", "I bought it used", "It belongs to work or school"],
    };
  }
  if (/it asks for an apple account|apple account password/.test(latestText)) {
    return {
      message: "Do not share your password or verification code here. If the account is yours, use Apple's official recovery page: https://iforgot.apple.com. Is the account yours?",
      choices: ["Yes, it is my account", "No, it belongs to someone else", "I'm not sure"],
    };
  }
  if (/mac login password|my mac login password/.test(latestText)) {
    return {
      message: "That is the password used to sign in to the Mac, not Activation Lock. Do not erase the Mac yet if you need files that are not backed up. Do you see a password hint or a reset option on the sign-in screen?",
      choices: ["I see a password hint", "I see a reset option", "Neither"],
    };
  }
  if (/managed by work|managed by school|organization/.test(latestText)) {
    return {
      message: "A work or school administrator controls that Mac. Contact the organization's IT team and ask them to release or help recover the device. Is this a device issued by your workplace or school?",
      choices: ["Work", "School", "Neither"],
    };
  }
  if (/i bought it used|used purchase/.test(latestText)) {
    return {
      message: "Ask the seller or previous owner to remove the Mac from their Apple Account in Find My. They can do this without giving you their password. Do not pay for an unofficial unlock service. Have you been able to contact the seller?",
      choices: ["Yes, I can contact them", "No, I cannot reach them"],
    };
  }
  if (/it is my mac|it is my device|yes, it is my account/.test(latestText)) {
    return {
      message: "Use Apple's official account recovery page at https://iforgot.apple.com. Follow the steps there, and do not share any password or verification code here. Are you able to open that page?",
      choices: ["Yes", "No"],
    };
  }
  if (/no, it belongs to someone else|i cannot reach them/.test(latestText)) {
    return {
      message: "The previous owner or the organization that manages the Mac must release it. If you bought it from a seller who cannot help, contact the seller or retailer about a return. I cannot bypass Activation Lock.",
      choices: ["I can contact the seller", "I need another option"],
    };
  }
  if (/yes, it is moving/.test(latestText)) {
    return {
      message: "Good. Keep the Mac connected to power and let the progress bar finish. Do not force it to shut down while it is moving. Tell me if the screen changes or the bar stops.",
      choices: ["It finished", "It stopped moving", "The screen changed"],
    };
  }
  if (/it stopped moving/.test(latestText)) {
    return {
      message: "Keep the Mac connected to power. Has the progress bar stayed in exactly the same place for at least 30 minutes?",
      choices: ["Yes, 30 minutes or more", "No, less than 30 minutes"],
    };
  }
  if (/yes, 30 minutes or more/.test(latestText)) {
    return {
      message: "Thanks. The Mac may be stuck. The next safe check is to see whether it responds before we consider any restart. Is the Mac still making sounds or showing any change on the screen?",
      choices: ["Yes, something is changing", "No, nothing is changing"],
    };
  }
  if (/no, less than 30 minutes/.test(latestText)) {
    return {
      message: "Keep it connected to power a little longer and give the progress bar time to move. Has anything changed since you last checked?",
      choices: ["Yes, it moved", "No, it looks the same"],
    };
  }
  if (/it finished/.test(latestText)) {
    return {
      message: "Great. What do you see now?",
      choices: ["The sign-in screen", "The desktop", "A different message"],
    };
  }
  if (/the screen changed/.test(latestText)) {
    return {
      message: "What do you see on the screen now?",
      choices: ["The sign-in screen", "The desktop", "A different message"],
    };
  }
  if (/no, nothing is changing|no, it looks the same/.test(latestText)) {
    return {
      message: "Thank you. Before we try anything that could affect your files, I need to know whether your important files are backed up. Do you have a recent backup?",
      choices: ["Yes, I have a backup", "No, I need my files", "I'm not sure"],
    };
  }
  if (/yes, something is changing|yes, it moved/.test(latestText)) {
    return {
      message: "Good. Leave the Mac connected to power and allow it to continue. Tell me if the progress bar stops again.",
      choices: ["It is still moving", "It stopped moving"],
    };
  }
  if (/no, it has not moved|only see the apple logo/.test(latestText)) {
    return {
      message: "Leave the Mac connected to power for now. Has it stayed on the same screen for at least 30 minutes?",
      choices: ["Yes, 30 minutes or more", "No, less than 30 minutes"],
    };
  }
  if (/account lock|apple account|find my|previous owner/.test(text)) {
    return {
      message: "I can help identify the right official recovery route. What does the Mac ask you for?",
      choices: ["It says Activation Lock", "It asks for an Apple Account", "It asks for my Mac login password", "It says the Mac is managed by work or school"],
    };
  }
  if (/apple logo|progress bar/.test(latestText) && /mac|macbook|imac|mac mini|mac studio|mac pro/.test(text)) {
    return {
      message: "Keep the Mac connected to power. If the progress bar is moving, leave it alone and let it finish. Is the progress bar moving?",
      choices: ["Yes, it is moving", "No, it has not moved for a while", "I only see the Apple logo"],
    };
  }
  if (/erase|restore|factory reset|reset.*mac|reset.*iphone/.test(text)) {
    return {
      message: "Before any restore or erase, please check whether your important photos, files, and other data are backed up. A restore can permanently erase information. I will not start an erase from this website. Do you have a recent backup?",
      choices: ["Yes, I have a backup", "No, I need to save my data", "I'm not sure"],
    };
  }
  if (/usb|connect|plug|computer.*see|not detect|not recognized/.test(text)) {
    return {
      message: "Let's check the connection safely. Connect the device directly to the computer with a cable that supports data. What do you see on the device screen?",
      choices: ["Apple logo", "A cable or computer picture", "A normal home or lock screen", "The screen is black"],
    };
  }
  if (/iphone|ipad/.test(text)) {
    return {
      message: "Keep the iPhone or iPad connected to a charger if its battery may be low. Do not erase or restore it yet if you need data that is not backed up. What is happening on its screen?",
      choices: ["It will not turn on", "Apple logo stays on screen", "It shows a cable/computer picture", "It starts but has another problem"],
    };
  }
  if (/mac|macbook|imac|mac mini|mac studio|mac pro/.test(text)) {
    return {
      message: "Keep the Mac connected to power. What do you see when you turn it on?",
      choices: ["Apple logo or progress bar", "A question-mark folder", "A login screen", "A recovery or utility screen", "Nothing appears"],
    };
  }
  if (/backup|data|photo|file|recover/.test(text)) {
    return {
      message: "Let's protect your data first. Avoid erasing or restoring anything for now. Do you have a recent backup of the information you need?",
      choices: ["Yes", "No", "I'm not sure"],
    };
  }
  return {
    message: "The built-in guide is helping while the AI service is unavailable. Tell me what you can see, and I will give you one simple next step.",
    choices: ["Help me connect my device", "My device will not start", "I want to prepare for a restore", "I need help with an account lock"],
  };
}

export default function Guide() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I’m your recovery guide. You do not need to know technical terms or model numbers. Tell me what you are trying to do, or choose a starting point below. I’ll walk you through one simple step at a time.',
      choices: STARTERS.map((item) => item.label),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const suggestions = useMemo(() => {
    const latest = [...messages].reverse().find((item) => item.role === 'assistant');
    return latest?.choices || [];
  }, [messages]);

  const askGuide = async (rawText) => {
    const text = rawText.trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    const nextMessages = [...messages, { role: 'user', text }];
    setMessages([...nextMessages, { role: 'assistant', text: '', loading: true }]);
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        // Pin a supported model so this guide does not depend on an unset app-level default.
        model: 'gemini_3_8_flash',
        prompt: makePrompt(messages, text),
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'The next plain-language guidance message. Ask at most one question.' },
            choices: { type: 'array', items: { type: 'string' }, description: 'Zero to four short response choices the customer can tap.' },
          },
          required: ['message', 'choices'],
        },
      });
      const answer = normalizeAnswer(result);
      setMessages([...nextMessages, { role: 'assistant', text: answer.message, choices: answer.choices }]);
    } catch (err) {
      // Log only diagnostic metadata; never log the customer's message or full prompt.
      console.error('Recovery Guide AI request failed', {
        status: err?.status || err?.response?.status || null,
        code: err?.code || err?.response?.data?.code || null,
        message: String(err?.message || 'Unknown AI integration error').slice(0, 240),
      });
      const fallback = makeFallbackReply(text, messages);
      setMessages([...nextMessages, { role: 'assistant', text: fallback.message, choices: fallback.choices }]);
      setError('AI is temporarily unavailable. The built-in guide is continuing with safe, step-by-step help.');
    } finally {
      setLoading(false);
    }
  };

  const resetGuide = () => {
    setMessages([{
      role: 'assistant',
      text: 'Let’s start fresh. You do not need technical details. What would you like help with today?',
      choices: STARTERS.map((item) => item.label),
    }]);
    setInput('');
    setError('');
  };

  const chooseStarter = (label) => {
    const starter = STARTERS.find((item) => item.label === label);
    askGuide(starter?.prompt || label);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 lattice opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">AI step-by-step assistance</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Plain language · One step at a time</p>
            </div>
          </div>
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
            You do not need to be technical.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell the guide what you want to do or what you see. It will explain the next action in everyday language, help you understand choices, and warn you before anything that could erase data.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-medium">Recovery Guide</h2>
                <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Your personal walkthrough</p>
              </div>
            </div>
            <button type="button" onClick={resetGuide} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">
              <RotateCcw className="h-3 w-3" /> Start over
            </button>
          </div>

          <div className="min-h-[360px] space-y-4 p-4 sm:p-6" aria-live="polite">
            {messages.map((item, index) => (
              <div key={index} className={item.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={item.role === 'user' ? 'max-w-[88%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground' : 'max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground'}>
                  {item.loading ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking through the next step…</span>
                  ) : (
                    <p className="whitespace-pre-wrap">{item.text}</p>
                  )}
                  {item.role === 'assistant' && item.choices?.length > 0 && !item.loading && !loading && index === messages.length - 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.choices.map((choice) => (
                        <button key={choice} type="button" onClick={() => chooseStarter(choice)} className="rounded-full border border-primary/30 px-3 py-2 text-xs text-primary transition-colors hover:bg-primary/10">
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {error && <p role="status" className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{error}</p>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); askGuide(input); }} className="border-t border-border bg-background/70 p-4 sm:p-5">
            <label htmlFor="guide-message" className="mb-2 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Tell the guide what is happening</label>
            <div className="flex items-end gap-2">
              <textarea
                id="guide-message"
                rows={2}
                maxLength={1200}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="For example: My iPhone is showing the Apple logo and will not start."
                className="min-h-[52px] flex-1 resize-y rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
              <button type="submit" disabled={loading || !input.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Do not share passwords, verification codes, recovery keys, or payment details.</p>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Designed for beginners</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> No command line or scripts</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> No need to know device specifications</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> One simple action at a time</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Clear warnings before data-erasing steps</li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Usb className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Device connection</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              This guide runs in your browser and cannot directly inspect USB devices. The downloadable desktop companion with automatic device detection still needs to be built and released. The guide will not pretend your device is connected or detected.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Owner-controlled recovery</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              You stay in control of your device. The guide supports legitimate, owner-authorized recovery. It cannot remove or bypass Activation Lock, account security, passcodes, or organization controls.
            </p>
          </div>

          <Link to="/pricing" className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/[0.06] px-5 py-4 text-sm text-foreground transition-colors hover:bg-primary/10">
            View service pricing <ArrowRight className="h-4 w-4 text-primary" />
          </Link>
          <Link to="/" className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-sm text-foreground transition-colors hover:border-primary/30">
            Back to home <CircleHelp className="h-4 w-4 text-muted-foreground" />
          </Link>
        </aside>
      </section>
    </div>
  );
}
