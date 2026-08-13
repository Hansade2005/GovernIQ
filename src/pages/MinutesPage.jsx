import { useState, useCallback } from 'react'
import {
  Plus, Gavel, FileText, Check, Archive, Trash2, Lock, X, Users,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { Loading, LoadFailure, Empty } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { useSession } from '@/lib/SessionContext'
import {
  listMinutes, createMinute, updateMinute, layBeforeHouse,
  adoptMinute, archiveMinute, deleteMinute, summarise,
  MINUTE_STATUSES, SITTING_KINDS,
} from '@/lib/minutes'

const STATUS_VARIANT = {
  draft: 'secondary',
  for_adoption: 'accent',
  adopted: 'success',
  archived: 'muted',
}

const blankMinute = () => ({
  sat_on: new Date().toISOString().slice(0, 10),
  kind: 'Full Assembly',
  title: '',
  venue: 'Assembly Chamber, Up Station, Bamenda',
  presided_by: '',
  body: '',
  present_count: 0,
  absent_count: 0,
  resolutions: [],
})

export function MinutesPage() {
  const { allows, profile } = useSession()
  const mayWrite = allows('minutes.write')
  const mayAdopt = allows('minutes.adopt')

  const [filter, setFilter] = useState('All')
  const [editing, setEditing] = useState(null)   // draft object or null
  const [openId, setOpenId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { data, loading, error: loadError, refresh } =
    useQuery(() => listMinutes({ status: filter }), [filter])

  const rows = data ?? []
  const stats = summarise(rows)

  const act = useCallback(async (fn, ...args) => {
    setBusy(true); setError('')
    try { await fn(...args); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }, [refresh])

  const save = async () => {
    if (!editing.title.trim()) { setError('Give the sitting a title.'); return }
    setBusy(true); setError('')
    try {
      const payload = { ...editing, recorded_by: profile?.full_name || profile?.email || 'Clerk' }
      if (editing.id) await updateMinute(editing.id, payload)
      else await createMinute(payload)
      setEditing(null)
      await refresh()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  if (loading && !data) return <Loading label="Opening the minute book" />
  if (loadError && !data) return <LoadFailure error={loadError} onRetry={refresh} />

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Chamber"
        title="Minutes"
        description="The record of every sitting — what was laid, what was debated, and what the House carried."
        actions={mayWrite && (
          <Button onClick={() => { setEditing(blankMinute()); setError('') }}>
            <Plus size={14} /> Record a sitting
          </Button>
        )}
      />

      {!mayWrite && (
        <p className="flex items-center gap-2 text-[color:var(--sepia)] px-3 py-2 rounded-[4px] border border-[color:var(--rule)] bg-[color:var(--card-bg)]">
          <Lock size={13} className="flex-shrink-0" />
          You have reading access to the minute book. Recording is kept by the Clerk.
        </p>
      )}

      {error && (
        <div className="px-3 py-2 rounded-[4px] border border-[color:var(--rust)] text-[color:var(--rust)]">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sittings recorded', value: stats.total,       tone: 'figure-highland' },
          { label: 'In draft',          value: stats.draft,       tone: 'figure-brass' },
          { label: 'Awaiting adoption', value: stats.forAdoption, tone: 'figure-kola' },
          { label: 'Resolutions carried', value: stats.resolutions, tone: 'figure-highland' },
        ].map((s) => (
          <Card key={s.label}>
            <p className="eyebrow text-[0.6rem]">{s.label}</p>
            <p className={`figure text-3xl mt-2 ${s.tone}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {['All', ...Object.keys(MINUTE_STATUSES)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-[3px] text-[0.8125rem] font-medium border transition ${
              filter === s
                ? 'bg-[color:var(--highland)] text-white border-[color:var(--highland)]'
                : 'border-[color:var(--rule)] text-[color:var(--sepia)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)]'
            }`}
          >
            {s === 'All' ? 'All' : MINUTE_STATUSES[s].label}
          </button>
        ))}
      </div>

      {/* Editor */}
      {editing && (
        <Card>
          <div className="panel-head">
            <div>
              <p className="eyebrow">{editing.id ? 'Editing' : 'New record'}</p>
              <h3 className="text-[1.0625rem] font-semibold mt-1">Minute of a sitting</h3>
            </div>
            <button onClick={() => setEditing(null)} className="btn btn-ghost" aria-label="Cancel">
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Minutes of the March 2026 Ordinary Session"
              />
            </div>
            <div>
              <Label>Sat on</Label>
              <Input type="date" value={editing.sat_on}
                onChange={(e) => setEditing({ ...editing, sat_on: e.target.value })} />
            </div>
            <div>
              <Label>Kind of sitting</Label>
              <select
                className="field"
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value })}
              >
                {SITTING_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <Label>Presided by</Label>
              <Input value={editing.presided_by || ''}
                onChange={(e) => setEditing({ ...editing, presided_by: e.target.value })}
                placeholder="Prof. Fru Fobuzshi Angwafo III" />
            </div>
            <div>
              <Label>Venue</Label>
              <Input value={editing.venue || ''}
                onChange={(e) => setEditing({ ...editing, venue: e.target.value })} />
            </div>
            <div>
              <Label>Members present</Label>
              <Input type="number" min="0" value={editing.present_count}
                onChange={(e) => setEditing({ ...editing, present_count: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Members absent</Label>
              <Input type="number" min="0" value={editing.absent_count}
                onChange={(e) => setEditing({ ...editing, absent_count: Number(e.target.value) })} />
            </div>

            <div className="md:col-span-2">
              <Label>Proceedings</Label>
              <textarea
                className="field min-h-[180px] leading-relaxed"
                value={editing.body || ''}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                placeholder="What was laid, who spoke, and how the debate ran. Markdown is supported."
              />
            </div>

            {/* Resolutions */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0">Resolutions</Label>
                <button
                  type="button"
                  className="btn btn-ghost text-[0.75rem]"
                  onClick={() => setEditing({
                    ...editing,
                    resolutions: [...editing.resolutions, {
                      n: editing.resolutions.length + 1, text: '', carried: true, for: 0, against: 0,
                    }],
                  })}
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              {editing.resolutions.length === 0 ? (
                <p className="text-[color:var(--sepia)]">No resolution recorded for this sitting.</p>
              ) : (
                <div className="space-y-2">
                  {editing.resolutions.map((r, i) => (
                    <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center">
                      <span className="mono text-[0.7rem] text-[color:var(--sepia)] w-6">{r.n}</span>
                      <Input
                        value={r.text}
                        placeholder="That the accounts be adopted as laid."
                        onChange={(e) => {
                          const next = [...editing.resolutions]
                          next[i] = { ...r, text: e.target.value }
                          setEditing({ ...editing, resolutions: next })
                        }}
                      />
                      <Input type="number" min="0" className="w-20" value={r.for} title="For"
                        onChange={(e) => {
                          const next = [...editing.resolutions]
                          next[i] = { ...r, for: Number(e.target.value) }
                          setEditing({ ...editing, resolutions: next })
                        }} />
                      <Input type="number" min="0" className="w-20" value={r.against} title="Against"
                        onChange={(e) => {
                          const next = [...editing.resolutions]
                          next[i] = { ...r, against: Number(e.target.value) }
                          setEditing({ ...editing, resolutions: next })
                        }} />
                      <button
                        type="button"
                        className="p-2 text-[color:var(--rust)] hover:bg-[color:var(--linen)] rounded-[3px]"
                        aria-label="Remove resolution"
                        onClick={() => setEditing({
                          ...editing,
                          resolutions: editing.resolutions
                            .filter((_, j) => j !== i)
                            .map((x, j) => ({ ...x, n: j + 1 })),
                        })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <p className="eyebrow text-[0.5rem]">Vote columns are For, then Against.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[color:var(--rule)]">
            <Button onClick={save} disabled={busy}>
              {busy ? 'Saving…' : editing.id ? 'Save minute' : 'Open the minute'}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* The book */}
      {rows.length === 0 ? (
        <Empty
          title="No sitting recorded yet"
          description={mayWrite
            ? 'Open the first minute when the House next sits.'
            : 'Minutes will appear here once the Clerk has recorded them.'}
          action={mayWrite && (
            <Button onClick={() => setEditing(blankMinute())}>
              <Plus size={14} /> Record a sitting
            </Button>
          )}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((m) => {
            const open = openId === m.id
            const locked = m.status === 'adopted'
            return (
              <Card key={m.id} className="record-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[0.9375rem] font-semibold">{m.title}</h3>
                      <Badge variant={STATUS_VARIANT[m.status]}>
                        {MINUTE_STATUSES[m.status]?.label || m.status}
                      </Badge>
                      {locked && (
                        <span className="flex items-center gap-1 eyebrow text-[0.5rem]">
                          <Lock size={9} /> sealed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 mono text-[0.7rem] text-[color:var(--sepia-soft)]">
                      <span>{new Date(m.sat_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span>{m.kind}</span>
                      {m.presided_by && <span>Presided: {m.presided_by}</span>}
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {m.present_count} present · {m.absent_count} absent
                      </span>
                      {Array.isArray(m.resolutions) && m.resolutions.length > 0 && (
                        <span>{m.resolutions.length} resolution{m.resolutions.length === 1 ? '' : 's'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-[color:var(--rule)] space-y-5">
                    {m.body && (
                      <div>
                        <p className="eyebrow text-[0.55rem] mb-2">Proceedings</p>
                        <MarkdownMessage content={m.body} />
                      </div>
                    )}

                    {Array.isArray(m.resolutions) && m.resolutions.length > 0 && (
                      <div>
                        <p className="eyebrow text-[0.55rem] mb-2">Resolutions</p>
                        <div className="overflow-x-auto">
                          <table className="data w-full">
                            <thead>
                              <tr><th>No.</th><th>Resolution</th><th>For</th><th>Against</th><th>Outcome</th></tr>
                            </thead>
                            <tbody>
                              {m.resolutions.map((r, i) => (
                                <tr key={i}>
                                  <td className="num">{r.n}</td>
                                  <td>{r.text}</td>
                                  <td className="num">{r.for ?? '—'}</td>
                                  <td className="num">{r.against ?? '—'}</td>
                                  <td>
                                    <Badge variant={r.carried ? 'success' : 'destructive'}>
                                      {r.carried ? 'Carried' : 'Not carried'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {mayWrite && !locked && (
                        <Button variant="outline" onClick={() => { setEditing({ ...m, resolutions: m.resolutions || [] }); setError('') }}>
                          <FileText size={13} /> Edit
                        </Button>
                      )}
                      {mayWrite && m.status === 'draft' && (
                        <Button variant="outline" disabled={busy} onClick={() => act(layBeforeHouse, m.id)}>
                          <Gavel size={13} /> Lay before the House
                        </Button>
                      )}
                      {mayAdopt && m.status === 'for_adoption' && (
                        <Button disabled={busy} onClick={() => act(adoptMinute, m.id)}>
                          <Check size={13} /> Record adoption
                        </Button>
                      )}
                      {mayWrite && !locked && m.status !== 'archived' && (
                        <Button variant="outline" disabled={busy} onClick={() => act(archiveMinute, m.id)}>
                          <Archive size={13} /> Archive
                        </Button>
                      )}
                      {mayWrite && !locked && (
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Delete "${m.title}"? A minute not yet adopted can be removed.`)) {
                              act(deleteMinute, m.id)
                            }
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </Button>
                      )}
                      {locked && (
                        <p className="text-[color:var(--sepia)] flex items-center gap-1.5">
                          <Lock size={12} />
                          Adopted {m.adopted_on ? `on ${new Date(m.adopted_on).toLocaleDateString('en-GB')}` : ''} — correct it by a later minute, not by editing.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setOpenId(open ? null : m.id)}
                  className="mt-3 text-[0.75rem] font-medium text-[color:var(--kola)] hover:opacity-80"
                >
                  {open ? 'Close the minute' : 'Read the minute'}
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
