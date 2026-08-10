import { pp } from '@/lib/pipilot'

/**
 * Helper to add timeout to a promise
 */
function withTimeout(promise, timeoutMs = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out (${timeoutMs}ms)`)), timeoutMs)
    )
  ])
}

/**
 * Create or get a chat session for a document
 */
export async function getOrCreateChat(documentId, userId) {
  try {
    console.log('getOrCreateChat: starting for doc', documentId)
    
    // Try to find existing chat for this document
    const chats = await withTimeout(
      pp.from('chats').select({ limit: 1 }),
      8000
    )

    console.log('getOrCreateChat: fetched chats', chats?.length)

    // Filter locally if needed
    const existingChat = chats?.find(c => c.document_id === documentId)
    if (existingChat) {
      console.log('getOrCreateChat: found existing chat', existingChat.id)
      return existingChat
    }

    // Create new chat session
    const newChat = {
      document_id: documentId,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('getOrCreateChat: creating new chat')
    const result = await withTimeout(
      pp.from('chats').insert(newChat),
      8000
    )
    
    const chatId = result.ids[0]
    console.log('getOrCreateChat: created chat', chatId)
    return { ...newChat, id: chatId }
  } catch (err) {
    console.error('Failed to get or create chat:', err)
    throw err
  }
}

/**
 * Load all messages for a chat session
 */
export async function loadChatMessages(chatId) {
  try {
    console.log('loadChatMessages: starting for chat', chatId)
    
    const messages = await withTimeout(
      pp.from('chat_messages').select({ limit: 100 }),
      8000
    )

    console.log('loadChatMessages: fetched messages', messages?.length)
    
    // Filter locally and sort by created_at ascending to maintain order
    const filtered = (messages || [])
      .filter(m => m.chat_id === chatId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    return filtered
  } catch (err) {
    console.error('Failed to load chat messages:', err)
    // Return empty array instead of throwing so chat can still work
    return []
  }
}

/**
 * Save a message to the chat
 */
export async function saveChatMessage(chatId, userId, role, content) {
  const message = {
    chat_id: chatId,
    owner_id: userId,
    role,
    content,
    created_at: new Date().toISOString()
  }

  try {
    console.log('saveChatMessage: saving', role, 'message')
    
    const result = await withTimeout(
      pp.from('chat_messages').insert(message),
      8000
    )
    
    console.log('saveChatMessage: saved message', result.ids[0])
    return { ...message, id: result.ids[0] }
  } catch (err) {
    console.error('Failed to save chat message:', err)
    // Don't throw - log the error but let the chat continue
    return { ...message, id: 'local-' + Date.now() }
  }
}

/**
 * Get all chats for the current user (with document info)
 */
export async function getUserChats() {
  try {
    const chats = await pp.from('chats').select({ limit: 100 })
    return chats || []
  } catch (err) {
    console.error('Failed to load user chats:', err)
    throw err
  }
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChat(chatId) {
  try {
    // Delete all messages first
    const messages = await pp.from('chat_messages').select({ 
      limit: 100,
      filter: { chat_id: chatId }
    })

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        await pp.from('chat_messages').delete(msg.id)
      }
    }

    // Delete the chat
    await pp.from('chats').delete(chatId)
  } catch (err) {
    console.error('Failed to delete chat:', err)
    throw err
  }
}
