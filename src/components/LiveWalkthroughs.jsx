import { useState, useEffect, useRef, useCallback } from 'react'
import { Video, Maximize2, X, Radio } from 'lucide-react'
import { Card } from './Card'
import { watchLobby, watchStream, STALE_AFTER_MS } from '@/lib/stream'

/**
 * Live walkthroughs, as the President sees them.
 *
 * A broadcast announces itself in the lobby; this panel then opens a
 * listener per stream and paints whatever frame arrived last.
 *
 * Two things the lobby cannot tell us, handled here:
 *
 *   · A broadcaster whose phone dies never sends "ended". Each stream is
 *     therefore aged out when no frame has arrived for a while, so the
 *     board never shows a dead picture as though it were live.
 *   · A board that joins after a broadcast began missed the announcement.
 *     Frames still arrive on the stream channel, so any stream the lobby
 *     later mentions is picked up from its next frame onward.
 */
export function LiveWalkthroughs() {
  const [streams, setStreams] = useState({}) // id -> { about, frame, lastAt }
  const [expanded, setExpanded] = useState(null)
  const listeners = useRef(new Map())

  const onFrame = useCallback((id, frame) => {
    setStreams((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      return { ...prev, [id]: { ...existing, frame, lastAt: Date.now() } }
    })
  }, [])

  const addStream = useCallback((m) => {
    setStreams((prev) => {
      if (prev[m.id]) return prev
      return { ...prev, [m.id]: { about: m, frame: null, lastAt: Date.now() } }
    })
    if (!listeners.current.has(m.id)) {
      listeners.current.set(m.id, watchStream(m.id, (f) => onFrame(m.id, f)))
    }
  }, [onFrame])

  const dropStream = useCallback((id) => {
    listeners.current.get(id)?.()
    listeners.current.delete(id)
    setStreams((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setExpanded((e) => (e === id ? null : e))
  }, [])

  useEffect(() => {
    const stop = watchLobby({
      onStarted: addStream,
      onEnded: (m) => dropStream(m.id),
    })
    return () => {
      stop()
      listeners.current.forEach((off) => off())
      listeners.current.clear()
    }
  }, [addStream, dropStream])

  // Age out anything that has gone quiet — a dead phone never says goodbye.
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      Object.entries(streams).forEach(([id, s]) => {
        if (now - s.lastAt > STALE_AFTER_MS) dropStream(id)
      })
    }, 5000)
    return () => clearInterval(t)
  }, [streams, dropStream])

  const list = Object.entries(streams)
  if (list.length === 0) return null

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Video size={14} className="text-[color:var(--rust)]" />
          <p className="eyebrow">Live from the sites</p>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[color:var(--rust)] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="eyebrow text-[0.5rem] text-white">
              {list.length} walking the site
            </span>
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(([id, s]) => (
            <Card key={id} flush className="overflow-hidden">
              <button
                onClick={() => setExpanded(id)}
                className="relative block w-full aspect-video bg-[color:var(--ink)] group"
                aria-label={`Enlarge the walkthrough at ${s.about.projectName}`}
              >
                {s.frame ? (
                  <img src={s.frame.data} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Radio size={20} className="text-[color:var(--sepia-soft)] animate-pulse" />
                  </span>
                )}
                <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[color:var(--rust)] text-white">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  <span className="mono text-[0.55rem]">LIVE</span>
                </span>
                {s.about.simulated && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[2px] bg-[color:var(--ink)]/80 text-white mono text-[0.5rem]">
                    REHEARSAL
                  </span>
                )}
                <span className="absolute bottom-2 right-2 p-1 rounded-[2px] bg-[color:var(--ink)]/70 text-white opacity-0 group-hover:opacity-100 transition">
                  <Maximize2 size={12} />
                </span>
              </button>

              <div className="px-3 py-2.5">
                <p className="text-[0.8125rem] font-semibold leading-tight truncate">
                  {s.about.projectName || 'A site'}
                </p>
                <p className="mono text-[0.65rem] text-[color:var(--sepia-soft)] mt-1 truncate">
                  {s.about.division ? `${s.about.division} · ` : ''}{s.about.supervisor}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Enlarged */}
      {expanded && streams[expanded] && (
        <div
          className="fixed inset-0 z-[60] bg-[color:var(--ink)]/90 flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">
                  {streams[expanded].about.projectName}
                </p>
                <p className="mono text-[0.7rem] text-white/60 mt-0.5 truncate">
                  {streams[expanded].about.division} · {streams[expanded].about.supervisor}
                </p>
              </div>
              <button
                onClick={() => setExpanded(null)}
                className="p-2 rounded-[3px] text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-[4px] overflow-hidden">
              {streams[expanded].frame ? (
                <img src={streams[expanded].frame.data} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Radio size={24} className="text-white/40 animate-pulse" />
                </div>
              )}
            </div>
            <p className="eyebrow text-[0.5rem] text-white/50 mt-2">
              A picture every second or two, sent live from the site. Nothing is recorded.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
