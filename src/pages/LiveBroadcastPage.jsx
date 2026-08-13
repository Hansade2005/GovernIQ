import { useState, useRef, useEffect, useCallback } from 'react'
import { Video, VideoOff, Radio, AlertTriangle, Loader, Signal } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Label } from '@/components/Input'
import { Loading, LoadFailure } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { useSession } from '@/lib/SessionContext'
import { listProjects } from '@/lib/registry'
import { openCamera, startBroadcast, formatBytes } from '@/lib/stream'

/**
 * Live walkthrough — the supervisor's end.
 *
 * A frame every second or two rather than true video: it needs no media
 * server, no TURN relay, and it survives a 3G uplink. The page is candid
 * about what is being sent — frame size, rate, and any frame skipped —
 * because the person holding the phone is also paying for the data.
 */

const PACES = [
  { ms: 1000, label: 'Every second', hint: 'Smoothest. Heaviest on data.' },
  { ms: 2000, label: 'Every 2 seconds', hint: 'A good balance on mobile data.' },
  { ms: 5000, label: 'Every 5 seconds', hint: 'Very light. For a poor signal.' },
]

export function LiveBroadcastPage() {
  const { profile } = useSession()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const broadcastRef = useRef(null)

  const [projectId, setProjectId] = useState('')
  const [pace, setPace] = useState(2000)
  const [cameraOn, setCameraOn] = useState(false)
  const [onAir, setOnAir] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [stat, setStat] = useState(null)
  const [sentFrames, setSentFrames] = useState(0)
  const [sentBytes, setSentBytes] = useState(0)
  const [skipped, setSkipped] = useState(0)

  const { data, loading, error: loadError, refresh } =
    useQuery(() => listProjects({ limit: 300 }), [])

  const projects = (data ?? []).filter((p) => p.status === 'ongoing')
  const chosen = projects.find((p) => p.id === projectId)

  /* The camera must be released on unmount, or it stays on after the page
     is left — a light still burning on someone's phone. */
  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => {
    broadcastRef.current?.stop()
    closeCamera()
  }, [closeCamera])

  // Keep the screen awake while on air; a locked phone stops the camera.
  useEffect(() => {
    if (!onAir || !navigator.wakeLock) return
    let lock
    navigator.wakeLock.request('screen').then((l) => { lock = l }).catch(() => {})
    return () => { lock?.release?.().catch(() => {}) }
  }, [onAir])

  const enableCamera = async () => {
    setBusy(true); setError('')
    try {
      const s = await openCamera()
      streamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play().catch(() => {})
      }
      setCameraOn(true)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const goLive = async () => {
    if (!projectId) { setError('Choose the site you are showing.'); return }
    setBusy(true); setError('')
    try {
      broadcastRef.current = await startBroadcast({
        mediaStream: streamRef.current,
        intervalMs: pace,
        about: {
          projectId,
          projectName: chosen?.name,
          division: chosen?.division,
          supervisor: profile?.full_name || profile?.email || 'Site supervisor',
        },
        onStat: (s) => {
          setStat(s)
          if (s.skipped) setSkipped((n) => n + 1)
          else if (!s.error) {
            setSentFrames((n) => n + 1)
            setSentBytes((n) => n + (s.bytes || 0))
          }
        },
      })
      setOnAir(true)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const stop = async () => {
    setBusy(true)
    await broadcastRef.current?.stop()
    broadcastRef.current = null
    setOnAir(false); setBusy(false)
  }

  if (loading && !data) return <Loading label="Opening the site list" />
  if (loadError && !data) return <LoadFailure error={loadError} onRetry={refresh} />

  return (
    <div className="stagger space-y-6 max-w-2xl">
      <PageHeader
        eyebrow="Live walkthrough"
        title="Show the site"
        description="A picture every second or two, straight to the President's board. No recording is kept."
        actions={onAir && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[color:var(--rust)] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="eyebrow text-[0.5rem] text-white">On air</span>
          </span>
        )}
      />

      {error && (
        <div className="px-3 py-2 rounded-[4px] border border-[color:var(--rust)] text-[color:var(--rust)]">
          {error}
        </div>
      )}

      {/* Viewfinder */}
      <Card flush className="overflow-hidden">
        <div className="relative bg-[color:var(--ink)] aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
          />
          {!cameraOn && (
            <div className="text-center px-6">
              <VideoOff size={26} className="mx-auto text-[color:var(--sepia-soft)] mb-3" />
              <p className="eyebrow text-[0.55rem] text-[color:var(--sepia-soft)]">Camera off</p>
            </div>
          )}
          {onAir && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[color:var(--rust)] text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="mono text-[0.6rem]">LIVE</span>
            </span>
          )}
        </div>
      </Card>

      {/* Setup */}
      <Card>
        <div className="space-y-4">
          <div>
            <Label>Which site are you showing?</Label>
            <select
              className="field text-base py-2.5"
              value={projectId}
              disabled={onAir}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Choose a programme…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.division}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>How often to send a picture</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PACES.map((p) => (
                <button
                  key={p.ms}
                  type="button"
                  disabled={onAir}
                  onClick={() => setPace(p.ms)}
                  className={`px-3 py-2.5 rounded-[4px] border text-left transition disabled:opacity-50 ${
                    pace === p.ms
                      ? 'bg-[color:var(--highland)] text-white border-[color:var(--highland)]'
                      : 'border-[color:var(--rule)] hover:border-[color:var(--ink)]'
                  }`}
                >
                  <span className="block text-[0.8125rem] font-medium">{p.label}</span>
                  <span className={`block text-[0.65rem] mt-0.5 leading-snug ${pace === p.ms ? 'text-white/75' : 'text-[color:var(--sepia)]'}`}>
                    {p.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {!cameraOn ? (
              <Button onClick={enableCamera} disabled={busy} className="py-3 text-base">
                {busy ? <Loader size={15} className="animate-spin" /> : <Video size={15} />}
                Turn on the camera
              </Button>
            ) : !onAir ? (
              <>
                <Button onClick={goLive} disabled={busy} className="py-3 text-base">
                  <Radio size={15} /> Go live
                </Button>
                <Button variant="outline" onClick={closeCamera} disabled={busy}>
                  Turn off the camera
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={stop} disabled={busy} className="py-3 text-base">
                <VideoOff size={15} /> Stop the walkthrough
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* What is actually going out — the supervisor is paying for it */}
      {onAir && (
        <Card>
          <div className="panel-head">
            <div className="flex items-center gap-2">
              <Signal size={13} className="text-[color:var(--sage)]" />
              <p className="eyebrow">Going out</p>
            </div>
            <span className="mono text-[0.7rem] text-[color:var(--sepia)]">
              {formatBytes(sentBytes)} sent
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="eyebrow text-[0.55rem]">Pictures sent</p>
              <p className="figure text-2xl mt-1.5 figure-highland">{sentFrames}</p>
            </div>
            <div>
              <p className="eyebrow text-[0.55rem]">Each picture</p>
              <p className="figure text-2xl mt-1.5">{formatBytes(stat?.bytes)}</p>
            </div>
            <div>
              <p className="eyebrow text-[0.55rem]">Quality now</p>
              <p className="mono text-[0.8rem] mt-2.5">
                {stat?.width ? `${stat.width}px` : '—'}
              </p>
            </div>
          </div>

          {skipped > 0 && (
            <p className="flex items-start gap-2 mt-4 pt-3 border-t border-[color:var(--rule)] text-[color:var(--brass-ink)]">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                {skipped} picture{skipped === 1 ? '' : 's'} skipped — too large for the wire even
                at the lowest setting. The walkthrough continues; the board simply misses those moments.
              </span>
            </p>
          )}

          <p className="eyebrow text-[0.5rem] mt-4 leading-relaxed">
            Pictures shrink automatically if the wire cannot carry them. Nothing is recorded —
            the board sees only what is sent while you are live.
          </p>
        </Card>
      )}
    </div>
  )
}
