import { supabase, isSupabaseConfigured } from './supabase'
import { announceReport } from './live'
import { updateProject } from './registry'

/**
 * Site reports — what is happening on the ground, as it happens.
 *
 * A supervisor standing at the site files a report from their phone: what
 * changed, how many are working, photographs, and the coordinates the
 * handset actually recorded. The report is written to the register first
 * and broadcast second, so the record is never lost to a dropped wire.
 */

export const SITE_CONDITIONS = {
  working:  { label: 'Work in progress', tone: 'sage' },
  halted:   { label: 'Work halted',      tone: 'kola' },
  blocked:  { label: 'Blocked',          tone: 'rust' },
  complete: { label: 'Complete',         tone: 'highland' },
}

const BUCKET = 'documents'

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('The site register is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, action) {
  if (error) throw new Error(`${action}: ${error.message}`)
  return data
}

export async function listSiteReports({ limit = 120, projectId, since } = {}) {
  let q = client()
    .from('site_reports').select('*')
    .order('reported_at', { ascending: false }).limit(limit)
  if (projectId) q = q.eq('project_id', projectId)
  if (since) q = q.gte('reported_at', since)
  return unwrap(await q, 'Could not load the site reports') || []
}

/** Upload one photograph taken at the site. */
export async function uploadSitePhoto(file) {
  const c = client()
  const stamp = new Date().toISOString().slice(0, 10)
  const rand = Math.random().toString(36).slice(2, 8)
  const safe = (file.name || 'photo.jpg').replace(/[^\w.\-]+/g, '-').slice(-50)
  const path = `sites/${stamp}/${rand}-${safe}`

  const { error } = await c.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(`Could not upload the photograph: ${error.message}`)
  return path
}

export function sitePhotoUrl(path) {
  if (!path || !supabase) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || null
}

/**
 * File a report: save it, keep the programme's headline percentage in
 * step, then put it on the wire.
 */
export async function fileSiteReport({
  projectId, projectName, division, progress, headline, note,
  workersOnSite, condition = 'working', coords, photoPaths = [], reportedBy,
}) {
  if (!projectId) throw new Error('Choose the programme you are reporting on.')
  if (!headline?.trim()) throw new Error('Say in one line what has changed.')

  const saved = unwrap(
    await client().from('site_reports').insert({
      project_id: projectId,
      project_name: projectName,
      division: division || null,
      progress: typeof progress === 'number' ? progress : null,
      headline: headline.trim(),
      note: note?.trim() || null,
      workers_on_site: typeof workersOnSite === 'number' ? workersOnSite : null,
      condition,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      accuracy_m: coords?.accuracy ?? null,
      photo_paths: photoPaths,
      reported_by: reportedBy || null,
    }).select().single(),
    'Could not file the report'
  )

  if (typeof progress === 'number') {
    await updateProject(projectId, { progress }).catch(() => {})
  }

  // Best-effort: the record is already safe if this fails.
  await announceReport({
    id: saved.id,
    project_id: saved.project_id,
    project_name: saved.project_name,
    division: saved.division,
    progress: saved.progress,
    headline: saved.headline,
    note: saved.note,
    condition: saved.condition,
    workers_on_site: saved.workers_on_site,
    latitude: saved.latitude,
    longitude: saved.longitude,
    photo_paths: saved.photo_paths,
    reported_by: saved.reported_by,
    reported_at: saved.reported_at,
  })

  return saved
}

/** Ask the handset where it is. Resolves to null rather than throwing. */
export function readPosition({ timeout = 12000 } = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 }
    )
  })
}

/** How the region stands right now, from the reports themselves. */
export function summariseLive(reports, projects = []) {
  const now = Date.now()
  const withinDay = reports.filter((r) => now - new Date(r.reported_at).getTime() < 864e5)

  // One report per programme — the newest.
  const latest = new Map()
  for (const r of reports) {
    if (!latest.has(r.project_id)) latest.set(r.project_id, r)
  }

  const active = projects.filter((p) => p.status === 'ongoing')
  const reportedToday = new Set(withinDay.map((r) => r.project_id))

  return {
    reportsToday: withinDay.length,
    sitesReportingToday: reportedToday.size,
    activeSites: active.length,
    silent: active.filter((p) => !reportedToday.has(p.id)),
    latest: [...latest.values()],
    trouble: [...latest.values()].filter((r) => r.condition === 'blocked' || r.condition === 'halted'),
    workersOnSite: withinDay.reduce((s, r) => s + (r.workers_on_site || 0), 0),
  }
}

/** "14 minutes ago" — the board is about recency, so say it plainly. */
export function sinceWhen(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
