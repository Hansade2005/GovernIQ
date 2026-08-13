import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RefreshCw, Database, AlertCircle, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { buildRegistryContext } from '@/lib/registry'
import { generate, AIUnavailable } from '@/lib/ai'

/**
 * Ask the Assembly — a chamber-wide assistant.
 *
 * Unlike the programme assistant, this answers across the whole registry:
 * divisions, programmes, the treasury, sittings, reports, and open alerts.
 * The grounding digest is rebuilt from the database each time the page
 * loads, so the assistant speaks from the tables rather than from anything
 * baked into its prompt — and it is told to say when the record is silent
 * rather than fill a gap.
 */

const SUGGESTIONS = [
  'What is the state of the region today?',
  'Which programmes are behind schedule, and why?',
  'How is the FY 2026 budget divided?',
  'Compare execution across the seven divisions.',
  'Which contractor carries the most work?',
  'What was decided at the last sitting?',
]

const SYSTEM_RULES = `
You are the assistant to the North West Regional Assembly of Cameroon. You
are talking with a member. Hold a normal conversation.

How to talk:
- Greetings, thanks, and small talk get a short, warm, human reply. Answer
  them directly, then offer a useful next step. Never tell a member their
  greeting is absent from the record — that is not what the record is for.
- Questions about how you work, what you can see, or what to ask next:
  answer from your own knowledge of this platform.
- Only questions of fact about the Assembly need to rest on the record.

Grounding, for questions of fact:
- Take figures, names, dates, programmes, and divisions from the briefing
  record below. Quote them exactly, with units (FCFA).
- If the record is silent on a factual question, say so plainly and name
  what would settle it. Never invent a figure or a programme.
- General knowledge — how a budget works, what a contractor does — you may
  answer normally. The record constrains facts about this Assembly, not
  your ability to explain the world.

Style:
- Concise and direct. Lead with the answer, then the supporting detail.
- Markdown: short paragraphs, bullets, and tables when comparing divisions,
  contractors, or programmes. Do not put a one-line answer in a table.
- Plain British English. Address the reader as a colleague. No preamble,
  no flattery, no closing pleasantries.
`.trim()

export function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [context, setContext] = useState(null)
  const [contextError, setContextError] = useState('')
  const [loadingContext, setLoadingContext] = useState(true)

  const endRef = useRef(null)
  const inputRef = useRef(null)

  const loadContext = useCallback(async () => {
    setLoadingContext(true)
    try {
      const ctx = await buildRegistryContext()
      setContext(ctx)
      setContextError('')
    } catch (err) {
      console.error('Could not ground the assistant:', err)
      setContextError(err.message || 'The registry could not be read.')
    } finally {
      setLoadingContext(false)
    }
  }, [])

  useEffect(() => { loadContext() }, [loadContext])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const ask = async (question) => {
    const q = question.trim()
    if (!q || sending) return

    setInput('')
    const history = [...messages, { role: 'user', content: q }]
    setMessages(history)
    setSending(true)

    try {
      if (!context) throw new Error('The registry has not loaded yet. Try again in a moment.')

      const text = await generate({
        system: `${SYSTEM_RULES}\n\n# Briefing record\n\n${context.text}`,
        // Keep a short rolling window so follow-up questions stay coherent
        // without the prompt growing without bound.
        messages: history.slice(-6),
        maxTokens: 900,
      })

      setMessages((prev) => [...prev, { role: 'assistant', content: text }])
    } catch (err) {
      console.error('Assistant failed:', err)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `**I could not answer that.** ${err.message}\n\nThe registry pages remain available in the meantime.`,
        failed: true,
      }])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const counts = context?.counts

  return (
    <div className="stagger flex flex-col min-h-[calc(100vh-12rem)] pb-28">
      <PageHeader
        eyebrow="Chamber"
        title="Ask the Assembly"
        description="Questions about programmes, divisions, the treasury, sittings, and reports — answered from the registry."
        actions={
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="btn btn-ghost" title="Clear the conversation">
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={loadContext}
              disabled={loadingContext}
              className="btn btn-outline"
              title="Reload the registry"
            >
              <RefreshCw size={13} className={loadingContext ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      {/* Grounding status — the reader should always know what the answers rest on */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 rounded-[4px] border border-[color:var(--rule)] bg-[color:var(--card-bg)]">
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <Database size={13} className="text-[color:var(--sepia)]" />
          <span className="eyebrow text-[0.55rem]">
            {loadingContext ? 'Reading the registry' : contextError ? 'Registry unavailable' : 'Grounded in'}
          </span>
        </span>
        {counts && !contextError && (
          <span className="mono text-[0.7rem] text-[color:var(--sepia)]">
            {counts.programmes} programmes · {counts.divisions} divisions ·{' '}
            {counts.sittings} sittings · {counts.reports} reports
            {counts.alerts > 0 && ` · ${counts.alerts} open alerts`}
          </span>
        )}
        {contextError && (
          <span className="text-[0.75rem] text-[color:var(--rust)]">{contextError}</span>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Where to begin</p>
            <p className="text-[color:var(--sepia)] leading-relaxed mb-5">
              Every answer is drawn from the Assembly's own records. If the
              register is silent on something, the assistant will say so
              rather than guess.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  disabled={loadingContext || !!contextError}
                  className="text-left px-3.5 py-3 rounded-[4px] border border-[color:var(--rule)] text-[0.8125rem] text-[color:var(--ink)] hover:border-[color:var(--ink)] hover:bg-[color:var(--linen)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-[12px] rounded-br-[3px] bg-[color:var(--highland)] text-white dark:text-[color:var(--paper)]">
                    <p className="text-[0.875rem] leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={i} className="max-w-full">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className={`w-1.5 h-1.5 rotate-45 ${m.failed ? 'bg-[color:var(--rust)]' : 'bg-[color:var(--kola)]'}`}
                      aria-hidden
                    />
                    <span className="eyebrow text-[0.5rem]">Assistant</span>
                  </div>
                  <MarkdownMessage content={m.content} className="text-[0.875rem] max-w-3xl" />
                </div>
              )
            )}

            {sending && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rotate-45 bg-[color:var(--kola)]" aria-hidden />
                  <span className="eyebrow text-[0.5rem]">Assistant</span>
                </div>
                <span className="flex gap-1">
                  {[0, 0.15, 0.3].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-[color:var(--sepia)] animate-bounce"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Composer — docked to the bottom of the viewport, clear of the
          sidebar rail on desktop (see .composer-dock in index.css). */}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input) }}
        className="composer-dock px-4 sm:px-6 lg:px-9 pt-3 pb-3"
      >
        <div className="max-w-[1500px] mx-auto">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={contextError ? 'The registry is unavailable' : 'Ask about the Assembly…'}
              disabled={sending || loadingContext || !!contextError}
              className="field flex-1"
              aria-label="Your question"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || loadingContext || !!contextError}
              className="btn btn-primary px-4"
              aria-label="Send"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>
          <p className="eyebrow text-[0.5rem] mt-2 flex items-start gap-1.5">
            <AlertCircle size={10} className="flex-shrink-0 mt-px" />
            <span>Answers come from the registry. Check figures against the record before quoting them on the floor.</span>
          </p>
        </div>
      </form>
    </div>
  )
}
