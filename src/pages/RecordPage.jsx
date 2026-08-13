import { useState, useMemo } from 'react'
import { Landmark, Scale, Search, ExternalLink, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Loading, LoadFailure, Empty } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { getRecordSummary, fcfa } from '@/lib/record'

/**
 * The House record since inception.
 *
 * Three registers the Assembly has never had in one place: what it voted
 * each year, whether the accounts for that year were adopted, and every
 * deliberation and resolution taken on the floor.
 *
 * The design decision that matters here is what happens to a missing
 * figure. It is shown, labelled, and counted — an unpublished 2023 budget
 * appears as a row saying so, not as an absent row. The Assembly can then
 * see at a glance which minutes are missing from its own record, which is
 * the first thing a regional evidence base ought to be able to tell it.
 */

const TABS = [
  { id: 'budget',   label: 'Budget',      icon: Landmark },
  { id: 'accounts', label: 'Accounts',    icon: Scale },
  { id: 'floor',    label: 'On the floor', icon: Scale },
]

export function RecordPage() {
  const [tab, setTab] = useState('budget')
  const [term, setTerm] = useState('')
  const [kind, setKind] = useState('All')

  const { data, loading, error, refresh } = useQuery(() => getRecordSummary(), [])

  const floor = useMemo(() => {
    if (!data) return []
    const t = term.trim().toLowerCase()
    return data.delibs.filter((d) =>
      (kind === 'All' || d.kind === kind) &&
      (!t || d.title.toLowerCase().includes(t) ||
        d.session_label.toLowerCase().includes(t) ||
        (d.theme || '').toLowerCase().includes(t))
    )
  }, [data, term, kind])

  if (loading && !data) return <Loading label="Opening the record" />
  if (error && !data) return <LoadFailure error={error} onRetry={refresh} />

  const { budget, accounts, counts, years, growth, span, gaps } = data
  const peak = Math.max(...years.map((y) => y.amount_fcfa))

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="The House record"
        title="Since inception"
        description="What the Assembly has voted, accounted for, and decided on the floor since 2021 — each entry against the document it came from."
      />

      {/* Headline counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Summary
          figure={span ? `${span[0]}–${span[1]}` : '—'}
          label="Fiscal years on record"
          sub={`${budget.length} budget entries, ${gaps} not yet published`}
        />
        <Summary
          figure={growth ? `${growth.toFixed(1)}×` : '—'}
          label="Budget growth"
          sub={span ? `From ${fcfa(years[0].amount_fcfa)} in ${span[0]} to ${fcfa(years[years.length - 1].amount_fcfa)} in ${span[1]}` : ''}
        />
        <Summary
          figure={counts.deliberations}
          label="Deliberations taken"
          sub={`Across ${counts.sessions} sittings on record`}
        />
        <Summary
          figure={counts.resolutions}
          label="Resolutions adopted"
          sub="From the sessions whose record is published"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[color:var(--rule)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id
                ? 'border-[color:var(--kola)] text-[color:var(--ink)]'
                : 'border-transparent text-[color:var(--sepia)] hover:text-[color:var(--ink)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Budget ─────────────────────────────────────────────── */}
      {tab === 'budget' && (
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <p className="eyebrow mb-5">Voted envelope by fiscal year</p>
            <div className="space-y-3.5">
              {years.map((y) => (
                <div key={y.fiscal_year} className="flex items-center gap-4">
                  <span className="mono text-sm text-[color:var(--sepia)] w-12 flex-shrink-0">
                    {y.fiscal_year}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="progress-track">
                      <div
                        className="progress-fill progress-fill--brass"
                        style={{ width: `${(y.amount_fcfa / peak) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="mono text-sm text-[color:var(--ink)] w-24 text-right flex-shrink-0">
                    {fcfa(y.amount_fcfa)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[color:var(--sepia)] mt-5 leading-relaxed">
              Where a year was adjusted, the adjusted figure is shown. Years whose
              figure has never been published are omitted from this chart and
              listed below.
            </p>
          </Card>

          <div className="space-y-3">
            {budget.map((b) => (
              <Card key={b.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="figure-serif text-2xl text-[color:var(--ink)]">
                      {b.fiscal_year}
                    </span>
                    <Badge variant={b.stage === 'Adjustment' ? 'accent' : 'secondary'}>
                      {b.stage}
                    </Badge>
                  </div>
                  {b.figure_status === 'published' ? (
                    <span className="figure-serif text-2xl text-[color:var(--brass-ink)]">
                      {fcfa(b.amount_fcfa)} <span className="mono text-xs">FCFA</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-[color:var(--kola)]">
                      <AlertTriangle size={14} />
                      Figure not published
                    </span>
                  )}
                </div>

                {(b.investment_fcfa || b.operating_fcfa) && (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 mono text-xs text-[color:var(--sepia)]">
                    <span>Investment {fcfa(b.investment_fcfa)} FCFA
                      <span className="text-[color:var(--brass-ink)]"> · {((b.investment_fcfa / b.amount_fcfa) * 100).toFixed(2)}%</span>
                    </span>
                    <span>Operating {fcfa(b.operating_fcfa)} FCFA
                      <span className="text-[color:var(--brass-ink)]"> · {((b.operating_fcfa / b.amount_fcfa) * 100).toFixed(2)}%</span>
                    </span>
                  </div>
                )}

                {b.session_label && (
                  <p className="mono text-xs text-[color:var(--sepia-soft)] mt-2">{b.session_label}</p>
                )}
                {b.note && (
                  <p className="text-sm text-[color:var(--sepia)] mt-2 leading-relaxed">{b.note}</p>
                )}
                <Source title={b.source_title} url={b.source_url} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Accounts ───────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <div className="space-y-3">
          {accounts.map((a) => (
            <Card key={a.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="figure-serif text-2xl text-[color:var(--ink)]">{a.fiscal_year}</span>
                  <Badge variant={a.status === 'Not published' ? 'muted' : 'success'}>{a.status}</Badge>
                </div>
                {a.execution_rate != null && (
                  <span className="figure-serif text-2xl text-[color:var(--brass-ink)]">
                    {(Number(a.execution_rate) * 100).toFixed(1)}
                    <span className="mono text-xs"> % executed</span>
                  </span>
                )}
              </div>

              {a.appropriated_fcfa && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 mono text-xs text-[color:var(--sepia)]">
                  <span>Appropriated {fcfa(a.appropriated_fcfa)} FCFA</span>
                  <span>Executed {fcfa(a.executed_fcfa)} FCFA</span>
                </div>
              )}
              {a.covers && <p className="text-sm text-[color:var(--ink)] mt-2">{a.covers}</p>}
              {a.session_label && (
                <p className="mono text-xs text-[color:var(--sepia-soft)] mt-1.5">{a.session_label}</p>
              )}
              {a.note && (
                <p className="text-sm text-[color:var(--sepia)] mt-2 leading-relaxed">{a.note}</p>
              )}
              <Source title={a.source_title} url={a.source_url} />
            </Card>
          ))}
        </div>
      )}

      {/* ── On the floor ───────────────────────────────────────── */}
      {tab === 'floor' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[16rem]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--sepia-soft)]" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search the floor record — FEICOM, NOWEDIF, dry port, scholarship…"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <div className="flex items-center gap-1">
              {['All', 'deliberation', 'resolution', 'business'].map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`px-3 py-1.5 text-xs rounded-[3px] border transition ${
                    kind === k
                      ? 'border-[color:var(--ink)] text-[color:var(--ink)]'
                      : 'border-[color:var(--rule-firm)] text-[color:var(--sepia)] hover:text-[color:var(--ink)]'
                  }`}
                >
                  {{ All: 'All', deliberation: 'Deliberations', resolution: 'Resolutions', business: 'Business' }[k]}
                </button>
              ))}
            </div>
            <span className="mono text-xs text-[color:var(--sepia-soft)]">
              {floor.length} of {data.delibs.length}
            </span>
          </div>

          {floor.length === 0 ? (
            <Empty
              title={`Nothing on the floor record matches “${term.trim()}”`}
              description="Try a partner, a fund, or part of a decision — FEICOM, Smile Train, dry port."
            />
          ) : (
            groupBySession(floor).map(([label, rows]) => (
              <Card key={label} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 mb-3 border-b border-[color:var(--rule)]">
                  <div>
                    <p className="font-semibold text-[color:var(--ink)]">{label}</p>
                    {rows[0].theme && (
                      <p className="text-xs italic text-[color:var(--sepia)] mt-0.5">“{rows[0].theme}”</p>
                    )}
                  </div>
                  <span className="mono text-xs text-[color:var(--sepia-soft)]">
                    {sittingDates(rows[0])}
                  </span>
                </div>
                <ol className="space-y-2.5">
                  {rows.map((d) => (
                    <li key={d.id} className="flex gap-3">
                      <span className="mono text-xs text-[color:var(--brass-ink)] pt-0.5 w-6 flex-shrink-0 text-right">
                        {d.item_no}
                      </span>
                      <span className="min-w-0">
                        <span className="text-sm text-[color:var(--ink)] leading-relaxed">{d.title}</span>
                        {d.kind !== 'deliberation' && (
                          <Badge variant="secondary" className="ml-2 align-middle">
                            {d.kind === 'resolution' ? 'Resolution' : 'Business'}
                          </Badge>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                <Source title={rows[0].source_title} url={rows[0].source_url} />
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Summary({ figure, label, sub }) {
  return (
    <Card className="p-4">
      <p className="eyebrow text-[0.55rem]">{label}</p>
      <p className="figure-serif text-[1.9rem] leading-none text-[color:var(--brass-ink)] mt-2">{figure}</p>
      {sub && <p className="text-xs text-[color:var(--sepia)] mt-2 leading-relaxed">{sub}</p>}
    </Card>
  )
}

/** Every entry cites its document — that is what makes this a record. */
function Source({ title, url }) {
  if (!title) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1.5 mt-3 pt-3 border-t border-[color:var(--rule)] text-xs text-[color:var(--sepia)] hover:text-[color:var(--ink)] transition w-full"
    >
      <ExternalLink size={12} className="mt-0.5 flex-shrink-0" />
      <span>{title}</span>
    </a>
  )
}

function groupBySession(rows) {
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.session_label)) map.set(r.session_label, [])
    map.get(r.session_label).push(r)
  }
  return [...map.entries()]
}

function sittingDates(d) {
  if (!d.sat_from) return ''
  const opts = d.date_precision === 'day'
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { month: 'long', year: 'numeric' }
  const from = new Date(d.sat_from).toLocaleDateString('en-GB', opts)
  if (d.date_precision !== 'day' || !d.sat_to) return from
  return `${new Date(d.sat_from).toLocaleDateString('en-GB', { day: 'numeric' })}–${new Date(d.sat_to).toLocaleDateString('en-GB', opts)}`
}
