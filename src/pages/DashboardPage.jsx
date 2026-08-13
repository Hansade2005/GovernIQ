import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { MapComponent } from '@/components/MapComponent'
import { ThreeDVisualization } from '@/components/ThreeDVisualization'
import {
  FileText, CheckCircle, MapPin, ArrowUpRight, ArrowDownRight,
  Calendar, ChevronRight,
} from 'lucide-react'
import { useQuery } from '@/lib/useRegistry'
import { Loading, LoadFailure } from '@/components/QueryState'
import {
  listKpis, listDivisions, getPortfolioSummary, listSessions,
  listBudgetLines, listDivisionPerformance, formatFcfa,
} from '@/lib/registry'

export function DashboardPage() {
  const [openDiv, setOpenDiv] = useState(null)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Everything on this page comes from the registry, so the figures on the
  // floor always agree with the roll.
  const { data, loading, error, refresh } = useQuery(async () => {
    const [kpis, divisions, summary, sessions, budget, performance] = await Promise.all([
      listKpis(),
      listDivisions(),
      getPortfolioSummary(),
      listSessions({ limit: 3 }),
      listBudgetLines(2026),
      listDivisionPerformance(2026),
    ])
    return { kpis, divisions, summary, sessions, budget, performance }
  }, [])

  if (loading && !data) return <Loading label="Opening the chamber" />
  if (error && !data) return <LoadFailure error={error} onRetry={refresh} />

  const { kpis, divisions, summary, sessions, budget, performance } = data
  const execByDivision = Object.fromEntries(
    performance.map((p) => [p.division, Number(p.execution_rate)])
  )
  const countByDivision = Object.fromEntries(
    summary.byDivision.map((d) => [d.division, d.count])
  )
  const featured = summary.projects.slice(0, 4)
  const totalBudget = budget.reduce((s, b) => s + Number(b.allocated_fcfa), 0)

  return (
    <div className="stagger space-y-14">
      {/* Ceremonial masthead — the one place the serif runs large */}
      <section className="ceremonial">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <img
              src="/nwra-logo.png"
              alt=""
              className="h-9 w-9 object-contain"
              aria-hidden
            />
            <div>
              <p className="eyebrow">North West Regional Assembly</p>
              <p className="mono text-[0.7rem] text-[color:var(--sepia)] mt-0.5">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Chamber in session</Badge>
            <Badge variant="secondary">Records signed</Badge>
          </div>
        </div>

        <h1 className="serif display-lg max-w-4xl">
          Seven divisions, <span className="italic text-[color:var(--highland)]">one register</span>.
        </h1>

        <div className="ornament ornament-draw mt-5 max-w-sm" aria-hidden />

        <p className="mt-4 max-w-2xl text-[color:var(--sepia)] leading-relaxed">
          Ninety members — seventy divisional representatives and twenty
          traditional rulers of the House of Chiefs — govern the North West
          from Bamenda. This is the state of the region today.
        </p>
      </section>

      {/* Ledger of key figures */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <p className="eyebrow">Ledger of the day</p>
          <a href="#/analytics" className="text-xs mono text-[color:var(--sepia)] hover:text-[color:var(--ink)]">
            View analytics →
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-b border-[color:var(--rule)]">
          {kpis.map((m, idx) => (
            <div
              key={m.slug}
              className={`px-5 py-6 ${idx < kpis.length - 1 ? 'lg:border-r' : ''} ${idx < 2 ? 'border-b lg:border-b-0' : ''} ${idx % 2 === 0 ? 'border-r lg:border-r' : ''} border-[color:var(--rule)]`}
            >
              <p className="eyebrow text-[0.6rem]">{m.label}</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="figure-serif text-[clamp(2.25rem,3.6vw,3rem)] text-[color:var(--ink)]">{m.value}</span>
                <span className="mono text-xs text-[color:var(--sepia)] pb-1.5">{m.unit}</span>
              </div>
              <div className={`mt-2 flex items-center gap-1.5 mono text-[0.7rem] ${m.direction === 'up' ? 'text-[color:var(--sage)]' : m.direction === 'down' ? 'text-[color:var(--rust)]' : 'text-[color:var(--sepia)]'}`}>
                {m.direction === 'up' && <ArrowUpRight size={12} strokeWidth={2} />}
                {m.direction === 'down' && <ArrowDownRight size={12} strokeWidth={2} />}
                {m.delta}
              </div>
              <p className="text-[0.7rem] text-[color:var(--sepia)] mt-1.5 leading-snug">{m.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two columns — divisions + treasury */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
        <Card>
          <CardMasthead
            eyebrow="Seven divisions"
            title="Operational disposition"
            aside="+ House of Chiefs"
          />
          <div className="space-y-0">
            {divisions.map((d, idx) => {
              const exec = execByDivision[d.name] ?? 0
              const count = countByDivision[d.name] ?? 0
              return (
                <div
                  key={d.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-3 ${idx !== 0 ? 'border-t border-[color:var(--rule)]' : ''}`}
                >
                  <span className="mono text-[0.7rem] text-[color:var(--sepia)] w-8">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold leading-tight">
                      {d.name}
                      <span className="text-[color:var(--sepia)] font-normal text-sm ml-2">· {d.seat}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="progress-track flex-1 max-w-[220px]">
                        <div
                          className="progress-fill progress-fill--brass"
                          style={{ width: `${exec * 100}%` }}
                        />
                      </div>
                      <span className="mono text-[0.7rem] text-[color:var(--sepia)]">
                        {(exec * 100).toFixed(0)}% executed
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="mono text-lg text-[color:var(--ink)]">{count}</p>
                    <p className="eyebrow text-[0.55rem]">programmes</p>
                  </div>
                  <button
                    onClick={() => setOpenDiv(openDiv === idx ? null : idx)}
                    className="text-[color:var(--sepia)] hover:text-[color:var(--kola)] transition p-1"
                    aria-label={`Details for ${d.name}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardMasthead
            eyebrow="Treasury"
            title="FY 2026 disposition"
            aside={formatFcfa(totalBudget)}
          />

          {budget.map((line, i) => (
            <TreasuryLine
              key={line.id}
              label={line.category}
              value={((Number(line.allocated_fcfa) / totalBudget) * 100).toFixed(2)}
              figure={formatFcfa(line.allocated_fcfa)}
              tone={i === 0 ? 'highland' : 'brass'}
            />
          ))}

          <div className="mt-6 pt-6 border-t border-[color:var(--rule)]">
            <p className="eyebrow text-[0.6rem]">FY 2025 execution — closed</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="figure-serif text-5xl text-[color:var(--kola)]">97.5</span>
              <span className="mono text-sm text-[color:var(--sepia)] pb-1">%</span>
            </div>
            <p className="text-xs text-[color:var(--sepia)] mt-2">
              10.3 B FCFA appropriated · adjusted upward from initial vote
            </p>
          </div>
        </Card>
      </section>

      {/* Map + 3D — keep original components */}
      <section>
        <SectionHead
          eyebrow="Cartography"
          title="Geographic disposition of programmes"
          note="Every mapped point is an active programme with a signed contract, a contractor of record, and a public liaison."
        />
        <MapComponent />
      </section>

      <section>
        <SectionHead
          eyebrow="Model"
          title="Three-dimensional programme atlas"
          note="A live model of programme intensity, budget weight, and completion rate across the seven divisions."
        />
        <ThreeDVisualization />
      </section>

      {/* Featured programmes */}
      <section>
        <SectionHead eyebrow="Roll of programmes" title="Currently before the chamber" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p, idx) => (
            <article key={p.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden border border-[color:var(--rule)] bg-[color:var(--linen)]">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt=""
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant={p.status === 'completed' ? 'success' : 'accent'}>
                    {p.status === 'completed' ? 'Completed' : 'In session'}
                  </Badge>
                </div>
                {/* A photograph on a transparency platform must not be mistaken
                    for evidence of these particular works. */}
                {p.image_is_illustrative && (
                  <span className="absolute bottom-0 inset-x-0 px-2 py-1 bg-[color:var(--ink)]/70 text-white/90 mono text-[0.55rem] leading-snug">
                    Illustrative · {p.image_credit?.split(' — ')[0]}
                  </span>
                )}
              </div>
              <p className="mono text-[0.65rem] text-[color:var(--sepia)] mt-3">
                {String(idx + 1).padStart(2, '0')} · {p.division} Division
              </p>
              <h3 className="text-[0.9375rem] font-semibold leading-snug mt-1">{p.name}</h3>
              <p className="text-xs text-[color:var(--sepia)] mt-1">{p.contractor}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="progress-track flex-1">
                  <div
                    className={`progress-fill ${p.status === 'completed' ? '' : 'progress-fill--accent'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="mono text-[0.7rem] text-[color:var(--sepia)]">{p.progress}%</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="mono text-[color:var(--brass-ink)]">{formatFcfa(p.budget_fcfa)}</span>
                <a
                  href="#/projects"
                  className="text-[color:var(--sepia)] hover:text-[color:var(--kola)] flex items-center gap-1"
                >
                  Read <ArrowUpRight size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Sessions */}
      <section>
        <SectionHead eyebrow="Order of the day" title="Recent sessions and deliberations" />

        <Card>
          <div className="space-y-0">
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-6 py-4 ${idx !== 0 ? 'border-t border-[color:var(--rule)]' : ''}`}
              >
                <div className="mono text-xs text-[color:var(--sepia)] w-32">
                  {new Date(s.sat_on).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </div>
                <div>
                  <p className="text-[0.9375rem] font-semibold leading-tight">{s.kind}</p>
                  <p className="text-xs text-[color:var(--sepia)] mt-0.5">{s.note}</p>
                </div>
                <div className="text-right">
                  <p className="mono text-lg text-[color:var(--ink)]">{s.items}</p>
                  <p className="eyebrow text-[0.55rem]">items</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => (window.location.hash = '#/reports')}>
                  <FileText size={13} /> Minutes
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-[color:var(--rule)] flex flex-wrap gap-3">
            <Button variant="primary">
              <FileText size={14} /> Full order of the day
            </Button>
            <Button variant="outline">
              <Calendar size={14} /> Schedule a session
            </Button>
          </div>
        </Card>
      </section>

      {/* Colophon */}
      <section className="border-t border-[color:var(--rule)] pt-8 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Colophon</p>
            <p className="serif italic text-sm text-[color:var(--sepia)] mt-2 max-w-xl">
              Set in Fraunces and Instrument Sans · tabular figures in JetBrains
              Mono · ornament after grassfields textile lozenges of the Bamenda
              highlands.
            </p>
          </div>
          <span className="mono text-[0.65rem] text-[color:var(--sepia)]">© MMXXVI · NWRA</span>
        </div>
      </section>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Local subcomponents (kept in this file to avoid noise)
   ──────────────────────────────────────────────────────────── */

function CardMasthead({ eyebrow, title, aside }) {
  return (
    <div className="panel-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="text-[1.0625rem] font-semibold mt-1 leading-tight">{title}</h3>
      </div>
      {aside && (
        <span className="mono text-xs text-[color:var(--brass-ink)] flex-shrink-0">{aside}</span>
      )}
    </div>
  )
}

function SectionHead({ eyebrow, title, note }) {
  return (
    <div className="mb-4 pb-3 border-b border-[color:var(--rule)]">
      <div className="flex items-center gap-2">
        <span className="ornament-mark" aria-hidden />
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h2 className="page-title mt-1.5">{title}</h2>
      {note && (
        <p className="text-[color:var(--sepia)] mt-1.5 max-w-2xl leading-relaxed">
          {note}
        </p>
      )}
    </div>
  )
}

function TreasuryLine({ label, value, figure, tone }) {
  const fillClass = tone === 'highland' ? '' : 'progress-fill--brass'
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-[color:var(--ink)]">{label}</span>
        <span className="mono text-sm text-[color:var(--sepia)]">
          {/* `figure` already carries its unit — formatFcfa appends it. */}
          <span className="text-[color:var(--ink)]">{figure}</span>
          {' · '}{value}%
        </span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${fillClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
