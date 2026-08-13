import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client for the registry: document metadata in Postgres and the
 * files themselves in the `documents` storage bucket.
 *
 * The key here is the publishable (anon) key — it is designed to ship in
 * client code and is not a secret. Access is governed by row-level
 * security policies on the database, not by hiding this value.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const DOCUMENTS_BUCKET = 'documents'

/** False when the deployment has no Supabase configured — callers degrade gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[registry] Supabase is not configured. Set VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_PUBLISHABLE_KEY to enable document upload and search.'
  )
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null
