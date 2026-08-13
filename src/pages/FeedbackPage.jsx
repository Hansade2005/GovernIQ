import { useState, useCallback } from 'react'
import {
  MessageSquarePlus, Star, Check, Reply, Trash2, X, Send, Lock,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { Loading, LoadFailure, Empty } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { useSession } from '@/lib/SessionContext'
import { listProjects } from '@/lib/registry'
import {
  listFeedback, submitFeedback, acknowledgeFeedback,
  respondToFeedback, deleteFeedback, summarise,
  FEEDBACK_KINDS, FEEDBACK_STATUSES,
} from '@/lib/feedback'

const KIND_VARIANT = {
  observation: 'secondary',
  concern: 'destructive',
  commendation: 'success',
  request: 'accent',
}
const STATUS_VARIANT = {
  submitted: 'accent',
  acknowledged: 'secondary',
  addressed: 'success',
  declined: 'muted',
}

/** Read-only star row. Rating is optional, so absence is shown as a dash. */
function Stars({ value }) {
  if (!value) return <span className="text-[color:var(--sepia-soft)]">—</span>
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= value ? 'text-[color:var(--brass-ink)]' : 'text-[color:var(--rule)]'}
          fill={n <= value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  )
}

export function FeedbackPage() {
  const { allows, profile, role } = useSession()
  const mySubmit = allows('feedback.submit')
  const mayReadAll = allows('feedback.read')
  const mayRespond = allows('feedback.respond')
  const ownOnly = !mayReadAll && allows('feedback.read.own')

  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [filter, setFilter] = useState('All')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const { data, loading, error: loadError, refresh } = useQuery(async () => {
    const [rows, projects] = await Promise.all([
      listFeedback({
        status: filter,
        submittedBy: ownOnly ? (profile?.email || '__none__') : undefined,
      }),
      listProjects({ limit: 300 }),
    ])
    return { rows, projects }
  }, [filter, ownOnly, profile?.email])

  const rows = data?.rows ?? []
  const projects = data?.projects ?? []
  const stats = summarise(rows)
  const officer = profile?.full_name || profile?.email || 'Officer'

  const run = useCallback(async (fn, ...args) => {
    setBusy(true); setError('')
    try { await fn(...args); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [refresh])

  const startCompose = () => {
    setDraft({
      projectId: '', kind: 'observation', rating: 0,
      subject: '', body: '', isAnonymous: false,
    })
    setComposing(true); setError(''); setSent(false)
  }

  const send = async () => {
    const project = projects.find((p) => p.id === draft.projectId)
    setBusy(true); setError('')
    try {
      await submitFeedback({
        projectId: draft.projectId,
        projectName: project?.name,
        division: project?.division,
        kind: draft.kind,
        rating: draft.rating || null,
        subject: draft.subject,
        body: draft.body,
        submittedBy: draft.isAnonymous ? 'Anonymous' : (profile?.full_name || profile?.email),
        contact: draft.isAnonymous ? null : profile?.email,
        isAnonymous: draft.isAnonymous,
      })
      setComposing(false); setSent(true)
      await refresh()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const sendReply = async (id, decline) => {
    await run(respondToFeedback, id, { response: replyText, officer, decline })
    setReplyTo(null); setReplyText('')
  }

  if (loading && !data) return <Loading label="Opening the feedback register" />
  if (loadError && !data) return <LoadFailure error={loadError} onRetry={refresh} />

  const isCitizen = role === 'citizen'

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow={isCitizen ? 'Your voice' : 'Public feedback'}
        title={isCitizen ? 'Feedback on the works' : 'Feedback from the public'}
        description={isCitizen
          ? 'Tell the Assembly what you see at a site in your division — what is going well, and what is not.'
          : 'What residents report about the programmes, and what the Assembly has answered.'}
        actions={mySubmit && !composing && (
          <Button onClick={startCompose}>
            <MessageSquarePlus size={14} />
            <span className="hidden sm:inline">Give feedback</span>
          </Button>
        )}
      />

      {sent && (
        <div className="px-3 py-2.5 rounded-[4px] border border-[color:var(--sage)] text-[color:var(--sage)]">
          Your message has been sent. You will see it below, and its status will
          change once an officer has read it.
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-[4px] border border-[color:var(--rust)] text-[color:var(--rust)]">
          {error}
        </div>
      )}

      {/* Composer */}
      {composing && (
        <Card>
          <div className="panel-head">
            <div>
              <p className="eyebrow">New message</p>
              <h3 className="text-[1.0625rem] font-semibold mt-1">Write to the Assembly</h3>
            </div>
            <button onClick={() => setComposing(false)} className="btn btn-ghost" aria-label="Cancel">
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Which programme?</Label>
              <select
                className="field"
                value={draft.projectId}
                onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
              >
                <option value="">Choose a programme…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.division}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Kind of message</Label>
              <select
                className="field"
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
              >
                {Object.entries(FEEDBACK_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <p className="text-[0.7rem] text-[color:var(--sepia)] mt-1">
                {FEEDBACK_KINDS[draft.kind].hint}
              </p>
            </div>

            <div>
              <Label>How is the work going? (optional)</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} out of 5`}
                    onClick={() => setDraft({ ...draft, rating: draft.rating === n ? 0 : n })}
                    className="p-1 rounded-[2px] hover:bg-[color:var(--linen)]"
                  >
                    <Star
                      size={18}
                      className={n <= draft.rating ? 'text-[color:var(--brass-ink)]' : 'text-[color:var(--rule-firm)]'}
                      fill={n <= draft.rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                {draft.rating > 0 && (
                  <button
                    type="button"
                    className="eyebrow text-[0.5rem] ml-2 text-[color:var(--sepia)] hover:text-[color:var(--ink)]"
                    onClick={() => setDraft({ ...draft, rating: 0 })}
                  >
                    clear
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Subject</Label>
              <Input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                placeholder="Work has stopped on the workshop site"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Your message</Label>
              <textarea
                className="field min-h-[140px] leading-relaxed"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Describe what you have seen, and when. Be as specific as you can — it helps the officer find the answer."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.isAnonymous}
                  onChange={(e) => setDraft({ ...draft, isAnonymous: e.target.checked })}
                />
                <span>
                  <span className="font-medium text-[color:var(--ink)]">Send without my name</span>
                  <span className="block text-[0.7rem] text-[color:var(--sepia)] mt-0.5 leading-relaxed">
                    The Assembly will still act on the message, but it cannot write
                    back to you and you will not be able to follow its status here.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[color:var(--rule)]">
            <Button onClick={send} disabled={busy}>
              <Send size={13} /> {busy ? 'Sending…' : 'Send to the Assembly'}
            </Button>
            <Button variant="outline" onClick={() => setComposing(false)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Standing — officers only; a citizen sees their own record, not a scoreboard */}
      {mayReadAll && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Messages received', value: stats.total,        tone: 'figure-highland' },
            { label: 'Awaiting an officer', value: stats.awaiting,   tone: 'figure-kola' },
            { label: 'Concerns raised',   value: stats.concerns,     tone: 'figure-brass' },
            { label: 'Average standing',  value: stats.averageRating ?? '—', tone: 'figure-highland' },
          ].map((s) => (
            <Card key={s.label}>
              <p className="eyebrow text-[0.6rem]">{s.label}</p>
              <p className={`figure text-3xl mt-2 ${s.tone}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filter — officers only */}
      {mayReadAll && (
        <div className="flex flex-wrap gap-1.5">
          {['All', ...Object.keys(FEEDBACK_STATUSES)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-[3px] text-[0.8125rem] font-medium border transition ${
                filter === s
                  ? 'bg-[color:var(--highland)] text-white border-[color:var(--highland)]'
                  : 'border-[color:var(--rule)] text-[color:var(--sepia)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)]'
              }`}
            >
              {s === 'All' ? 'All' : FEEDBACK_STATUSES[s].label}
            </button>
          ))}
        </div>
      )}

      {ownOnly && rows.length > 0 && (
        <p className="flex items-center gap-2 text-[color:var(--sepia)]">
          <Lock size={13} className="flex-shrink-0" />
          You are seeing the messages you have sent. Others' messages are kept private.
        </p>
      )}

      {/* The postbag */}
      {rows.length === 0 ? (
        <Empty
          title={ownOnly ? 'You have not written yet' : 'No feedback received'}
          description={mySubmit
            ? 'Choose a programme in your division and tell the Assembly what you see.'
            : 'Messages from residents will appear here as they arrive.'}
          action={mySubmit && (
            <Button onClick={startCompose}>
              <MessageSquarePlus size={14} /> Give feedback
            </Button>
          )}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((f) => (
            <Card key={f.id} className="record-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[0.9375rem] font-semibold">{f.subject}</h3>
                    <Badge variant={KIND_VARIANT[f.kind]}>{FEEDBACK_KINDS[f.kind]?.label || f.kind}</Badge>
                    <Badge variant={STATUS_VARIANT[f.status]}>
                      {FEEDBACK_STATUSES[f.status]?.label || f.status}
                    </Badge>
                  </div>

                  <p className="mono text-[0.7rem] text-[color:var(--sepia-soft)] mt-1.5">
                    {f.project_name}{f.division ? ` · ${f.division} Division` : ''}
                  </p>

                  <p className="text-[color:var(--sepia)] mt-2.5 leading-relaxed whitespace-pre-wrap">
                    {f.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 mono text-[0.7rem] text-[color:var(--sepia-soft)]">
                    <span>{f.is_anonymous ? 'Anonymous' : (f.submitted_by || 'Anonymous')}</span>
                    <span>{new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <Stars value={f.rating} />
                  </div>
                </div>
              </div>

              {/* The Assembly's reply */}
              {f.response && (
                <div className="mt-4 pt-3.5 border-t border-[color:var(--rule)]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rotate-45 bg-[color:var(--highland)]" aria-hidden />
                    <span className="eyebrow text-[0.5rem]">
                      Reply from the Assembly
                      {f.responded_by ? ` · ${f.responded_by}` : ''}
                    </span>
                  </div>
                  <p className="leading-relaxed">{f.response}</p>
                </div>
              )}

              {/* Officer actions */}
              {mayRespond && f.status !== 'addressed' && f.status !== 'declined' && (
                <div className="mt-4 pt-3.5 border-t border-[color:var(--rule)]">
                  {replyTo === f.id ? (
                    <div className="space-y-2">
                      <Label>Reply</Label>
                      <textarea
                        className="field min-h-[90px] leading-relaxed"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="What the Assembly has done, or why it cannot act."
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button disabled={busy} onClick={() => sendReply(f.id, false)}>
                          <Check size={13} /> Record as addressed
                        </Button>
                        <Button variant="outline" disabled={busy} onClick={() => sendReply(f.id, true)}>
                          Record as not actioned
                        </Button>
                        <Button variant="ghost" disabled={busy} onClick={() => { setReplyTo(null); setReplyText('') }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {f.status === 'submitted' && (
                        <Button variant="outline" disabled={busy}
                          onClick={() => run(acknowledgeFeedback, f.id, officer)}>
                          <Check size={13} /> Acknowledge
                        </Button>
                      )}
                      <Button variant="outline" disabled={busy}
                        onClick={() => { setReplyTo(f.id); setReplyText(''); setError('') }}>
                        <Reply size={13} /> Reply
                      </Button>
                      <Button variant="destructive" disabled={busy}
                        onClick={() => {
                          if (window.confirm('Delete this message? The resident will not be told.')) {
                            run(deleteFeedback, f.id)
                          }
                        }}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
