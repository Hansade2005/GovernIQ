import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, Send, X } from 'lucide-react'
import { MarkdownMessage } from './MarkdownMessage'
import { getPortfolioSummary, formatFcfa } from '@/lib/registry'


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
   * Answers are composed from the registry rows already in state, so every
   * figure the assistant quotes can be checked against the Programmes page.
   */
  const generateAIResponse = async (userQuery) => {
    const q = userQuery.toLowerCase()
    const rows = projectData
    if (!rows.length) {
      return 'The programme roll has not loaded yet. Give it a moment and ask again.'
    }

    const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
    const completed = rows.filter((p) => p.status === 'completed')
    const ongoing = rows.filter((p) => p.status === 'ongoing')
    const budget = rows.reduce((s, p) => s + Number(p.budget_fcfa || 0), 0)
    const spent = rows.reduce((s, p) => s + Number(p.spent_fcfa || 0), 0)
    const avgProgress = Math.round(rows.reduce((s, p) => s + (p.progress || 0), 0) / rows.length)

    const groupBy = (key) => {
      const out = {}
      for (const p of rows) {
        const k = p[key] || 'Unassigned'
        out[k] ??= { count: 0, completed: 0, progress: 0, budget: 0 }
        out[k].count += 1
        out[k].progress += p.progress || 0
        out[k].budget += Number(p.budget_fcfa || 0)
        if (p.status === 'completed') out[k].completed += 1
      }
      return out
    }

    if (q.includes('overview') || q.includes('summary') || q.includes('portfolio')) {
      return `## Portfolio overview

| Measure | Figure |
|---|---|
| Programmes on the roll | ${rows.length} |
| Completed | ${completed.length} |
| In session | ${ongoing.length} |
| Average progress | ${avgProgress}% |
| Total budget | ${formatFcfa(budget)} |
| Disbursed | ${formatFcfa(spent)} (${pct(spent, budget)}%) |

**Contractors engaged:** ${new Set(rows.map((p) => p.contractor)).size}
**Divisions covered:** ${new Set(rows.map((p) => p.division)).size}`
    }

    if (q.includes('completed') || q.includes('finish') || q.includes('delivered')) {
      return `## Completed programmes (${completed.length})

${completed.map((p) => `- **${p.name}** — ${p.contractor}, ${p.division} Division. ${formatFcfa(p.budget_fcfa)}.`).join('\n')}

Delivered across ${new Set(completed.map((p) => p.division)).size} divisions.`
    }

    if (q.includes('risk') || q.includes('challenge') || q.includes('delay') || q.includes('behind')) {
      const atRisk = ongoing.filter((p) => (p.progress || 0) < 50)
      if (!atRisk.length) {
        return `## Risk assessment\n\nNo programme currently sits below 50% while in session. The lowest is **${
          ongoing.sort((a, b) => a.progress - b.progress)[0]?.name
        }** at ${ongoing.sort((a, b) => a.progress - b.progress)[0]?.progress}%.`
      }
      return `## Programmes at risk (${atRisk.length})

${atRisk.map((p) => `- **${p.name}** — ${p.progress}%, ${p.contractor} (${p.division}). ${p.risks || 'No risk noted.'}`).join('\n')}

**Recommended:** raise contractor support on the lowest two, and confirm whether a schedule extension is warranted before the next sitting.`
    }

    if (q.includes('contractor') || q.includes('performance')) {
      const byContractor = groupBy('contractor')
      return `## Contractor performance

| Contractor | Programmes | Completed | Avg. progress |
|---|---|---|---|
${Object.entries(byContractor)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([n, d]) => `| ${n} | ${d.count} | ${d.completed} | ${Math.round(d.progress / d.count)}% |`)
  .join('\n')}`
    }

    if (q.includes('budget') || q.includes('financial') || q.includes('cost') || q.includes('treasury')) {
      const byCat = groupBy('category')
      return `## Financial position

**Total budget:** ${formatFcfa(budget)}
**Disbursed:** ${formatFcfa(spent)} — ${pct(spent, budget)}% utilisation
**Uncommitted:** ${formatFcfa(budget - spent)}

### By category

| Category | Programmes | Budget |
|---|---|---|
${Object.entries(byCat)
  .sort((a, b) => b[1].budget - a[1].budget)
  .map(([n, d]) => `| ${n} | ${d.count} | ${formatFcfa(d.budget)} |`)
  .join('\n')}`
    }

    if (q.includes('division') || q.includes('progress') || q.includes('status')) {
      const byDivision = groupBy('division')
      return `## Progress by division

| Division | Programmes | Completed | Avg. progress |
|---|---|---|---|
${Object.entries(byDivision)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([n, d]) => `| ${n} | ${d.count} | ${d.completed} | ${Math.round(d.progress / d.count)}% |`)
  .join('\n')}

**Portfolio average:** ${avgProgress}%`
    }

    if (q.includes('education') || q.includes('school') || q.includes('classroom')) {
      const edu = rows.filter((p) => p.category === 'Education')
      return `## Education programmes (${edu.length})

${edu.map((p) => `- **${p.name}** — ${p.progress}%, ${p.division}. ${formatFcfa(p.budget_fcfa)}.`).join('\n')}

Total commitment: ${formatFcfa(edu.reduce((s, p) => s + Number(p.budget_fcfa || 0), 0))}.`
    }

    if (q.includes('health') || q.includes('hospital') || q.includes('clinic')) {
      const health = rows.filter((p) => p.category === 'Health')
      return `## Health programmes (${health.length})

${health.map((p) => `- **${p.name}** — ${p.progress}%, ${p.division}. ${formatFcfa(p.budget_fcfa)}.`).join('\n')}

Total commitment: ${formatFcfa(health.reduce((s, p) => s + Number(p.budget_fcfa || 0), 0))}.`
    }

    return `I can answer from the programme roll — ${rows.length} programmes across ${
      new Set(rows.map((p) => p.division)).size
    } divisions. Try:

- **Portfolio overview** — the headline position
- **At-risk programmes** — anything below half-way while in session
- **Contractor performance** — programmes and progress by firm
- **Budget report** — commitment, disbursement, and utilisation
- **Progress by division** — where the work stands
- **Education** or **health programmes** — by sector`
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
        content: 'That query could not be answered. Rephrase it, or ask for a portfolio overview to start.',
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
