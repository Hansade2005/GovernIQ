import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useQuery — the one loading pattern used across the registry pages.
 *
 * Takes a function returning a promise and gives back { data, loading,
 * error, refresh }. Guards against setting state after unmount and against
 * a slow earlier request overwriting a newer one.
 *
 * `deps` behaves like a useEffect dependency list: change them and the
 * query re-runs.
 */
export function useQuery(fn, deps = [], { initial = null } = {}) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fnRef = useRef(fn)
  fnRef.current = fn

  const runId = useRef(0)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const run = useCallback(async () => {
    const id = ++runId.current
    setLoading(true)
    try {
      const result = await fnRef.current()
      if (!alive.current || id !== runId.current) return
      setData(result)
      setError('')
    } catch (err) {
      if (!alive.current || id !== runId.current) return
      console.error('[registry]', err)
      setError(err.message || 'Something went wrong loading this view.')
    } finally {
      if (alive.current && id === runId.current) setLoading(false)
    }
  }, [])

  useEffect(() => { run() }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh: run, setData }
}
