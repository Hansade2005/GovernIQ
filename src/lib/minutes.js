import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Minutes of the chamber.
 *
 * A record moves draft → for_adoption → adopted, and adoption is the point
 * of no return: an adopted minute is the Assembly's formal record of what
 * was decided, so it is locked against editing and can only be superseded
 * by a correcting minute at a later sitting.
 */

export const MINUTE_STATUSES = {
  draft:        { label: 'Draft',        description: 'Being written. Visible only to those who keep the minutes.' },
  for_adoption: { label: 'For adoption', description: 'Laid before the House and awaiting a vote.' },
  adopted:      { label: 'Adopted',      description: 'Carried by the House. The formal record; no longer editable.' },
  archived:     { label: 'Archived',     description: 'Superseded or withdrawn.' },
}

export const SITTING_KINDS = [
  'Full Assembly',
  'Committee Hearing',
  'Special Session',
  'House of Chiefs',
]

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('The minutes register is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, action) {
  if (error) throw new Error(`${action}: ${error.message}`)
  return data
}

export async function listMinutes({ status, limit = 100 } = {}) {
  let q = client().from('minutes').select('*').order('sat_on', { ascending: false }).limit(limit)
  if (status && status !== 'All') q = q.eq('status', status)
  return unwrap(await q, 'Could not load the minutes') || []
}

export async function getMinute(id) {
  return unwrap(
    await client().from('minutes').select('*').eq('id', id).single(),
    'Could not open the minute'
  )
}

export async function createMinute(entry) {
  return unwrap(
    await client().from('minutes').insert({ ...entry, status: entry.status || 'draft' }).select().single(),
    'Could not open the minute'
  )
}

/** Adopted minutes are the formal record and are not editable. */
export async function updateMinute(id, patch) {
  const current = await getMinute(id)
  if (current.status === 'adopted') {
    throw new Error(
      'This minute has been adopted by the House and cannot be edited. ' +
      'Record a correcting minute at the next sitting instead.'
    )
  }
  return unwrap(
    await client().from('minutes')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id).select().single(),
    'Could not save the minute'
  )
}

/** Lay a draft before the House. */
export async function layBeforeHouse(id) {
  return unwrap(
    await client().from('minutes')
      .update({ status: 'for_adoption', updated_at: new Date().toISOString() })
      .eq('id', id).select().single(),
    'Could not lay the minute before the House'
  )
}

/** Record that the House carried the minute. */
export async function adoptMinute(id, { adoptedOn } = {}) {
  return unwrap(
    await client().from('minutes')
      .update({
        status: 'adopted',
        adopted_on: adoptedOn || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id).select().single(),
    'Could not record the adoption'
  )
}

export async function archiveMinute(id) {
  return unwrap(
    await client().from('minutes')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id).select().single(),
    'Could not archive the minute'
  )
}

export async function deleteMinute(id) {
  const current = await getMinute(id)
  if (current.status === 'adopted') {
    throw new Error('An adopted minute is the formal record and cannot be deleted.')
  }
  unwrap(await client().from('minutes').delete().eq('id', id), 'Could not delete the minute')
  return true
}

/** Counts for the register's summary tiles. */
export function summarise(rows) {
  return {
    total: rows.length,
    draft: rows.filter((r) => r.status === 'draft').length,
    forAdoption: rows.filter((r) => r.status === 'for_adoption').length,
    adopted: rows.filter((r) => r.status === 'adopted').length,
    resolutions: rows.reduce((s, r) => s + (Array.isArray(r.resolutions) ? r.resolutions.length : 0), 0),
  }
}
