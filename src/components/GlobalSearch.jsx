import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader, CornerDownLeft, X } from 'lucide-react'
import { useSession } from '@/lib/SessionContext'
import { searchEverything } from '@/lib/search'

/**
 * Search across the registry, from anywhere.
 *
 * Opens on ⌘K or Ctrl+K, searches as you type, and is navigable entirely
 * from the keyboard — a member looking something up mid-sitting should
 * not have to reach for a mouse.
 *
 * Each keystroke supersedes the last: a slow query that resolves after a
 * newer one is discarded, so the list never flickers back to stale
 * results for a term the member has already finished typing.
 */
export function GlobalSearch({ open, onClose }) {
  const { allows } = useSession()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [cursor, setCursor] = useState(0)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const runId = useRef(0)

  useEffect(() => {
    if (open) {
      setTerm(''); setResults([]); setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Debounced, and guarded against out-of-order responses.
  useEffect(() => {
    if (!open) return
    const t = term.trim()
    if (t.length < 2) { setResults([]); setBusy(false); return }

    setBusy(true)
    const id = ++runId.current
    const timer = setTimeout(async () => {
      try {
        const rows = await searchEverything(t, allows)
        if (id !== runId.current) return   // a newer keystroke already won
        setResults(rows); setCursor(0)
      } finally {
        if (id === runId.current) setBusy(false)
      }
    }, 220)

    return () => clearTimeout(timer)
  }, [term, open, allows])

  const go = useCallback((r) => {
    if (!r) return
    window.location.hash = r.href
    onClose()
  }, [onClose])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); go(results[cursor]) }
  }

  // Keep the highlighted row in view when moving by keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  const grouped = results.reduce((acc, r) => {
    (acc[r.kind] ??= []).push(r)
    return acc
  }, {})
  let flat = -1

  return (
    <div
      className="fixed inset-0 z-[70] bg-[color:var(--ink)]/45 flex items-start justify-center p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the registry"
        className="w-full max-w-2xl bg-[color:var(--card-bg)] border border-[color:var(--rule-firm)] rounded-[6px] shadow-[0_32px_80px_-24px_rgba(20,21,15,0.55)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Query */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[color:var(--rule)]">
          {busy
            ? <Loader size={16} className="text-[color:var(--sepia)] animate-spin flex-shrink-0" />
            : <Search size={16} className="text-[color:var(--sepia)] flex-shrink-0" />}
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search programmes, documents, minutes, reports…"
            className="flex-1 bg-transparent border-0 outline-none text-[0.9375rem] text-[color:var(--ink)] placeholder:text-[color:var(--sepia-soft)]"
            aria-label="Search the registry"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-[3px] text-[color:var(--sepia)] hover:text-[color:var(--ink)] hover:bg-[color:var(--linen)]"
            aria-label="Close search"
          >
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
          {term.trim().length < 2 ? (
            <p className="px-4 py-6 text-[color:var(--sepia)]">
              Type at least two letters. The search covers every register your
              capacity can open.
            </p>
          ) : !busy && results.length === 0 ? (
            <div className="px-4 py-6">
              <p className="font-medium text-[color:var(--ink)]">Nothing found for “{term.trim()}”</p>
              <p className="text-[color:var(--sepia)] mt-1 leading-relaxed">
                Try a contractor, a division, or part of a programme name.
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([kind, rows]) => (
              <div key={kind} className="py-1.5">
                <p className="eyebrow text-[0.5rem] px-4 py-1.5">{kind}</p>
                {rows.map((r) => {
                  flat += 1
                  const idx = flat
                  return (
                    <button
                      key={`${kind}-${r.id}`}
                      data-active={cursor === idx}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={() => go(r)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                        cursor === idx ? 'bg-[color:var(--linen)]' : ''
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.875rem] font-medium text-[color:var(--ink)] truncate">
                          {r.title}
                        </span>
                        {r.detail && (
                          <span className="block mono text-[0.65rem] text-[color:var(--sepia-soft)] truncate mt-0.5">
                            {r.detail}
                          </span>
                        )}
                      </span>
                      {cursor === idx && (
                        <CornerDownLeft size={13} className="text-[color:var(--sepia)] flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Keys */}
        <div className="flex items-center gap-4 px-4 h-9 border-t border-[color:var(--rule)] bg-[color:var(--paper)]">
          {[['↑↓', 'move'], ['↵', 'open'], ['esc', 'close']].map(([k, what]) => (
            <span key={k} className="flex items-center gap-1.5">
              <kbd className="mono text-[0.6rem] px-1 py-0.5 border border-[color:var(--rule)] rounded-[2px]">{k}</kbd>
              <span className="eyebrow text-[0.5rem]">{what}</span>
            </span>
          ))}
          {results.length > 0 && (
            <span className="eyebrow text-[0.5rem] ml-auto">{results.length} found</span>
          )}
        </div>
      </div>
    </div>
  )
}
