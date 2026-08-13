import { pp } from './pipilot'

/**
 * Snapshot streaming — "slow video" from a site, over the message wire.
 *
 * There is no media server here and no camera hardware. The supervisor's
 * phone captures a frame every second or two, encodes it small, and
 * publishes it on a channel the President's board is listening to.
 *
 * THE CONSTRAINT THAT SHAPES EVERYTHING
 *
 * Measured against the live service: a channel message carries about 64 KB
 * reliably. At 128 KB and above `publish` still returns `ok: true,
 * delivered: 1` but the receiver never gets it — it fails SILENTLY. There
 * is no error to catch, so an oversized frame simply disappears and the
 * viewer sees a frozen picture with no explanation.
 *
 * Everything below exists to stay well inside that ceiling:
 *
 *   · Frames are encoded to a byte budget, not to a fixed size. If a frame
 *     comes out too large it is re-encoded smaller before it is sent, and
 *     the smaller settings are kept for subsequent frames rather than
 *     rediscovered each time.
 *   · A frame is never published until the previous publish has resolved,
 *     so a slow uplink drops frames instead of queueing them.
 *   · If a frame cannot be squeezed under budget it is skipped, and the
 *     broadcaster is told, rather than sent into the void.
 *
 * Two channels:
 *   governiq:live-lobby        who is broadcasting, and when they stop
 *   governiq:stream:<id>       the frames for one broadcast
 */

export const LOBBY = 'governiq:live-lobby'
export const streamChannel = (id) => `governiq:stream:${id}`

/** Base64 payload ceiling. 64 KB measured; this leaves room for the envelope. */
const FRAME_BUDGET_BYTES = 44_000

/** A viewer drops a stream from the roster if nothing arrives for this long. */
export const STALE_AFTER_MS = 20_000

/**
 * Starting size, chosen from measurement rather than optimism.
 *
 * Encoded worst-case frames (random noise, the hardest thing for JPEG) at
 * the budget above:
 *
 *      640px  q0.55  →  169 KB   far over
 *      480px  q0.45  →   83 KB   over
 *      320px  q0.45  →   37 KB   fits
 *      240px  q0.45  →   22 KB   fits
 *
 * A construction site — rubble, foliage, texture — sits between noise and
 * a flat wall, so 480px is the honest opening bid: often fine, and one
 * step from fitting when it is not. Starting at 640 would mean half a
 * dozen re-encodes on the first frame of every broadcast, on a phone.
 */
const DEFAULTS = { width: 480, quality: 0.45 }
const FLOOR = { width: 240, quality: 0.3 }
const CEILING = { width: 640, quality: 0.6 }

/** Room to spare before we try a larger picture again. */
const COMFORTABLE = 0.55
/** Consecutive comfortable frames before stepping quality back up. */
const RECOVER_AFTER = 6

function newId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/* ── Broadcasting ──────────────────────────────────────────────── */

/**
 * Start broadcasting from a camera.
 *
 * @param {object} opts
 * @param {MediaStream} opts.mediaStream  a live camera stream
 * @param {object} opts.about             { projectId, projectName, division, supervisor }
 * @param {number} [opts.intervalMs]      how often to send a frame
 * @param {(s:object)=>void} [opts.onStat] per-frame telemetry for the UI
 * @returns {Promise<{ id:string, stop:()=>Promise<void> }>}
 */
export async function startBroadcast({
  mediaStream, about, intervalMs = 1500, onStat = () => {},
}) {
  if (!pp?.channel) throw new Error('Live streaming is unavailable on this deployment.')
  if (!mediaStream) throw new Error('No camera stream to broadcast.')

  const id = newId()
  const frames = pp.channel(streamChannel(id))
  const lobby = pp.channel(LOBBY)
  await frames.subscribe()
  await lobby.subscribe()

  await lobby.publish({ type: 'stream_started', id, ...about, startedAt: new Date().toISOString() })

  // Encode off-screen; the <video> element stays in the page for preview.
  const video = document.createElement('video')
  video.srcObject = mediaStream
  video.muted = true
  video.playsInline = true
  await video.play().catch(() => {})

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  let settings = { ...DEFAULTS }
  let stopped = false
  let inFlight = false
  let seq = 0
  let timer

  const encode = (width, quality) => {
    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480
    const w = Math.min(width, vw)
    const h = Math.round((w / vw) * vh)
    canvas.width = w
    canvas.height = h
    ctx.drawImage(video, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  }

  const shrink = (s) => {
    // Quality first — it costs less than resolution — then step the width
    // down hard, so a bad frame converges in two or three tries rather
    // than a dozen re-encodes on a phone.
    if (s.quality > FLOOR.quality) return { ...s, quality: Math.max(FLOOR.quality, s.quality - 0.15) }
    if (s.width > FLOOR.width) return { width: Math.max(FLOOR.width, Math.round(s.width * 0.7)), quality: 0.45 }
    return null
  }

  /* Without this, one difficult frame would degrade the whole walkthrough:
     settings only ever ratchet down. Recover slowly, and only when several
     frames in a row have left real room to spare. */
  const grow = (s) => {
    if (s.quality < CEILING.quality) return { ...s, quality: Math.min(CEILING.quality, s.quality + 0.05) }
    if (s.width < CEILING.width) return { width: Math.min(CEILING.width, Math.round(s.width * 1.25)), quality: 0.5 }
    return null
  }

  let comfortable = 0

  const tick = async () => {
    if (stopped || inFlight) return
    if (!video.videoWidth) return // camera not warmed up yet

    inFlight = true
    try {
      let trial = { ...settings }
      let data = encode(trial.width, trial.quality)

      while (data.length > FRAME_BUDGET_BYTES) {
        const smaller = shrink(trial)
        if (!smaller) break
        trial = smaller
        data = encode(trial.width, trial.quality)
      }

      if (data.length > FRAME_BUDGET_BYTES) {
        // Cannot fit even at the floor. Skip rather than send into the void.
        onStat({ skipped: true, bytes: data.length, ...trial })
        return
      }

      // Keep whatever worked; re-deriving it every frame wastes the uplink.
      const shrank = trial.width !== settings.width || trial.quality !== settings.quality
      settings = trial

      if (shrank || data.length > FRAME_BUDGET_BYTES * COMFORTABLE) {
        comfortable = 0
      } else if (++comfortable >= RECOVER_AFTER) {
        const bigger = grow(settings)
        if (bigger) { settings = bigger; comfortable = 0 }
      }

      await frames.publish({
        type: 'frame',
        id,
        seq: ++seq,
        at: Date.now(),
        w: canvas.width,
        h: canvas.height,
        data,
      })

      onStat({ skipped: false, bytes: data.length, seq, ...settings })
    } catch (err) {
      onStat({ error: err.message })
    } finally {
      inFlight = false
    }
  }

  timer = setInterval(tick, intervalMs)
  tick()

  const stop = async () => {
    if (stopped) return
    stopped = true
    clearInterval(timer)
    try {
      await lobby.publish({ type: 'stream_ended', id, endedAt: new Date().toISOString() })
    } catch { /* the roster ages it out anyway */ }
    await frames.unsubscribe().catch(() => {})
    await lobby.unsubscribe().catch(() => {})
    video.srcObject = null
  }

  return { id, stop }
}

/** Ask for the camera. Rear-facing where there is a choice. */
export async function openCamera({ facingMode = 'environment' } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser cannot reach a camera.')
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Camera access was refused. Allow it in the browser, then try again.')
    }
    if (err.name === 'NotFoundError') throw new Error('No camera was found on this device.')
    throw new Error(`The camera could not be opened: ${err.message}`)
  }
}

/* ── Watching ──────────────────────────────────────────────────── */

/**
 * Watch the lobby for broadcasts starting and stopping.
 * @returns {() => void} stop watching
 */
export function watchLobby({ onStarted, onEnded }) {
  if (!pp?.channel) return () => {}
  let handle
  let stopped = false
  ;(async () => {
    try {
      handle = pp.channel(LOBBY)
      await handle.subscribe((m) => {
        if (stopped) return
        if (m?.type === 'stream_started') onStarted?.(m)
        if (m?.type === 'stream_ended') onEnded?.(m)
      })
    } catch (err) {
      console.warn('[stream] could not join the lobby:', err.message)
    }
  })()
  return () => { stopped = true; handle?.unsubscribe?.().catch(() => {}) }
}

/**
 * Watch one broadcast's frames.
 * @returns {() => void} stop watching
 */
export function watchStream(id, onFrame) {
  if (!pp?.channel) return () => {}
  let handle
  let stopped = false
  ;(async () => {
    try {
      handle = pp.channel(streamChannel(id))
      await handle.subscribe((m) => {
        if (stopped) return
        if (m?.type === 'frame' && m.data) onFrame(m)
      })
    } catch (err) {
      console.warn('[stream] could not join the stream:', err.message)
    }
  })()
  return () => { stopped = true; handle?.unsubscribe?.().catch(() => {}) }
}

/** Announce that a viewer is present, so a broadcaster knows it is watched. */
export async function pingLobby(payload) {
  if (!pp?.channel) return
  try {
    const h = pp.channel(LOBBY)
    await h.subscribe()
    await h.publish({ type: 'viewer_here', ...payload })
  } catch { /* not important enough to surface */ }
}

export function formatBytes(n) {
  if (!n) return '—'
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`
}

/* ── A camera that is not a camera ─────────────────────────────── */

/**
 * Build a synthetic MediaStream for rehearsal.
 *
 * `startBroadcast` only wants a MediaStream, and a canvas can produce one
 * through `captureStream`. So a demo source draws real North West site
 * photographs onto a canvas with a slow pan, a running clock, and a
 * standing SIMULATED mark, and hands that over exactly as a camera would.
 *
 * This exists because a walkthrough cannot otherwise be rehearsed: the
 * feature needs a camera, and the laptop on the podium may not have one
 * pointed at anything useful. Every frame is watermarked and the lobby
 * payload is flagged, so a simulated stream can never be mistaken for a
 * real one — on the board or in a screenshot of it.
 *
 * The photographs are served with `Access-Control-Allow-Origin: *`, which
 * is what keeps the canvas untainted and `toDataURL` working.
 *
 * @param {string[]} imageUrls  photographs to cycle through
 * @returns {Promise<{ stream: MediaStream, stop: () => void }>}
 */
export async function createSyntheticStream(imageUrls = [], { fps = 8, secondsEach = 6 } = {}) {
  if (!imageUrls.length) throw new Error('No photographs available for the demo source.')

  const load = (src) => new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'   // without this the canvas taints and toDataURL throws
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

  const images = (await Promise.all(imageUrls.slice(0, 8).map(load))).filter(Boolean)
  if (!images.length) throw new Error('The demo photographs could not be loaded.')

  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')

  let raf
  const t0 = performance.now()

  const draw = () => {
    const elapsed = (performance.now() - t0) / 1000
    const idx = Math.floor(elapsed / secondsEach) % images.length
    const phase = (elapsed % secondsEach) / secondsEach
    const img = images[idx]

    // Slow zoom, so the picture reads as a camera being carried rather
    // than a slideshow.
    const zoom = 1.06 + phase * 0.06
    const iw = img.width, ih = img.height
    const scale = Math.max(canvas.width / iw, canvas.height / ih) * zoom
    const w = iw * scale, h = ih * scale
    const dx = (canvas.width - w) / 2 - (phase - 0.5) * 40
    const dy = (canvas.height - h) / 2

    ctx.fillStyle = '#12130E'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, dx, dy, w, h)

    // Running clock — proves to a viewer that the picture is moving.
    const stamp = new Date().toLocaleTimeString('en-GB')
    ctx.font = '600 26px "JetBrains Mono", monospace'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = 'rgba(18,19,14,0.65)'
    ctx.fillRect(18, canvas.height - 60, ctx.measureText(stamp).width + 28, 42)
    ctx.fillStyle = '#F3EFE3'
    ctx.fillText(stamp, 32, canvas.height - 26)

    // The standing mark. Never optional.
    const mark = 'SIMULATED — REHEARSAL SOURCE'
    ctx.font = '700 22px "Instrument Sans", system-ui, sans-serif'
    ctx.textBaseline = 'top'
    const mw = ctx.measureText(mark).width
    ctx.fillStyle = 'rgba(176,67,31,0.92)'
    ctx.fillRect(canvas.width - mw - 46, 18, mw + 28, 38)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(mark, canvas.width - mw - 32, 26)

    raf = requestAnimationFrame(draw)
  }
  draw()

  const stream = canvas.captureStream(fps)
  return {
    stream,
    stop: () => {
      cancelAnimationFrame(raf)
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}
