import { pp } from './pipilot'

/**
 * The live wire.
 *
 * Two things carry a site report, and they do different jobs:
 *
 *   Supabase   the durable record. A report is not "made" until it is
 *              written here, and this is what the board reads on load.
 *   PiPilot    the live wire. A broadcast on a channel reaches every
 *              other client already watching, in about a second, over a
 *              WebSocket PiPilot keeps open. It carries no history — a
 *              board that joins late sees nothing it missed, which is
 *              exactly why the durable read exists.
 *
 * Verified against the live service: publish returns `delivered: n` and a
 * second client receives the full payload.
 *
 * A broadcast is best-effort by design. If the wire is down the report is
 * still saved and still appears when the board next reads; the board only
 * loses the instant update, never the record.
 */

export const SITE_CHANNEL = 'governiq:sites'

/**
 * Watch the wire.
 *
 * @param {(payload:object) => void} onReport
 * @returns {() => void} stop watching
 */
export function watchSites(onReport) {
  if (!pp?.channel) {
    console.warn('[live] realtime is unavailable; the board will refresh on demand only.')
    return () => {}
  }

  let handle
  let stopped = false

  ;(async () => {
    try {
      handle = pp.channel(SITE_CHANNEL)
      await handle.subscribe((payload) => {
        if (stopped) return
        if (payload?.type === 'site_report') onReport(payload)
      })
    } catch (err) {
      console.warn('[live] could not join the wire:', err.message)
    }
  })()

  return () => {
    stopped = true
    handle?.unsubscribe?.().catch(() => {})
  }
}

/** Announce a report to everyone watching. Never throws — see the note above. */
export async function announceReport(report) {
  if (!pp?.channel) return { ok: false, delivered: 0 }
  try {
    const handle = pp.channel(SITE_CHANNEL)
    await handle.subscribe()
    return await handle.publish({ type: 'site_report', ...report })
  } catch (err) {
    console.warn('[live] the report was saved but not broadcast:', err.message)
    return { ok: false, delivered: 0 }
  }
}
