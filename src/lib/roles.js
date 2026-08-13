import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Roles and permissions.
 *
 * A member's role lives in `public.profiles`, keyed by the email they
 * signed in with. Two things follow from that:
 *
 * · A standing superadmin allowlist is compiled in below. Roles are stored
 *   in a table the app itself can edit, so a bad edit could otherwise lock
 *   every administrator out with no way back in. These addresses are always
 *   superadmin regardless of what the table says, and cannot be demoted
 *   from the interface.
 *
 * · Someone signing in without a profile row gets 'member' — read-only.
 *   Access is granted deliberately by an administrator, never by default.
 *
 * This is authorisation for a demonstration platform, enforced in the
 * client. It decides what the interface offers, not what the database
 * permits; the tables are still reachable with the publishable key. Before
 * this carries real confidential records, the same rules need to move into
 * row-level security policies keyed on an authenticated session.
 */

/** How long to wait for a profile before letting someone in read-only. */
const PROFILE_TIMEOUT_MS = 6000

/** Always superadmin, whatever the table says. */
export const STANDING_SUPERADMINS = [
  'hansade2005@gmail.com',
]

export const ROLES = {
  superadmin: {
    label: 'Superadmin',
    description: 'Full control, including who else may sign in and in what capacity.',
    rank: 100,
  },
  president: {
    label: 'President of the Assembly',
    description: 'Watches the region live and reads every register.',
    rank: 90,
  },
  admin: {
    label: 'Administrator',
    description: 'Manages every register except the roll of users.',
    rank: 80,
  },
  clerk: {
    label: 'Clerk of the Assembly',
    description: 'Records, edits, and lays the minutes of every sitting.',
    rank: 60,
  },
  finance: {
    label: 'Finance Officer',
    description: 'Keeps the treasury lines and the reports of record.',
    rank: 60,
  },
  programmes: {
    label: 'Programmes Officer',
    description: 'Keeps the roll of public works and its execution.',
    rank: 60,
  },
  member: {
    label: 'Honourable Member',
    description: 'Reads the registry and puts questions to the assistant.',
    rank: 20,
  },
  field: {
    label: 'Site Supervisor',
    description: 'Files reports from the sites. Sees the works, nothing else.',
    rank: 15,
  },
  citizen: {
    label: 'Citizen',
    description: 'Follows the public works and gives feedback on them. Sees no internal register.',
    rank: 10,
  },
}

export const ROLE_KEYS = Object.keys(ROLES)

/**
 * What each role may do. Every gate in the interface names one of these
 * rather than testing role strings, so adding a role is one edit here.
 */
const GRANTS = {
  superadmin: ['*'],
  president: [
    'registry.read', 'minutes.read',
    'programmes.read', 'treasury.read', 'reports.read',
    'command.read', 'feedback.read',
    'live.watch',
  ],
  admin: [
    'registry.read', 'registry.write',
    'minutes.read', 'minutes.write', 'minutes.adopt',
    'programmes.read', 'programmes.write',
    'treasury.read', 'treasury.write',
    'reports.read', 'reports.write',
    'command.read',
    'feedback.submit', 'feedback.read', 'feedback.respond',
    'live.watch', 'live.report',
  ],
  clerk: [
    'registry.read', 'registry.write',
    'minutes.read', 'minutes.write', 'minutes.adopt',
    'programmes.read', 'treasury.read', 'reports.read', 'command.read',
    'feedback.read',
  ],
  finance: [
    'registry.read',
    'minutes.read',
    'programmes.read',
    'treasury.read', 'treasury.write',
    'reports.read', 'reports.write',
    'command.read',
    'feedback.read',
  ],
  programmes: [
    'registry.read',
    'minutes.read',
    'programmes.read', 'programmes.write',
    'treasury.read', 'reports.read', 'command.read',
    'feedback.read', 'feedback.respond',
    'live.watch', 'live.report',
  ],
  member: [
    'registry.read', 'minutes.read', 'programmes.read',
    'treasury.read', 'reports.read',
    'feedback.read', 'live.watch',
  ],
  // A citizen follows the works and speaks about them. Nothing internal:
  // no treasury, no minutes, no registry, no command centre.
  // A supervisor files from the site and sees the works they report on.
  field: [
    'programmes.read',
    'live.report', 'live.watch',
  ],
  citizen: [
    'programmes.read',
    'feedback.submit', 'feedback.read.own',
  ],
}

/** Does this role carry this permission? */
export function can(role, permission) {
  const grants = GRANTS[role] || GRANTS.member
  return grants.includes('*') || grants.includes(permission)
}

const normalise = (email) => String(email || '').trim().toLowerCase()

export function isStandingSuperadmin(email) {
  return STANDING_SUPERADMINS.includes(normalise(email))
}

/**
 * Resolve a signed-in email to a profile. Never throws: a registry that is
 * briefly unreachable should leave someone with read-only access, not a
 * broken application.
 */
export async function resolveProfile(email) {
  const addr = normalise(email)
  const standing = isStandingSuperadmin(addr)

  const fallback = {
    email: addr,
    full_name: null,
    role: standing ? 'superadmin' : 'member',
    title: standing ? 'Platform Administrator' : null,
    division: null,
    is_active: true,
    standing,
  }

  if (!addr || !isSupabaseConfigured || !supabase) return fallback

  try {
    // Never let a slow or unreachable registry strand someone on the
    // loading screen: after a few seconds, fall back to read-only and let
    // them in. The interface re-resolves on demand.
    const { data, error } = await Promise.race([
      supabase.from('profiles').select('*').eq('email', addr).maybeSingle(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('the registry did not answer in time')), PROFILE_TIMEOUT_MS)
      ),
    ])
    if (error) throw error
    if (!data) return fallback
    return {
      ...data,
      // The allowlist always wins, so a bad edit cannot lock the owner out.
      role: standing ? 'superadmin' : data.role,
      standing,
    }
  } catch (err) {
    console.warn('[roles] could not read the profile, defaulting to read-only:', err.message)
    return fallback
  }
}

/* ── Roll of users (superadmin only in the interface) ──────────── */

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles').select('*').order('role').order('email')
  if (error) throw new Error(`Could not load the roll of users: ${error.message}`)
  return (data || []).map((p) => ({ ...p, standing: isStandingSuperadmin(p.email) }))
}

export async function upsertProfile({ email, full_name, role, title, division, is_active = true }) {
  const addr = normalise(email)
  if (!addr) throw new Error('An email address is required.')
  if (!ROLE_KEYS.includes(role)) throw new Error(`"${role}" is not a role.`)

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      { email: addr, full_name, role, title, division, is_active, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    .select().single()
  if (error) throw new Error(`Could not save the user: ${error.message}`)
  return data
}

export async function setRole(email, role) {
  if (isStandingSuperadmin(email)) {
    throw new Error('This account is a standing superadmin and cannot be changed here.')
  }
  if (!ROLE_KEYS.includes(role)) throw new Error(`"${role}" is not a role.`)
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('email', normalise(email)).select().single()
  if (error) throw new Error(`Could not change the role: ${error.message}`)
  return data
}

export async function removeProfile(email) {
  if (isStandingSuperadmin(email)) {
    throw new Error('This account is a standing superadmin and cannot be removed.')
  }
  const { error } = await supabase.from('profiles').delete().eq('email', normalise(email))
  if (error) throw new Error(`Could not remove the user: ${error.message}`)
  return true
}
