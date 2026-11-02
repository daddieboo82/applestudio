import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';

const FAQS = [
  {
    q: 'Do I need technical knowledge?',
    a: 'No. The AI guide explains one step at a time in everyday language. You do not need to know model numbers, firmware versions, command-line tools, or specialist terms. The future desktop companion is intended to identify supported connected devices automatically.',
  },
  {
    q: 'Can the website detect my device when I plug it in?',
    a: 'Not yet. A normal browser page cannot directly inspect USB hardware. The Windows and macOS desktop companion that will perform automatic device detection is still being developed. We will not claim a device is connected until the companion can actually confirm it.',
  },
  {
    q: 'Which Apple devices are in the catalog?',
    a: 'The catalog includes iPhone and iPad, MacBook Air, MacBook Pro, iMac, Mac mini, Mac Studio, Mac Pro, Apple Watch, Apple TV, AirPods, HomePod, and Apple Vision Pro. The exact repair, recovery, or diagnostic options depend on what the desktop companion can verify. Automatic device detection and the full companion app are still in development.',
  },
  {
    q: 'Does my device leave my home?',
    a: 'No mail-in service is planned. The intended workflow is at-home self-service: you use your own computer, connect your own device, and remain in control throughout the supported process.',
  },
  {
    q: 'Will the AI do everything for me?',
    a: 'The AI explains the process, helps choose supported options, answers questions, and adapts when your screen looks different. You remain in control and must approve any action that changes or erases device data.',
  },
  {
    q: 'Will a restore erase my data?',
    a: 'A restore or factory erase can permanently delete data. The guide must first explain the risk and help you check whether you have a backup. It will never claim to erase a device or start a destructive operation without your explicit action.',
  },
  {
    q: 'Do you remove Activation Lock or bypass passcodes?',
    a: 'No. We support legitimate owner-authorized recovery and official restore processes, not bypassing Activation Lock, Find My, Apple Account authentication, screen passcodes, or organizational management controls. Owners should use Apple account recovery or contact the organization that manages the device.',
  },
  {
    q: 'How does pay-per-device pricing work?',
    a: 'You see the proposed price before choosing a service. There is no customer credit balance or subscription in the proposed model. The payment flow must show the final service and price clearly before a charge is made.',
  },
  {
    q: 'What if I get stuck?',
    a: 'Tell the AI guide what you see in ordinary language. It will ask one simple question at a time. Do not share passwords, verification codes, recovery keys, or payment details.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="border-b border-border bg-card/30">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading index="06" eyebrow="Questions" title="Simple answers, without the jargon." />
          <Link to="/guide" className="mt-7 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary hover:opacity-80">
            <Sparkles className="h-3.5 w-3.5" /> Ask the AI guide
          </Link>
        </div>

        <div className="lg:col-span-8">
          <div className="divide-y divide-border border-y border-border">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-start justify-between gap-6 py-4 text-left"
                  >
                    <span className="font-heading text-sm font-medium leading-relaxed tracking-tight sm:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
