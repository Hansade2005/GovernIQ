import { useState } from 'react'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { pp } from '@/lib/pipilot'
import {
  AlertCircle, Loader, Archive, TrendingUp, BarChart3,
  ChevronRight, MapPin, ShieldCheck, Search, FileText,
  Users, ArrowRight, Landmark,
} from 'lucide-react'

const DIVISIONS = ['Boyo', 'Bui', 'Donga-Mantung', 'Menchum', 'Mezam', 'Momo', 'Ngo-Ketunjia']

const PILLARS = [
  {
    n: '01', icon: Archive, t: 'Institutional Memory & Records',
    d: 'A single, searchable archive of every minute, motion, and ministerial report — OCR-read, AI-indexed, and citable on the floor.',
  },
  {
    n: '02', icon: TrendingUp, t: 'Real-Time Project Intelligence',
    d: 'Live execution of the regional budget across all seven divisions, from Bamenda to the last mile — tracked, mapped, and verified.',
  },
  {
    n: '03', icon: BarChart3, t: 'Evidence-Based Decision Support',
    d: 'Analytics that speak in the chamber: attendance, budget absorption, division equity. Evidence for the floor, not decoration for a slide.',
  },
]

const STATS = [
  { v: '07', l: 'Divisions governed in concert' },
  { v: '34', l: 'Councillors on the register' },
  { v: '03', l: 'Commissions in session' },
  { v: '24/7', l: 'The record, always open' },
]

function SignInForm({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('signin')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await pp.auth.signUpWithPassword({ email, password, name: name || email.split('@')[0] })
      } else {
        await pp.auth.signInWithPassword({ email, password })
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async () => {
    setError('')
    setLoading(true)
    try { await pp.auth.signIn(); onSuccess() }
    catch (err) { setError(err.message || 'OAuth failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="ceremonial">
      <p className="eyebrow">{mode === 'signup' ? 'New credential' : 'Present credentials'}</p>
      <h2 className="serif text-4xl mt-3 mb-2">{mode === 'signup' ? 'Take the oath.' : 'Take the floor.'}</h2>
      <p className="text-sm text-[color:var(--sepia)] mb-8">
        {mode === 'signup'
          ? 'Register for chamber access. An administrator will confirm your role.'
          : 'Sign in to enter the chamber, registry, and programmes.'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' && (
          <div>
            <Label>Honourable</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" type="text" />
          </div>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@council.gov" type="email" autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <Label htmlFor="password" className="mb-0">Password</Label>
            {mode === 'signin' && (
              <a href="#/reset" className="text-[0.7rem] mono text-[color:var(--sepia)] hover:text-[color:var(--ink)]">Forgot</a>
            )}
          </div>
          <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
        </div>
        {error && (
          <div className="flex gap-2 px-3 py-2 border border-[color:var(--rust)] text-[color:var(--rust)] text-xs rounded-[2px]">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        <Button type="submit" variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
          {loading ? (<><Loader size={14} className="animate-spin" /> Verifying…</>) : (mode === 'signup' ? 'Register for access' : 'Sign in →')}
        </Button>
      </form>
      <div className="my-6 rule-centered"><span className="eyebrow text-[0.6rem]">or</span></div>
      <Button type="button" variant="outline" className="w-full justify-center" onClick={handleOAuth} disabled={loading}>
        Continue with single sign-on
      </Button>
      <div className="mt-8 pt-6 border-t border-[color:var(--rule)] text-sm text-[color:var(--sepia)]">
        {mode === 'signup' ? (
          <>Already sworn in? <button type="button" onClick={() => setMode('signin')} className="text-[color:var(--kola)] hover:underline">Sign in</button></>
        ) : (
          <>New to the chamber? <button type="button" onClick={() => setMode('signup')} className="text-[color:var(--kola)] hover:underline">Request access</button></>
        )}
      </div>
    </div>
  )
}

/**
 * Landing — the public face of the Assembly. Hero, record strip,
 * three pillars, divisions, how-it-works, and the credential desk.
 */
export function LoginPage({ onSuccess }) {
  const scrollToAccess = () => document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[color:var(--paper)] text-[color:var(--ink)] flex flex-col">
      <div className="ornament ornament-draw" aria-hidden />

      {/* ── Masthead ── */}
      <header className="border-b border-[color:var(--rule)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/ra-logo.svg" alt="" className="h-10 w-10 object-contain" aria-hidden />
            <div>
              <p className="eyebrow">North West Regional Assembly</p>
              <p className="mono text-[0.65rem] text-[color:var(--sepia)] mt-0.5">Law No. 024 · 24 December 2019</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[0.65rem] text-[color:var(--sepia)] hidden sm:inline">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <Button variant="primary" className="!py-2" onClick={scrollToAccess}>Enter the chamber</Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <img src="/landing-chamber.webp" alt="The Assembly chamber at golden hour" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[color:var(--ink)]/55" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-36 ceremonial">
          <p className="eyebrow !text-[color:var(--brass)]">Volume II · Session 2026 · Bamenda</p>
          <h1 className="serif display-xl text-[color:var(--paper)] mt-5 max-w-3xl">
            Regional Governance<br />Made <span className="italic">Transparent.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[color:var(--paper)]/85 leading-relaxed">
            GovernIQ is the digital register of the North West Regional Assembly —
            unified records, streamlined workflows, and evidence-led decisions
            for the seven divisions of the Grassfields.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button variant="primary" className="!px-7 !py-3" onClick={scrollToAccess}>
              Access the Dashboard <ArrowRight size={15} />
            </Button>
            <a href="#pillars" className="inline-flex items-center gap-2 px-7 py-3 border border-[color:var(--paper)]/50 text-[color:var(--paper)] text-sm hover:bg-[color:var(--paper)]/10 transition-colors rounded-[2px]">
              Read the record
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-[color:var(--rule)] bg-[color:var(--vellum)]">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={s.l} className={`ceremonial stagger stagger-${i + 1}`}>
              <p className="serif text-4xl md:text-5xl text-[color:var(--highland)]">{s.v}</p>
              <p className="mono text-[0.7rem] tracking-wider text-[color:var(--sepia)] mt-2 uppercase">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pillars ── */}
      <section id="pillars" className="max-w-7xl mx-auto px-6 py-20 md:py-28 w-full">
        <div className="ceremonial max-w-2xl">
          <p className="eyebrow">What the register holds</p>
          <h2 className="serif text-4xl md:text-5xl mt-4">Three duties,<br /><span className="italic text-[color:var(--highland)]">one record.</span></h2>
          <div className="ornament mt-6 max-w-[220px]" aria-hidden />
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <article key={p.n} className={`ceremonial stagger stagger-${i + 1} record-card bg-[color:var(--vellum)] border border-[color:var(--rule)] p-8 hover:-translate-y-0.5 transition-transform duration-200`}>
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center justify-center h-11 w-11 border border-[color:var(--brass)] text-[color:var(--brass)] rounded-[2px]">
                  <p.icon size={20} />
                </span>
                <span className="mono text-xs tracking-widest text-[color:var(--brass)]">{p.n}</span>
              </div>
              <h3 className="serif text-2xl mt-6 leading-snug">{p.t}</h3>
              <p className="text-sm text-[color:var(--sepia)] mt-3 leading-relaxed">{p.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Divisions ── */}
      <section className="relative overflow-hidden border-y border-[color:var(--rule)]">
        <img src="/landing-divisions.webp" alt="Grassfields highlands at dawn" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[color:var(--highland)]/78" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-24 ceremonial">
          <p className="eyebrow !text-[color:var(--brass)]">Seven divisions · one concert</p>
          <h2 className="serif text-4xl md:text-5xl text-[color:var(--paper)] mt-4 max-w-2xl">
            From Bamenda to <span className="italic">the last mile.</span>
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {DIVISIONS.map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 px-4 py-2 border border-[color:var(--paper)]/40 text-[color:var(--paper)] text-sm rounded-[2px]">
                <MapPin size={13} /> {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 w-full">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12">
          <div className="ceremonial">
            <p className="eyebrow">Order of business</p>
            <h2 className="serif text-4xl mt-4">How the chamber<br /><span className="italic text-[color:var(--highland)]">keeps its record.</span></h2>
            <div className="ornament mt-6 max-w-[220px]" aria-hidden />
            <p className="mt-6 text-[color:var(--sepia)] leading-relaxed max-w-md">
              Every sitting, report, and field check-in flows into one register —
              searchable in seconds, citable on the floor, and open to every division.
            </p>
          </div>
          <ol className="space-y-0">
            {[
              { icon: FileText, t: 'Record', d: 'Minutes, motions, and reports are filed the moment they are adopted — paper scanned, OCR-read, and archived.' },
              { icon: Search, t: 'Retrieve', d: 'Ask the register anything. Global search and the AI assistant answer with citations to the exact sitting.' },
              { icon: Users, t: 'Resolve', d: 'Programmes move from vote to works to verification — tracked live until the division signs off.' },
              { icon: ShieldCheck, t: 'Account', d: 'Analytics close the loop: attendance, absorption, equity — the evidence behind every decision.' },
            ].map((s, i) => (
              <li key={s.t} className={`ceremonial stagger stagger-${i + 1} flex gap-5 py-6 border-b border-[color:var(--rule)] first:pt-0`}>
                <span className="mono text-xs tracking-widest text-[color:var(--brass)] pt-1.5">0{i + 1}</span>
                <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 bg-[color:var(--highland)] text-[color:var(--paper)] rounded-[2px]"><s.icon size={17} /></span>
                <div>
                  <p className="serif text-xl">{s.t}</p>
                  <p className="text-sm text-[color:var(--sepia)] mt-1 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Standing quote ── */}
      <section className="border-y border-[color:var(--rule)] bg-[color:var(--highland)] text-[color:var(--paper)]">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 text-center ceremonial">
          <Landmark size={26} className="mx-auto text-[color:var(--brass)]" />
          <blockquote className="serif text-2xl md:text-4xl italic leading-snug mt-6">
            “What is written in the register outlives every sitting — that is why we write it well.”
          </blockquote>
          <p className="mono text-[0.7rem] tracking-widest uppercase mt-6 text-[color:var(--paper)]/70">Standing Order · The Clerk of the House</p>
        </div>
      </section>

      {/* ── Credential desk ── */}
      <section id="access" className="max-w-7xl mx-auto px-6 py-20 md:py-28 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="ceremonial">
            <p className="eyebrow">The credential desk</p>
            <h2 className="serif text-4xl md:text-5xl mt-4">Take your seat<br /><span className="italic text-[color:var(--highland)]">in the chamber.</span></h2>
            <div className="ornament mt-6 max-w-[220px]" aria-hidden />
            <p className="mt-6 text-[color:var(--sepia)] leading-relaxed max-w-md">
              Councillors, commission members, clerks, and division officers —
              present your credentials to enter the live sitting, the registry,
              and the programme tracker.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {['Live situation room during sittings', 'Full document registry with AI search', 'Programme tracking across 7 divisions'].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <ChevronRight size={15} className="text-[color:var(--brass)]" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[color:var(--vellum)] border border-[color:var(--rule)] p-8 md:p-10 record-card">
            <SignInForm onSuccess={onSuccess} />
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--rule)] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-[0.6rem]">North West Regional Assembly · Up Station, Bamenda</p>
          <p className="mono text-[0.65rem] text-[color:var(--sepia)]">info@nwra.cm · +237 233 362 100</p>
        </div>
      </footer>
    </div>
  )
}
