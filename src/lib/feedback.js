import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Feedback from the public on the Assembly's works.
 *
 * A citizen writes about a programme they can see being built in their
 * division; an officer acknowledges it, answers it, or explains why it
 * cannot be acted on. The status is the citizen's assurance that the
 * message did not vanish, so every transition is recorded with who made
 * it and when.
 */

export const FEEDBACK_KINDS = {
  observation:  { label: 'Observation',  hint: 'Something you have seen at the site.' },
  concern:      { label: 'Concern',      hint: 'Something that appears to be going wrong.' },
  commendation: { label: 'Commendation', hint: 'Work that has gone well and should be recognised.' },
  request:      { label: 'Request',      hint: 'Something you would like the Assembly to consider.' },
}

export const FEEDBACK_STATUSES = {
  submitted:    { label: 'Submitted',    description: 'Received and awaiting an officer.' },
  acknowledged: { label: 'Acknowledged', description: 'An officer has read it and is looking into it.' },
  addressed:    { label: 'Addressed',    description: 'Answered, with the Assembly’s reply recorded.' },
  declined:     { label: 'Not actioned', description: 'Considered, with the reason recorded.' },
}

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('The feedback register is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, action) {
  if (error) throw new Error(`${action}: ${error.message}`)
  return data
}

/**
 * List feedback. `submittedBy` narrows to one person's own messages, which
 * is what a citizen sees — their own record, not the whole postbag.
 */
export async function listFeedback({ status, projectId, submittedBy, limit = 200 } = {}) {
  let q = client()
    .from('project_feedback').select('*')
    .order('created_at', { ascending: false }).limit(limit)

  if (status && status !== 'All') q = q.eq('status', status)
  if (projectId) q = q.eq('project_id', projectId)
  if (submittedBy) q = q.eq('contact', submittedBy)

  return unwrap(await q, 'Could not load the feedback') || []
}

export async function submitFeedback({
  projectId, projectName, division, kind = 'observation',
  rating, subject, body, submittedBy, contact, isAnonymous = false,
}) {
  if (!subject?.trim()) throw new Error('Give your message a subject.')
  if (!body?.trim()) throw new Error('Write your message before sending it.')
  if (!projectId) throw new Error('Choose the programme your message is about.')

  return unwrap(
    await client().from('project_feedback').insert({
      project_id: projectId,
      project_name: projectName,
      division: division || null,
      kind,
      rating: rating || null,
      subject: subject.trim(),
      body: body.trim(),
      submitted_by: isAnonymous ? 'Anonymous' : (submittedBy || 'Anonymous'),
      contact: contact || null,
      is_anonymous: isAnonymous,
      status: 'submitted',
    }).select().single(),
    'Could not send your message'
  )
}

/** Record that an officer has read it. */
export async function acknowledgeFeedback(id, officer) {
  return unwrap(
    await client().from('project_feedback')
      .update({ status: 'acknowledged', responded_by: officer || null })
      .eq('id', id).select().single(),
    'Could not acknowledge the message'
  )
}

/** Answer it, either by acting on it or by explaining why not. */
export async function respondToFeedback(id, { response, officer, decline = false }) {
  if (!response?.trim()) throw new Error('Write a reply before recording it.')
  return unwrap(
    await client().from('project_feedback')
      .update({
        status: decline ? 'declined' : 'addressed',
        response: response.trim(),
        responded_by: officer || null,
        responded_on: new Date().toISOString(),
      })
      .eq('id', id).select().single(),
    'Could not record the reply'
  )
}

export async function deleteFeedback(id) {
  unwrap(await client().from('project_feedback').delete().eq('id', id), 'Could not delete the message')
  return true
}

/** Counts and standing for the register's summary tiles. */
export function summarise(rows) {
  const rated = rows.filter((r) => r.rating)
  return {
    total: rows.length,
    awaiting: rows.filter((r) => r.status === 'submitted').length,
    acknowledged: rows.filter((r) => r.status === 'acknowledged').length,
    addressed: rows.filter((r) => r.status === 'addressed').length,
    concerns: rows.filter((r) => r.kind === 'concern').length,
    averageRating: rated.length
      ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1)
      : null,
  }
}
