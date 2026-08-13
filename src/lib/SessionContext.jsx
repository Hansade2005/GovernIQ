import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { resolveProfile, can } from './roles'

/**
 * Session — the signed-in member and what they may do.
 *
 * Authentication stays with PiPilot; this layer only resolves that identity
 * to a profile and a role, and exposes a single `allows(permission)` test
 * so no component has to reason about role strings.
 */

const SessionContext = createContext(null)

export function SessionProvider({ user, children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.email) { setProfile(null); setLoading(false); return }
    setLoading(true)
    const p = await resolveProfile(user.email)
    setProfile(p)
    setLoading(false)
  }, [user?.email])

  useEffect(() => { load() }, [load])

  const role = profile?.role || 'member'

  const value = {
    profile,
    role,
    loading,
    reload: load,
    allows: (permission) => can(role, permission),
    isSuperadmin: role === 'superadmin',
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
