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

const metrics = [
  { label: 'Budget Execution',  value: '97.5',  unit: '%',    delta: '+2.3 pts',  dir: 'up',   note: 'Against FY 2025 baseline' },
  { label: 'Programmes Active', value: '31',    unit: '',     delta: '+5 mo/mo',  dir: 'up',   note: 'Across seven divisions' },
  { label: 'Registered Divisions', value: '07', unit: '',     delta: 'Full quorum', dir: 'flat', note: 'Plus House of Chiefs' },
  { label: 'Budget FY 2026',    value: '20.8',  unit: 'B FCFA', delta: '+8.4% y/y', dir: 'up',   note: '18.1B investment · 2.7B operations' },
]

/* Ten divisional representatives are returned from each of the seven
   divisions (Law No. 024 of 24 December 2019), alongside 20 traditional
   rulers in the House of Chiefs. */
const divisions = [
  { name: 'Mezam',         seat: 'Bamenda',  reps: 10, projects: 5, exec: 0.94 },
  { name: 'Menchum',       seat: 'Wum',      reps: 10, projects: 4, exec: 0.81 },
  { name: 'Momo',          seat: 'Mbengwi',  reps: 10, projects: 3, exec: 0.78 },
  { name: 'Bui',           seat: 'Kumbo',    reps: 10, projects: 1, exec: 0.68 },
  { name: 'Boyo',          seat: 'Fundong',  reps: 10, projects: 1, exec: 0.72 },
  { name: 'Donga-Mantung', seat: 'Nkambe',   reps: 10, projects: 1, exec: 0.65 },
  { name: 'Ngoketunjia',   seat: 'Ndop',     reps: 10, projects: 1, exec: 0.70 },
]

const featured = [
  { id: 1, name: 'Wum District Hospital · Perimeter Fence',   division: 'Menchum',  contractor: 'Lake Nyos Survival',  status: 'Completed', progress: 100, budget: '45 M', image: '/projects/wum-hospital-fence-1.jpg' },
  { id: 2, name: 'Government High School · Classroom Blocks', division: 'Momo',     contractor: 'ACONSEP Co. Ltd',      status: 'Completed', progress: 100, budget: '120 M', image: '/projects/ghs-roofing-1.jpg' },
  { id: 3, name: 'Regional Science Laboratory',               division: 'Mezam',    contractor: 'Regional Contractor', status: 'In session', progress: 75,  budget: '85 M',  image: '/projects/ghs-roofing-2.jpg' },
  { id: 4, name: 'Batibo Hospital Rehabilitation',            division: 'Menchum',  contractor: 'Infrastructure Ptrs', status: 'In session', progress: 60,  budget: '95 M',  image: '/projects/batibo-hospital-1.jpg' },
]

const sessions = [
  { date: '12 March 2026',    type: 'Full Assembly',      items: 8,  note: 'Ratification of the Q1 execution report' },
  { date: '15 February 2026', type: 'Committee Hearing',  items: 12, note: 'Finance, Budget & Investment' },
  { date: '28 January 2026',  type: 'Special Session',    items: 5,  note: 'Emergency roads programme' },
]

export function DashboardPage() {
  const [openDiv, setOpenDiv] = useState(null)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

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
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className={`px-5 py-6 ${idx < metrics.length - 1 ? 'lg:border-r' : ''} ${idx < 2 ? 'border-b lg:border-b-0' : ''} ${idx % 2 === 0 ? 'border-r lg:border-r' : ''} border-[color:var(--rule)]`}
            >
              <p className="eyebrow text-[0.6rem]">{m.label}</p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="figure-serif text-[clamp(2.25rem,3.6vw,3rem)] text-[color:var(--ink)]">{m.value}</span>
                <span className="mono text-xs text-[color:var(--sepia)] pb-1.5">{m.unit}</span>
              </div>
              <div className={`mt-2 flex items-center gap-1.5 mono text-[0.7rem] ${m.dir === 'up' ? 'text-[color:var(--sage)]' : m.dir === 'down' ? 'text-[color:var(--rust)]' : 'text-[color:var(--sepia)]'}`}>
                {m.dir === 'up' && <ArrowUpRight size={12} strokeWidth={2} />}
                {m.dir === 'down' && <ArrowDownRight size={12} strokeWidth={2} />}
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
            {divisions.map((d, idx) => (
              <div
                key={d.name}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-3 ${idx !== 0 ? 'border-t border-[color:var(--rule)]' : ''}`}
              >
                <span className="mono text-[0.7rem] text-[color:var(--sepia)] w-8">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="serif text-base leading-tight">
                    {d.name}
                    <span className="text-[color:var(--sepia)] text-sm ml-2">· {d.seat}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="progress-track flex-1 max-w-[220px]">
                      <div
                        className="progress-fill progress-fill--brass"
                        style={{ width: `${d.exec * 100}%` }}
                      />
                    </div>
                    <span className="mono text-[0.7rem] text-[color:var(--sepia)]">
                      {(d.exec * 100).toFixed(0)}% executed
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="mono text-lg text-[color:var(--ink)]">{d.projects}</p>
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
            ))}
          </div>
        </Card>

        <Card>
          <CardMasthead
            eyebrow="Treasury"
            title="FY 2026 disposition"
            aside="20.8 B FCFA"
          />

          <TreasuryLine label="Investment programmes" value="87.31" figure="18.1 B" tone="highland" />
          <TreasuryLine label="Ordinary operations"    value="12.69" figure="2.7 B" tone="brass" />

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
          {featured.map((p) => (
            <article key={p.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden border border-[color:var(--rule)] bg-[color:var(--linen)]">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  style={{ filter: 'sepia(0.2) contrast(1.05)' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
                <div className="absolute top-2 left-2">
                  <Badge variant={p.status === 'Completed' ? 'success' : 'accent'}>
                    {p.status}
                  </Badge>
                </div>
              </div>
              <p className="mono text-[0.65rem] text-[color:var(--sepia)] mt-3">
                {String(p.id).padStart(2, '0')} · {p.division} Division
              </p>
              <h3 className="serif text-lg leading-tight mt-1">{p.name}</h3>
              <p className="text-xs text-[color:var(--sepia)] mt-1">{p.contractor}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="progress-track flex-1">
                  <div
                    className={`progress-fill ${p.status === 'Completed' ? '' : 'progress-fill--accent'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="mono text-[0.7rem] text-[color:var(--sepia)]">{p.progress}%</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="mono text-[color:var(--brass)]">{p.budget} FCFA</span>
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
                key={idx}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-6 py-4 ${idx !== 0 ? 'border-t border-[color:var(--rule)]' : ''}`}
              >
                <div className="mono text-xs text-[color:var(--sepia)] w-32">
                  {s.date}
                </div>
                <div>
                  <p className="serif text-base leading-tight">{s.type}</p>
                  <p className="text-xs text-[color:var(--sepia)] mt-0.5">{s.note}</p>
                </div>
                <div className="text-right">
                  <p className="mono text-lg text-[color:var(--ink)]">{s.items}</p>
                  <p className="eyebrow text-[0.55rem]">items</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => console.log('View session:', idx)}>
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
          <span className="text-[color:var(--ink)]">{figure} FCFA</span>
          {' · '}{value}%
        </span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${fillClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
