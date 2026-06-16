import { useEffect, useRef, useState } from 'react'
import { makeBotReply, WHATSAPP_SPECIALIST_HREF } from '../lib/chatbotReplies'
import type { FeaturedRates } from '../lib/fx'

type Msg = { role: 'bot' | 'user'; text: string; talkToSpecialist?: boolean }

export function Chatbot(props: { rates: FeaturedRates | null; ratesSourceLine?: string | null }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      role: 'bot',
      text: `Hello 👋 I'm Lloyd, your virtual assistant.
I can help you check live exchange rates, guide your transactions, or connect you with our team. How can I assist you today?`,
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)
  const canSend = draft.trim().length > 0

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, msgs.length])

  function send() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const reply = makeBotReply(text, props.rates, props.ratesSourceLine)
    setMsgs((m) => [
      ...m,
      { role: 'user', text },
      { role: 'bot', text: reply.text, talkToSpecialist: reply.talkToSpecialist },
    ])
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open ? (
        <div
          className="flex h-[min(520px,calc(100dvh-120px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
          role="dialog"
          aria-label="Lloyd - Virtual Assistant"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div>
              <div className="text-sm font-bold text-[var(--text-heading)]">Lloyd - Virtual Assistant</div>
            </div>
            <button
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-heading)] transition hover:bg-[var(--surface-hover)]"
              type="button"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4" ref={listRef}>
            <div className="flex flex-col gap-3">
              {msgs.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--text-heading)]'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.role === 'bot' && m.talkToSpecialist ? (
                      <a
                        href={WHATSAPP_SPECIALIST_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366]/10 px-3 py-2.5 text-sm font-bold text-[#128C7E] transition hover:bg-[#25D366]/20"
                      >
                        <WhatsAppMark className="h-5 w-5 shrink-0" aria-hidden />
                        Talk to a specialist
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)] p-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              value={draft}
              placeholder="Ask from this site’s content…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <button
              className="shrink-0 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={!canSend}
              onClick={send}
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border-2 border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-bold text-[var(--accent)] shadow-[0_8px_32px_rgba(15,23,42,0.28)] ring-4 ring-[var(--surface)] ring-offset-0 transition hover:bg-[var(--surface-hover)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]/35"
      >
        {open ? 'Close' : 'Chat'}
      </button>
    </div>
  )
}

function WhatsAppMark(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.123 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
