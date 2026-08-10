// Thin wrappers around pp.auth.* — the ONLY PiPilot BaaS auth surface that exists. Do NOT
// invent Supabase/Firebase-style methods (signInWithGoogle, onAuthStateChange, …) — they throw
// "is not a function". See use_skill("baas-auth") for the full reference.
import { pp } from '../pipilot'

const NOT_WIRED = 'PiPilot BaaS is not provisioned yet for this app.'

/** OAuth (Google/Apple/X) — one broker popup, no provider config. Call from a user gesture. */
export async function signInWithOAuth() {
  if (!pp) throw new Error(NOT_WIRED)
  return pp.auth.signIn() // -> { user, accessToken }
}

export async function signInWithEmail(email, password) {
  if (!pp) throw new Error(NOT_WIRED)
  return pp.auth.signInWithPassword({ email, password }) // -> { user, token }
}

export async function signUpWithEmail(email, password, name) {
  if (!pp) throw new Error(NOT_WIRED)
  return pp.auth.signUpWithPassword({ email, password, name }) // -> { user, token, email_verification_sent }
}

export async function signOutUser() {
  if (!pp) return
  return pp.auth.signOut()
}

export async function getCurrentUser() {
  if (!pp) return null
  return pp.auth.getUser()
}

export function isSignedIn() {
  return !!pp && pp.auth.isSignedIn()
}

/** Call once on app load — completes an email-verification link if the URL carries one. */
export async function handleAuthRedirect() {
  if (!pp) return null
  return pp.auth.handleRedirect()
}
