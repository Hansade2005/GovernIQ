import { createContext, useContext, useEffect, useState, useCallback } from 'react'

/**
 * Theme — light, dark, or follow the system.
 *
 * The resolved theme is written to <html class="dark"> because the CSS
 * uses `@custom-variant dark (&:is(.dark *))`. Preference is stored in
 * localStorage under "theme"; the literal "system" means "keep tracking
 * the OS setting", which we listen for and re-resolve on change.
 *
 * `applyStoredTheme()` is also called from main.jsx before React mounts
 * so the first paint is already the right colour.
 */

const STORAGE_KEY = 'theme'
const ThemeContext = createContext(null)

function prefersDark() {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function readPreference() {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') return preference
  return prefersDark() ? 'dark' : 'light'
}

function paint(resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

/** Run before React mounts to avoid a flash of the wrong theme. */
export function applyStoredTheme() {
  paint(resolveTheme(readPreference()))
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference)
  const [resolved, setResolved] = useState(() => resolveTheme(readPreference()))

  // Apply whenever the preference changes.
  useEffect(() => {
    const next = resolveTheme(preference)
    setResolved(next)
    paint(next)
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  // While following the system, react to the OS flipping.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = prefersDark() ? 'dark' : 'light'
      setResolved(next)
      paint(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next) => setPreferenceState(next), [])
  const toggle = useCallback(
    () => setPreferenceState(resolveTheme(readPreference()) === 'dark' ? 'light' : 'dark'),
    []
  )

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
