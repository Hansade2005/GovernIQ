import { useContext } from 'react'
import { AuthContext } from './AuthContext'

/** const { user, loading, signInWithOAuth, signInWithEmail, signUpWithEmail, signOut } = useAuth() */
export function useAuth() {
  return useContext(AuthContext)
}
