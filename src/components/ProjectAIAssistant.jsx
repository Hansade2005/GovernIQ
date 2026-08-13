import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, X } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { getPortfolioSummary, formatFcfa } from '@/lib/registry'
import { generate } from '@/lib/ai'


export function ProjectAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [projectData, setProjectData] = useState([])
  const messagesEndRef = useRef(null)
  const panelRef = useRef(null)

  const close = useCallback(() => setIsOpen(false), [])

  // Escape closes the panel from anywhere, including while typing.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // The assistant answers from the registry, so its figures always match
  // what a member sees on the Programmes page.
  useEffect(() => {
    let alive = true
    getPortfolioSummary()
      .then((s) => { if (alive) setProjectData(s.projects) })
      .catch((err) => console.warn('[assistant] could not load programmes:', err.message))
    return () => { alive = false }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Ground the model in the programme roll.
   *
   * The digest is built from the rows already in state, so the assistant
   * and the Programmes page can never quote different figures.
   */
  const buildGrounding = () => {
    const rows = projectData
    const money = (v) => formatFcfa(v)
    const budget = rows.reduce((s, p) => s + Number(p.budget_fcfa || 0), 0)
    const spent = rows.reduce((s, p) => s + Number(p.spent_fcfa || 0), 0)

    const lines = [
      `Programmes on the roll: ${rows.length}.`,
      `Completed: ${rows.filter((p) => p.status === 'completed').length}. ` +
        `In session: ${rows.filter((p) => p.status === 'ongoing').length}.`,
      `Total committed: ${money(budget)}. Disbursed: ${money(spent)}.`,
      '',
      'Programme roll (name | division | contractor | category | status | progress | budget | spent | risk):',
      ...rows.map((p) =>
        `- ${p.name} | ${p.division} | ${p.contractor} | ${p.category} | ` +
        `${p.status} | ${p.progress}% | ${money(p.budget_fcfa)} | ${money(p.spent_fcfa)} | ` +
        `${p.risks || 'none noted'}`
      ),
    ]
    return lines.join('\n')
  }

  const SYSTEM = [
    'You advise members of the North West Regional Assembly of Cameroon on',
    'its programme portfolio. You are in conversation with a member.',
    '',
    'How to talk:',
    '- Greetings and small talk get a short, human reply and an offer of a',
    '  useful next step. Never tell a member their greeting is missing from',
    '  the roll.',
    '- Questions about what you can see or what to ask, answer directly.',
    '- Only questions of fact about programmes need to rest on the roll.',
    '',
    'Grounding, for questions of fact:',
    '- Take programme names, contractors, divisions, figures, and dates from',
    '  the roll below, and quote money exactly, with units.',
    '- If the roll is silent, say so. Never invent a programme or a figure.',
    '- General knowledge you may answer normally; the roll constrains facts',
    '  about this portfolio, not your ability to explain a concept.',
    '',
    'Style: brief, answer first, markdown tables only when comparing several',
    'programmes. Plain British English, no preamble, no pleasantries.',
  ].join('\n')

  const generateAIResponse = async (userQuery) => {
    if (!projectData.length) {
      return 'The programme roll has not loaded yet. Give it a moment and ask again.'
    }
    return generate({
      system: `${SYSTEM}\n\n# Programme roll\n\n${buildGrounding()}`,
      messages: [{ role: 'user', content: userQuery }],
      maxTokens: 700,
    })
  }

  const sendQuery = async (query) => {
    const userMessage = query.trim()
    if (!userMessage) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      const response = await generateAIResponse(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Error generating response:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**I could not answer that.** ${error.message || 'The assistant could not be reached.'}`,
        failed: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    sendQuery(input)
  }

  const quickQuestions = [
    'Portfolio overview',
    'Completed projects',
    'At-risk projects',
    'Contractor performance',
    'Budget report',
    'Education projects'
  ]

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open the project assistant"
          className="fixed bottom-6 right-6 h-12 pl-4 pr-5 rounded-full bg-[color:var(--highland)] text-white shadow-[0_12px_28px_-12px_rgba(20,21,15,0.55)] hover:bg-[color:var(--highland-2)] transition flex items-center gap-2 z-40"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Ask the assistant</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <>
          {/* Click-away layer — closing should never require hunting for a control */}
          <div
            className="fixed inset-0 z-40 bg-[color:var(--ink)]/10"
            onClick={close}
            aria-hidden
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="Project assistant"
            className="fixed bottom-6 right-6 w-[min(26rem,calc(100vw-3rem))] h-[min(38rem,calc(100vh-6rem))] bg-[color:var(--card-bg)] border border-[color:var(--rule-firm)] rounded-[6px] shadow-[0_28px_64px_-24px_rgba(20,21,15,0.5)] flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 h-12 border-b border-[color:var(--rule)] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rotate-45 bg-[color:var(--kola)] flex-shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-semibold leading-none truncate">Project assistant</p>
                  <p className="eyebrow text-[0.5rem] mt-1">{projectData.length} programmes loaded</p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="btn btn-ghost text-[0.7rem] px-2 py-1"
                    title="Clear the conversation"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={close}
                  aria-label="Close the assistant"
                  title="Close (Esc)"
                  className="w-8 h-8 flex items-center justify-center rounded-[3px] border border-[color:var(--rule-firm)] text-[color:var(--sepia)] hover:text-[color:var(--paper)] hover:bg-[color:var(--rust)] hover:border-[color:var(--rust)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center">
                  <p className="eyebrow mb-1">Project intelligence</p>
                  <p className="text-[color:var(--sepia)] mb-5 leading-relaxed">
                    Ask about the portfolio — execution, risk, contractors, or budget.
                  </p>
                  <div className="space-y-1.5">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendQuery(q)}
                        className="w-full px-3 py-2 text-[0.8125rem] text-left rounded-[3px] border border-[color:var(--rule)] text-[color:var(--ink)] hover:border-[color:var(--ink)] hover:bg-[color:var(--linen)] transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) =>
                    msg.role === 'user' ? (
                      /* Member — filled bubble, inverts with the theme */
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[85%] px-3.5 py-2.5 rounded-[10px] rounded-br-[3px] bg-[color:var(--highland)] text-white dark:text-[color:var(--paper)]">
                          <p className="text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Assistant — no bubble; the reply sits on the panel itself */
                      <div key={idx} className="flex justify-start">
                        <div className="max-w-full w-full">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-1.5 h-1.5 rotate-45 bg-[color:var(--kola)]" aria-hidden />
                            <span className="eyebrow text-[0.5rem]">Assistant</span>
                          </div>
                          <MarkdownMessage
                            content={msg.content}
                            className="text-[0.8125rem] text-[color:var(--ink)]"
                          />
                        </div>
                      </div>
                    )
                  )}

                  {isLoading && (
                    <div className="flex items-center gap-1.5">
                      <span className="eyebrow text-[0.5rem]">Assistant</span>
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
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-[color:var(--rule)] p-3 flex-shrink-0"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the portfolio…"
                  disabled={isLoading}
                  className="field flex-1 text-[0.8125rem]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send"
                  className="btn btn-primary px-3"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="eyebrow text-[0.5rem] mt-2">Esc to close</p>
            </form>
          </div>
        </>
      )}
    </>
  )
}
