/**
 * Copy the pitch deck into `public/` so the app serves it at /deck/.
 *
 * `pitch/` stays the only place the deck is edited. This runs before every
 * build, so the deck shown inside the platform and the deck published to
 * here.now can never drift apart — which matters, because they are shown
 * to the same room on the same day.
 */
import { cpSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const from = resolve(root, 'pitch')
const to = resolve(root, 'public/deck')

if (!existsSync(from)) {
  console.warn('[sync-deck] no pitch/ directory — skipping')
  process.exit(0)
}

rmSync(to, { recursive: true, force: true })
mkdirSync(dirname(to), { recursive: true })
cpSync(from, to, { recursive: true })
console.log('[sync-deck] pitch/ → public/deck/')
