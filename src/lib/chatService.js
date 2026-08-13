import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Chat sessions against a registry document.
 *
 * These live in Supabase alongside the documents they discuss, not in
 * PiPilot. PiPilot keeps authentication, realtime and the AI client; the
 * registry — documents, and now the conversations about them — is one
 * database, so a chat can be joined to the document it belongs to and a
 * deleted document takes its conversations with it.
 *
 * Filtering and ordering happen in the database rather than over a fetched
 * page, so a chamber with a thousand conversations still opens the right one.
 */

function client() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Chat storage is not configured for this deployment.')
  }
  return supabase
}

/** Find the conversation for a document, or open one. */
export async function getOrCreateChat(documentId, userId) {
  const c = client()

  const found = await c
    .from('chats')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (found.error) throw new Error(`Could not open the conversation: ${found.error.message}`)
  if (found.data) return found.data

  const created = await c
    .from('chats')
    .insert({ document_id: documentId, owner_id: userId || null })
    .select()
    .single()

  if (created.error) throw new Error(`Could not open the conversation: ${created.error.message}`)
  return created.data
}

/** Every message in a conversation, oldest first. */
export async function loadChatMessages(chatId) {
  const { data, error } = await client()
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) {
    // A conversation that cannot be recalled should not stop a new one.
    console.warn('[chat] could not load history:', error.message)
    return []
  }
  return data || []
}

/**
 * Record one turn.
 *
 * A failure here is deliberately not thrown: losing the transcript is a
 * smaller harm than dropping the member's answer on the floor, so the
 * caller gets a local-only message and the conversation carries on.
 */
export async function saveChatMessage(chatId, userId, role, content) {
  const row = { chat_id: chatId, owner_id: userId || null, role, content }

  const { data, error } = await client()
    .from('chat_messages')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.warn('[chat] could not save message:', error.message)
    return { ...row, id: `local-${Date.now()}`, created_at: new Date().toISOString() }
  }
  return data
}

/** Conversations, newest first, for a chat index. */
export async function getUserChats({ limit = 100 } = {}) {
  const { data, error } = await client()
    .from('chats')
    .select('*, documents(title, category)')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Could not load conversations: ${error.message}`)
  return data || []
}

/** Remove a conversation. Messages go with it via the foreign key cascade. */
export async function deleteChat(chatId) {
  const { error } = await client().from('chats').delete().eq('id', chatId)
  if (error) throw new Error(`Could not delete the conversation: ${error.message}`)
  return true
}
