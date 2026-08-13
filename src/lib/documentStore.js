import { supabase, isSupabaseConfigured, DOCUMENTS_BUCKET } from './supabase'

/**
 * Document store — the registry's file and metadata layer.
 *
 * Files live in the Supabase `documents` bucket; their metadata lives in
 * the `public.documents` table. The two are written together on upload and
 * removed together on delete, so a row always points at a real object.
 *
 * Every function returns plain data (or throws an Error with a message fit
 * to show a member), so callers never handle Supabase response envelopes.
 */

/** Distinct, human-facing categories used across the registry. */
export const DOCUMENT_CATEGORIES = [
  'Minutes',
  'Motion',
  'Budget',
  'Report',
  'Correspondence',
  'Contract',
  'Other',
]

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Document storage is not configured for this deployment.')
  }
  return supabase
}

function unwrap({ data, error }, action) {
  if (error) throw new Error(`${action} failed: ${error.message}`)
  return data
}

/** Build a collision-proof object path that stays readable in the bucket. */
function buildStoragePath(file) {
  const stamp = new Date().toISOString().slice(0, 10)
  const rand = Math.random().toString(36).slice(2, 8)
  const safe = file.name
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .slice(-80)
  return `${stamp}/${rand}-${safe}`
}

/** Public URL for an object in the documents bucket. */
export function getPublicUrl(storagePath) {
  if (!storagePath || !supabase) return null
  const { data } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath)
  return data?.publicUrl || null
}

/**
 * Upload a file and record its metadata.
 *
 * `onProgress` receives a stage label so the form can report what is
 * happening rather than showing an undifferentiated spinner.
 */
export async function uploadDocument({
  file,
  title,
  category = 'Other',
  description = '',
  division = '',
  ocrText = '',
  uploadedBy = '',
  onProgress = () => {},
}) {
  const client = requireClient()
  if (!file) throw new Error('Choose a file to upload.')

  const storagePath = buildStoragePath(file)

  onProgress('Uploading file')
  const uploaded = await client.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
  if (uploaded.error) throw new Error(`Upload failed: ${uploaded.error.message}`)

  onProgress('Recording metadata')
  const insert = await client
    .from('documents')
    .insert({
      title: title?.trim() || file.name,
      category,
      description: description || null,
      division: division || null,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      ocr_text: ocrText || null,
      text_indexed: Boolean(ocrText),
      uploaded_by: uploadedBy || null,
    })
    .select()
    .single()

  if (insert.error) {
    // Don't leave an orphaned object behind if the metadata write fails.
    await client.storage.from(DOCUMENTS_BUCKET).remove([storagePath]).catch(() => {})
    throw new Error(`Could not record the document: ${insert.error.message}`)
  }

  onProgress('Done')
  return insert.data
}

/** List documents, newest first. */
export async function listDocuments({ limit = 200, category } = {}) {
  const client = requireClient()
  let query = client
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'All') query = query.eq('category', category)

  return unwrap(await query, 'Loading documents') || []
}

/** Full-text search across title, description, and extracted text. */
export async function searchDocuments(term, { limit = 100 } = {}) {
  const client = requireClient()
  if (!term || term.trim().length < 2) return listDocuments({ limit })

  const pattern = `%${term.trim()}%`
  const data = unwrap(
    await client
      .from('documents')
      .select('*')
      .or(`title.ilike.${pattern},description.ilike.${pattern},ocr_text.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit),
    'Searching documents'
  )
  return data || []
}

/** Attach extracted text to an existing document so it becomes searchable. */
export async function attachExtractedText(id, ocrText) {
  const client = requireClient()
  return unwrap(
    await client
      .from('documents')
      .update({ ocr_text: ocrText, text_indexed: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single(),
    'Indexing document'
  )
}

/** Remove a document and its stored file. */
export async function deleteDocument(doc) {
  const client = requireClient()
  if (doc.storage_path) {
    await client.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]).catch(() => {})
  }
  unwrap(await client.from('documents').delete().eq('id', doc.id), 'Deleting document')
  return true
}

/** Counts for the registry summary tiles. */
export async function getDocumentStats() {
  const client = requireClient()
  const [total, indexed] = await Promise.all([
    client.from('documents').select('id', { count: 'exact', head: true }),
    client.from('documents').select('id', { count: 'exact', head: true }).eq('text_indexed', true),
  ])
  return {
    total: total.count || 0,
    indexed: indexed.count || 0,
  }
}

/** Human-readable file size for the registry list. */
export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
