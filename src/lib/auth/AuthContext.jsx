import { createContext, useEffect, useState } from 'react'
import {
  getCurrentUser, handleAuthRedirect, isSignedIn,
  signInWithEmail, signInWithOAuth, signOutUser, signUpWithEmail,
} from './authService'

export const AuthContext = createContext({
  user: null,
  loading: true,
  isSignedIn: false,
  signInWithOAuth: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
})

/** Wrap the app once (e.g. in main.jsx or App.jsx) — never per-page. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await handleAuthRedirect().catch(() => null) // consume a pending email-verify link, if any
      const u = await getCurrentUser().catch(() => null)
      
      // Production mode: require authentication, no demo fallback
      if (!cancelled) { setUser(u || null); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  const value = {
    user,
    loading,
    isSignedIn: isSignedIn(),
    signInWithOAuth: async () => { const r = await signInWithOAuth(); setUser(r.user); return r },
    signInWithEmail: async (email, password) => { const r = await signInWithEmail(email, password); setUser(r.user); return r },
    signUpWithEmail: async (email, password, name) => { const r = await signUpWithEmail(email, password, name); if (r.token) setUser(r.user); return r },
    signOut: async () => { await signOutUser(); setUser(null) },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
