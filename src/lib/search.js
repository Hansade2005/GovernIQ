import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Search across the whole registry.
 *
 * Every register is queried in parallel and the results are merged, so one
 * box answers "where is that?" without the member having to know which
 * page a thing lives on.
 *
 * Two decisions worth stating:
 *
 * · Searching runs in the database, not over rows already in memory, so a
 *   member finds a programme that is not on the page they happen to be on.
 * · Results are filtered by capacity before they are shown. A citizen must
 *   not learn that a minute exists by searching for it, so each source
 *   declares the permission it needs and sources the caller cannot read
 *   are never queried at all.
 */

const esc = (term) => term.replace(/[%,()]/g, ' ').trim()

/** Each source: what it needs, where it lives, and how a hit is described. */
const SOURCES = [
  {
    kind: 'Programme',
    need: 'programmes.read',
    href: () => '#/projects',
    query: (c, t) => c.from('projects')
      .select('id,name,division,contractor,status,progress')
      .or(`name.ilike.%${t}%,contractor.ilike.%${t}%,division.ilike.%${t}%,location.ilike.%${t}%`)
      .limit(6),
    shape: (r) => ({
      id: r.id,
      title: r.name,
      detail: [r.division && `${r.division} Division`, r.contractor, `${r.progress}%`]
        .filter(Boolean).join(' · '),
    }),
  },
  {
    kind: 'Document',
    need: 'registry.read',
    href: () => '#/documents',
    query: (c, t) => c.from('documents')
      .select('id,title,category,created_at')
      .or(`title.ilike.%${t}%,description.ilike.%${t}%,ocr_text.ilike.%${t}%`)
      .limit(5),
    shape: (r) => ({ id: r.id, title: r.title, detail: r.category }),
  },
  {
    kind: 'Minute',
    need: 'minutes.read',
    href: () => '#/minutes',
    query: (c, t) => c.from('minutes')
      .select('id,title,sat_on,kind,status')
      .or(`title.ilike.%${t}%,body.ilike.%${t}%,presided_by.ilike.%${t}%`)
      .limit(5),
    shape: (r) => ({
      id: r.id,
      title: r.title,
      detail: `${r.kind} · ${new Date(r.sat_on).toLocaleDateString('en-GB')}`,
    }),
  },
  {
    kind: 'Report',
    need: 'reports.read',
    href: () => '#/reports',
    query: (c, t) => c.from('reports')
      .select('id,title,category,period')
      .or(`title.ilike.%${t}%,summary.ilike.%${t}%,author.ilike.%${t}%`)
      .limit(5),
    shape: (r) => ({ id: r.id, title: r.title, detail: [r.category, r.period].filter(Boolean).join(' · ') }),
  },
  {
    kind: 'Feedback',
    need: 'feedback.read',
    href: () => '#/feedback',
    query: (c, t) => c.from('project_feedback')
      .select('id,subject,project_name,status,kind')
      .or(`subject.ilike.%${t}%,body.ilike.%${t}%,project_name.ilike.%${t}%`)
      .limit(5),
    shape: (r) => ({ id: r.id, title: r.subject, detail: `${r.project_name} · ${r.status}` }),
  },
  {
    kind: 'Site report',
    need: 'live.watch',
    href: () => '#/situation',
    query: (c, t) => c.from('site_reports')
      .select('id,headline,project_name,condition,reported_at')
      .or(`headline.ilike.%${t}%,note.ilike.%${t}%,project_name.ilike.%${t}%`)
      .limit(5),
    shape: (r) => ({ id: r.id, title: r.headline, detail: `${r.project_name} · ${r.condition}` }),
  },
  {
    kind: 'Division',
    need: 'programmes.read',
    href: () => '#/',
    query: (c, t) => c.from('divisions')
      .select('id,name,seat').or(`name.ilike.%${t}%,seat.ilike.%${t}%`).limit(4),
    shape: (r) => ({ id: r.id, title: `${r.name} Division`, detail: `Seat: ${r.seat}` }),
  },
]

/**
 * @param {string} term
 * @param {(permission:string)=>boolean} allows
 * @returns {Promise<Array<{kind,title,detail,href}>>}
 */
export async function searchEverything(term, allows = () => true) {
  const t = esc(term)
  if (!isSupabaseConfigured || !supabase || t.length < 2) return []

  const permitted = SOURCES.filter((s) => allows(s.need))

  const settled = await Promise.allSettled(
    permitted.map(async (s) => {
      const { data, error } = await s.query(supabase, t)
      if (error) throw error
      return (data || []).map((row) => ({ ...s.shape(row), kind: s.kind, href: s.href(row) }))
    })
  )

  // One failing register must not empty the whole result list.
  return settled.flatMap((r, i) => {
    if (r.status === 'fulfilled') return r.value
    console.warn(`[search] ${permitted[i].kind} unavailable:`, r.reason?.message)
    return []
  })
}
