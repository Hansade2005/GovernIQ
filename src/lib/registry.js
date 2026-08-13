import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Registry — the read/write layer for everything the Assembly records:
 * divisions, programmes, sittings, reports, progress depositions, the
 * treasury, and the figures behind the analytics.
 *
 * Authentication and the AI assistant remain on PiPilot; this module owns
 * data only. Every function returns plain arrays or objects and throws an
 * Error carrying a message fit to show a member.
 */

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('The registry database is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, action) {
  if (error) throw new Error(`${action}: ${error.message}`)
  return data
}

/* ── Divisions ─────────────────────────────────────────────────── */

export async function listDivisions() {
  return unwrap(
    await client().from('divisions').select('*').order('sort_order'),
    'Could not load divisions'
  ) || []
}

/* ── Programmes ────────────────────────────────────────────────── */

export async function listProjects({ division, status, limit = 200 } = {}) {
  let q = client().from('projects').select('*').order('created_at', { ascending: false }).limit(limit)
  if (division && division !== 'All') q = q.eq('division', division)
  if (status && status !== 'All') q = q.eq('status', status)
  return unwrap(await q, 'Could not load programmes') || []
}

export async function getProject(id) {
  return unwrap(
    await client().from('projects').select('*').eq('id', id).single(),
    'Could not load the programme'
  )
}

export async function createProject(project) {
  return unwrap(
    await client().from('projects').insert(project).select().single(),
    'Could not create the programme'
  )
}

export async function updateProject(id, patch) {
  return unwrap(
    await client()
      .from('projects')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id).select().single(),
    'Could not update the programme'
  )
}

export async function deleteProject(id) {
  unwrap(await client().from('projects').delete().eq('id', id), 'Could not delete the programme')
  return true
}

/* ── Sittings of the chamber ───────────────────────────────────── */

export async function listSessions({ limit = 50 } = {}) {
  return unwrap(
    await client().from('sessions').select('*').order('sat_on', { ascending: false }).limit(limit),
    'Could not load sittings'
  ) || []
}

export async function createSession(session) {
  return unwrap(
    await client().from('sessions').insert(session).select().single(),
    'Could not record the sitting'
  )
}

/* ── Reports of record ─────────────────────────────────────────── */

export async function listReports({ category, limit = 100 } = {}) {
  let q = client().from('reports').select('*').order('published_at', { ascending: false }).limit(limit)
  if (category && category !== 'All') q = q.eq('category', category)
  return unwrap(await q, 'Could not load reports') || []
}

export async function createReport(report) {
  return unwrap(
    await client().from('reports').insert(report).select().single(),
    'Could not lodge the report'
  )
}

export async function deleteReport(id) {
  unwrap(await client().from('reports').delete().eq('id', id), 'Could not delete the report')
  return true
}

/* ── Progress depositions ──────────────────────────────────────── */

export async function listProgress({ projectId, limit = 100 } = {}) {
  let q = client()
    .from('project_progress').select('*')
    .order('reported_on', { ascending: false }).limit(limit)
  if (projectId) q = q.eq('project_id', projectId)
  return unwrap(await q, 'Could not load progress reports') || []
}

export async function createProgress(entry) {
  const saved = unwrap(
    await client().from('project_progress').insert(entry).select().single(),
    'Could not record progress'
  )
  // Keep the programme's headline percentage in step with its latest report.
  if (entry.project_id && typeof entry.progress === 'number') {
    await updateProject(entry.project_id, { progress: entry.progress }).catch(() => {})
  }
  return saved
}

/* ── Treasury ──────────────────────────────────────────────────── */

export async function listBudgetLines(fiscalYear = 2026) {
  return unwrap(
    await client().from('budget_lines').select('*').eq('fiscal_year', fiscalYear).order('sort_order'),
    'Could not load the treasury position'
  ) || []
}

/* ── Headline figures ──────────────────────────────────────────── */

export async function listKpis() {
  return unwrap(
    await client().from('kpis').select('*').order('sort_order'),
    'Could not load headline figures'
  ) || []
}

/* ── Analytics ─────────────────────────────────────────────────── */

/** Returns rows shaped for Recharts: one object per period, one key per sector. */
export async function getSeries(series = 'quarterly') {
  const rows = unwrap(
    await client().from('analytics_series').select('*').eq('series', series).order('sort_order'),
    'Could not load the series'
  ) || []

  const byPeriod = new Map()
  for (const r of rows) {
    const key = r.period_label
    if (!byPeriod.has(key)) byPeriod.set(key, { period: key, _sort: r.sort_order })
    byPeriod.get(key)[r.sector] = Number(r.value)
  }
  return [...byPeriod.values()].sort((a, b) => a._sort - b._sort)
}

export async function listDivisionPerformance(fiscalYear = 2026) {
  return unwrap(
    await client()
      .from('division_performance').select('*')
      .eq('fiscal_year', fiscalYear).order('sort_order'),
    'Could not load divisional performance'
  ) || []
}

/* ── Alerts ────────────────────────────────────────────────────── */

export async function listAlerts({ includeResolved = false } = {}) {
  let q = client().from('alerts').select('*').order('created_at', { ascending: false })
  if (!includeResolved) q = q.eq('resolved', false)
  return unwrap(await q, 'Could not load alerts') || []
}

export async function resolveAlert(id) {
  return unwrap(
    await client().from('alerts').update({ resolved: true }).eq('id', id).select().single(),
    'Could not resolve the alert'
  )
}

/* ── Derived summaries ─────────────────────────────────────────── */

/**
 * Portfolio roll-up used by the Chamber overview and the assistant.
 * Computed from the programmes table so the figures always agree with
 * the roll rather than drifting from a hard-coded copy.
 */
export async function getPortfolioSummary() {
  const projects = await listProjects({ limit: 500 })
  const total = projects.length
  const completed = projects.filter((p) => p.status === 'completed').length
  const ongoing = projects.filter((p) => p.status === 'ongoing').length
  const budget = projects.reduce((s, p) => s + Number(p.budget_fcfa || 0), 0)
  const spent = projects.reduce((s, p) => s + Number(p.spent_fcfa || 0), 0)
  const avgProgress = total
    ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / total)
    : 0

  const byDivision = {}
  for (const p of projects) {
    const key = p.division || 'Unassigned'
    byDivision[key] ??= { division: key, count: 0, completed: 0, progressSum: 0 }
    byDivision[key].count += 1
    byDivision[key].progressSum += p.progress || 0
    if (p.status === 'completed') byDivision[key].completed += 1
  }

  const contractors = {}
  for (const p of projects) {
    const key = p.contractor || 'Unassigned'
    contractors[key] ??= { contractor: key, count: 0, completed: 0, progressSum: 0 }
    contractors[key].count += 1
    contractors[key].progressSum += p.progress || 0
    if (p.status === 'completed') contractors[key].completed += 1
  }

  return {
    projects,
    total,
    completed,
    ongoing,
    avgProgress,
    budget,
    spent,
    utilisation: budget ? Math.round((spent / budget) * 100) : 0,
    atRisk: projects.filter((p) => p.status === 'ongoing' && (p.progress || 0) < 50),
    byDivision: Object.values(byDivision).map((d) => ({
      ...d, avgProgress: Math.round(d.progressSum / d.count),
    })),
    contractors: Object.values(contractors).map((c) => ({
      ...c, avgProgress: Math.round(c.progressSum / c.count),
    })),
  }
}

/** Format a raw FCFA figure the way the chamber quotes it. */
export function formatFcfa(value, { compact = true } = {}) {
  const n = Number(value || 0)
  if (!compact) return `${n.toLocaleString('en-GB')} FCFA`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} B FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M FCFA`
  return `${n.toLocaleString('en-GB')} FCFA`
}

/* ── Progress photographs ──────────────────────────────────────── */

/**
 * Store a photograph attached to a progress deposition. Images share the
 * `documents` bucket under a `progress/` prefix so there is one place to
 * look for anything the Assembly has filed.
 */
export async function uploadProgressPhoto(file) {
  const c = client()
  const stamp = new Date().toISOString().slice(0, 10)
  const rand = Math.random().toString(36).slice(2, 8)
  const safe = (file.name || 'photo').replace(/[^\w.\-]+/g, '-').slice(-60)
  const path = `progress/${stamp}/${rand}-${safe}`

  const { error } = await c.storage.from('documents').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(`Could not upload the photograph: ${error.message}`)

  const { data } = c.storage.from('documents').getPublicUrl(path)
  return { path, url: data?.publicUrl || null }
}

export async function updateProgress(id, patch) {
  return unwrap(
    await client().from('project_progress').update(patch).eq('id', id).select().single(),
    'Could not update the progress report'
  )
}

export async function deleteProgress(id) {
  unwrap(await client().from('project_progress').delete().eq('id', id), 'Could not delete the progress report')
  return true
}

/* ── Grounding for the assistant ───────────────────────────────── */

/**
 * Build a compact, factual digest of the registry for the assistant.
 *
 * This is the assistant's only source of truth about the Assembly: it is
 * assembled fresh from the database on each load, so answers reflect what
 * the tables say right now rather than anything baked into a prompt. Kept
 * terse on purpose — it must fit comfortably in a system message.
 */
export async function buildRegistryContext() {
  const [divisions, summary, sessions, reports, budget, alerts, performance] =
    await Promise.all([
      listDivisions(),
      getPortfolioSummary(),
      listSessions({ limit: 8 }),
      listReports({ limit: 10 }),
      listBudgetLines(2026),
      listAlerts({ includeResolved: false }),
      listDivisionPerformance(2026),
    ])

  const execBy = Object.fromEntries(performance.map((p) => [p.division, Number(p.execution_rate)]))
  const countBy = Object.fromEntries(summary.byDivision.map((d) => [d.division, d.count]))
  const totalBudget = budget.reduce((s, b) => s + Number(b.allocated_fcfa), 0)

  const lines = []

  lines.push('## The institution')
  lines.push(
    'North West Regional Assembly of Cameroon, seated at Up Station, Bamenda. ' +
    'Created by Law No. 024 of 24 December 2019. Two houses: the House of ' +
    'Divisional Representatives (70 members, ten from each of seven divisions) ' +
    'and the House of Chiefs (20 traditional rulers). Contact: info@nwra.cm, ' +
    '+237 233 362 100.'
  )

  lines.push('\n## Divisions')
  for (const d of divisions) {
    lines.push(
      `- ${d.name} (seat: ${d.seat}); ${countBy[d.name] ?? 0} programmes; ` +
      `${Math.round((execBy[d.name] ?? 0) * 100)}% budget execution` +
      `${d.is_capital ? '; regional capital' : ''}`
    )
  }

  lines.push('\n## Treasury, FY 2026')
  lines.push(`Total appropriation: ${formatFcfa(totalBudget)}.`)
  for (const b of budget) {
    lines.push(`- ${b.category}: ${formatFcfa(b.allocated_fcfa)} (${((Number(b.allocated_fcfa) / totalBudget) * 100).toFixed(2)}%)`)
  }

  lines.push('\n## Programme portfolio')
  lines.push(
    `${summary.total} programmes on the roll: ${summary.completed} completed, ` +
    `${summary.ongoing} in session. Average progress ${summary.avgProgress}%. ` +
    `Committed ${formatFcfa(summary.budget)}, disbursed ${formatFcfa(summary.spent)} ` +
    `(${summary.utilisation}% utilisation). ${summary.atRisk.length} programme(s) below 50%.`
  )
  for (const p of summary.projects) {
    lines.push(
      `- "${p.name}" | ${p.division} | ${p.contractor} | ${p.category} | ` +
      `${p.status} ${p.progress}% | budget ${formatFcfa(p.budget_fcfa)} | ` +
      `spent ${formatFcfa(p.spent_fcfa)}` +
      `${p.risks ? ` | risk: ${p.risks}` : ''}`
    )
  }

  if (alerts.length) {
    lines.push('\n## Open alerts')
    for (const a of alerts) lines.push(`- [${a.level}] ${a.title}: ${a.message || ''} (${a.source || 'unattributed'})`)
  }

  if (sessions.length) {
    lines.push('\n## Recent sittings')
    for (const s of sessions) {
      lines.push(`- ${s.sat_on}: ${s.kind}, ${s.items} items. ${s.note || ''}`)
    }
  }

  if (reports.length) {
    lines.push('\n## Reports of record')
    for (const r of reports) {
      lines.push(`- "${r.title}" (${r.category}${r.period ? `, ${r.period}` : ''}) — ${r.summary || 'no summary'}`)
    }
  }

  return {
    text: lines.join('\n'),
    counts: {
      divisions: divisions.length,
      programmes: summary.total,
      sittings: sessions.length,
      reports: reports.length,
      alerts: alerts.length,
    },
  }
}
