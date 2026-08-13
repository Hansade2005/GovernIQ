import { supabase, isSupabaseConfigured } from './supabase'

/**
 * The Assembly's own record — budgets, administrative accounts and every
 * deliberation taken in the House since inception in 2021.
 *
 * Two rules govern this register, and they are the whole reason it can be
 * shown to the public:
 *
 * · Every row names the document it came from. A figure without a source is
 *   an assertion; a figure with one is evidence, and a member can follow the
 *   link and check it during the sitting.
 * · Where a figure has never been published, the row still exists with a
 *   null amount and `figure_status: 'not_published'`. A visible gap tells
 *   the Assembly which minutes are missing from the record. An interpolated
 *   number would hide exactly that.
 */

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('The register is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data || []
}

/** Budget by fiscal year, initial vote and adjustment, oldest first. */
export async function listBudgetHistory() {
  return unwrap(
    await client().from('budget_history').select('*').order('fiscal_year').order('sort_order'),
    'Could not load the budget record'
  )
}

/** Administrative, management and stores accounts by fiscal year. */
export async function listAdministrativeAccounts() {
  return unwrap(
    await client().from('administrative_accounts').select('*').order('fiscal_year'),
    'Could not load the accounts record'
  )
}

/**
 * Deliberations and resolutions.
 *
 * `kind` filters to one or the other; `term` searches the text. Both run in
 * the database so the House record can grow past what one page can hold.
 */
export async function listDeliberations({ kind, term, limit = 400 } = {}) {
  let q = client().from('deliberations').select('*')
    .order('sat_from', { ascending: true })
    .order('kind', { ascending: false })
    .order('item_no', { ascending: true })
    .limit(limit)

  if (kind && kind !== 'All') q = q.eq('kind', kind)
  if (term && term.trim().length >= 2) {
    const t = term.replace(/[%,()]/g, ' ').trim()
    q = q.or(`title.ilike.%${t}%,session_label.ilike.%${t}%,theme.ilike.%${t}%`)
  }
  return unwrap(await q, 'Could not load the deliberations')
}

/**
 * One shape for the whole record, with the arithmetic done once here so
 * the page and the assistant cannot disagree about it.
 */
export async function getRecordSummary() {
  const [budget, accounts, delibs] = await Promise.all([
    listBudgetHistory(), listAdministrativeAccounts(), listDeliberations(),
  ])

  const priced = budget.filter((b) => b.amount_fcfa)
  const byYear = new Map()
  for (const b of priced) {
    // The adjustment supersedes the initial vote for the year's headline.
    const prev = byYear.get(b.fiscal_year)
    if (!prev || b.stage === 'Adjustment') byYear.set(b.fiscal_year, b)
  }
  const years = [...byYear.values()].sort((a, b) => a.fiscal_year - b.fiscal_year)
  const first = years[0]
  const last = years[years.length - 1]

  return {
    budget, accounts, delibs, years,
    gaps: budget.filter((b) => b.figure_status !== 'published').length,
    growth: first && last ? last.amount_fcfa / first.amount_fcfa : null,
    span: first && last ? [first.fiscal_year, last.fiscal_year] : null,
    counts: {
      deliberations: delibs.filter((d) => d.kind === 'deliberation').length,
      resolutions: delibs.filter((d) => d.kind === 'resolution').length,
      sessions: new Set(delibs.map((d) => d.session_label)).size,
      accountsAdopted: accounts.filter((a) => a.status !== 'Not published').length,
    },
  }
}

/** Compact FCFA for a column of figures that must line up. */
export function fcfa(n) {
  if (n == null) return '—'
  const v = Number(n)
  if (v >= 1e9) return `${(v / 1e9).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} M`
  return v.toLocaleString('en-GB')
}
