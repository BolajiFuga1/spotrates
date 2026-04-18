import { useEffect, useMemo, useRef, useState } from 'react'
import { makeBotReply } from '../lib/chatbotReplies'
import type { FeaturedRates } from '../lib/fx'

type Msg = { role: 'bot' | 'user'; text: string }

function nowTime() {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

export function Chatbot(props: { rates: FeaturedRates | null; ratesSourceLine?: string | null }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    {
      role: 'bot',
      text: `Hi! I'm your E-lloydsFX assistant (${nowTime()}). Try “help”, “USD to naira”, or “PTA”.`,
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)
  const canSend = draft.trim().length > 0

  const hint = useMemo(
    () => (props.rates ? 'Try: “What is USD to NGN?”' : 'Loading rates…'),
    [props.rates],
  )

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
    // Single state update so user + bot messages always stay in sync (avoids lost replies under fast input).
    setMsgs((m) => [...m, { role: 'user', text }, { role: 'bot', text: reply }])
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div
          className="flex h-[min(520px,calc(100dvh-120px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
          role="dialog"
          aria-label="Chatbot"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div>
              <div className="text-sm font-bold text-[var(--text-heading)]">FX assistant</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>
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
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--text-heading)]'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)] p-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              value={draft}
              placeholder="Ask about rates…"
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
        className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-muted)] px-5 py-3 text-sm font-bold text-[var(--accent)] shadow-[var(--shadow-lg)] transition hover:brightness-110"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Close' : 'Chat'}
      </button>
    </div>
  )
}
