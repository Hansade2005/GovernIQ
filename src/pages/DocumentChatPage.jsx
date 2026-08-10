import { useState, useRef, useEffect, useContext } from 'react'
import { AuthContext } from '@/lib/auth/AuthContext'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Loader, Send, Sparkles, ArrowLeft, FileText, ChevronDown } from 'lucide-react'
import { pp } from '@/lib/pipilot'
import { getOrCreateChat, loadChatMessages, saveChatMessage } from '@/lib/chatService'

/**
 * DocumentChatPage — Full-page chat interface for document analysis
 * Route: #/chat/:documentId
 * Features:
 * - Spacious message layout (Lovable style)
 * - Markdown rendering in messages
 * - Document picker in input composer
 * - Quick action buttons
 * - Persistent chat storage in database
 * - Clean, professional UI
 */
export function DocumentChatPage() {
  const { user } = useContext(AuthContext)
  const [documents, setDocuments] = useState([])
  const [currentDocId, setCurrentDocId] = useState(() => {
    // Extract documentId from URL hash on init
    const hash = window.location.hash
    const match = hash.match(/#\/chat\/([^/]+)/)
    return match ? match[1] : null
  })
  const [currentDoc, setCurrentDoc] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [docLoading, setDocLoading] = useState(true)
  const [showDocPicker, setShowDocPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const loadTimeoutRef = useRef(null)

  // Load documents and initialize chat
  useEffect(() => {
    const userId = user?.userId || user?.id // Support both userId and id
    if (!userId || !currentDocId) return

    const initializeChat = async () => {
      try {
        // Load documents with timeout
        const timeoutPromise = new Promise((_, reject) => {
          loadTimeoutRef.current = setTimeout(() => {
            reject(new Error('Loading timed out'))
          }, 8000)
        })

        const docsPromise = pp.from('documents').select({ limit: 50 })
        const docs = await Promise.race([docsPromise, timeoutPromise])
        clearTimeout(loadTimeoutRef.current)

        // Find the current document
        const doc = (docs || []).find((d) => d.id === currentDocId)
        if (!doc) {
          setError('Document not found')
          setDocLoading(false)
          return
        }

        setCurrentDoc(doc)
        setDocuments(docs || [])

        // Show initial greeting message immediately
        const hasText = doc.extracted_text && 
                        doc.extracted_text.trim().length > 100 &&
                        !doc.extracted_text.includes('[PDF file') &&
                        !doc.extracted_text.includes('[OCR')

        const initialMsg = hasText
          ? `**Analyzing "${doc.title}"**\n\nI can help you understand this document. What would you like to know?\n\n- **Summarize** — Get a quick overview\n- **Extract Info** — Find key dates, numbers, entities\n- **Analyze** — Understand purpose and recommendations\n- **Classify** — Determine priority and subject area`
          : `⚠️ **Text Not Yet Extracted**\n\n"${doc.title}" hasn't been fully indexed yet. Re-upload and wait for the green "✓ Indexed" badge, then come back.`

        setMessages([{ role: 'assistant', content: initialMsg }])
        setDocLoading(false)
        setError('')

        // Try to load or create chat session in background (non-blocking)
        try {
          const chat = await getOrCreateChat(currentDocId, userId)
          setCurrentChatId(chat.id)

          // Try to load persistent messages
          const persistedMessages = await loadChatMessages(chat.id)
          if (persistedMessages.length > 0) {
            setMessages(persistedMessages)
          }
        } catch (err) {
          console.warn('Chat persistence unavailable:', err.message)
          // Continue with local chat - don't block UI
        }
      } catch (err) {
        console.error('Failed to initialize chat:', err)
        setError('Failed to load. Please refresh.')
        setDocLoading(false)
      }
    }

    initializeChat()
    return () => clearTimeout(loadTimeoutRef.current)
  }, [user?.userId, user?.id, currentDocId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const userId = user?.userId || user?.id
    if (!input.trim() || !currentDoc || !currentChatId || !userId) return

    const userMsg = { role: 'user', content: input }
    const userInput = input
    
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Save user message to database
      await saveChatMessage(currentChatId, userId, 'user', userInput)

      const hasText = currentDoc.extracted_text && 
                      currentDoc.extracted_text.trim().length > 100 &&
                      !currentDoc.extracted_text.includes('[PDF file') &&
                      !currentDoc.extracted_text.includes('[OCR')

      if (!hasText) {
        const errorMsg = `⚠️ This document hasn't been fully indexed yet. I can't analyze it without the extracted text.`
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: errorMsg
          }
        ])
        // Save error response to database
        await saveChatMessage(currentChatId, userId, 'assistant', errorMsg)
        setLoading(false)
        return
      }

      const docContext = `
Document Title: ${currentDoc.title}
Document Type: ${currentDoc.type}
Upload Date: ${new Date(currentDoc.uploadDate).toLocaleDateString()}

DOCUMENT CONTENT:
${(currentDoc.extracted_text || '').substring(0, 4000)}
${(currentDoc.extracted_text || '').length > 4000 ? '...[content truncated]' : ''}
`.trim()

      const systemPrompt = `You are a helpful document analysis assistant. Analyze the provided document and help the user understand its content, extract key information, and classify it. 
Be concise, accurate, and focus on the specific questions asked. Use **markdown** for formatting (bold, lists, code) to make responses clear and scannable.

DOCUMENT TO ANALYZE:
${docContext}`

      const response_obj = await pp.ai.generate({
        system: systemPrompt,
        messages: [{ role: 'user', content: userInput }],
        maxTokens: 800,
      })

      const response = response_obj?.text || 'No response generated'

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response }
      ])

      // Save AI response to database
      await saveChatMessage(currentChatId, userId, 'assistant', response)
    } catch (err) {
      console.error('AI error:', err)
      const errorContent = `⚠️ Error: ${err.message || 'Unable to process request'}. Please try again.`
      setError(err.message || 'AI service unavailable')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorContent
        }
      ])
      // Try to save error to database, but don't fail if it doesn't work
      try {
        await saveChatMessage(currentChatId, userId, 'assistant', errorContent)
      } catch (saveErr) {
        console.error('Failed to save error message:', saveErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action) => {
    const prompts = {
      summarize: `Please provide a concise 2-3 sentence summary of this ${currentDoc?.type || 'document'}.`,
      extract: 'What are the key points, dates, and numbers mentioned? List them.',
      analyze: `What is the purpose of this document? What decisions or actions does it recommend?`,
      classify: `Classify the priority level (high/medium/low) and subject area based on the content.`
    }
    setInput(prompts[action])
  }

  const handleSwitchDoc = (docId) => {
    setCurrentDocId(docId)
    window.location.hash = `#/chat/${docId}`
    setShowDocPicker(false)
  }

  if (docLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-foreground font-semibold">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!currentDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Document Selected</h2>
          <p className="text-muted-foreground mb-6">Please select a document to start chatting.</p>
          <Button onClick={() => window.location.hash = '#/documents'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Compact */}
      <div className="border-b border-border bg-card/50 px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.hash = '#/documents'}
            className="p-0 w-8 h-8 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              {currentDoc.title.length > 20 ? currentDoc.title.slice(0, 20) + '…' : currentDoc.title}
            </h1>
            <p className="text-xs text-muted-foreground">{currentDoc.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="outline" className="text-xs px-2 py-0.5">✓ Indexed</Badge>
        </div>
      </div>

      {/* Messages Container - Scrollable only here */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl rounded-2xl px-4 sm:px-5 py-3 shadow-sm border text-sm sm:text-base ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border'
              }`}
            >
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <MarkdownMessage content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <Loader className="w-4 h-4 animate-spin text-accent" />
            </div>
          </div>
        )}

        {/* Quick Actions - Show on first message only */}
        {messages.length === 1 && !loading && (
          <div className="mt-6">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'summarize', label: 'Summarize' },
                { key: 'extract', label: 'Extract Info' },
                { key: 'analyze', label: 'Analyze' },
                { key: 'classify', label: 'Classify' }
              ].map((action) => (
                <Button
                  key={action.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.key)}
                  disabled={loading}
                  className="text-xs font-medium h-8 justify-center"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive font-medium">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer - Fixed at Bottom */}
      <div className="border-t border-border bg-card/50 px-3 sm:px-4 py-2.5 flex-shrink-0">
        <div className="flex gap-2 items-end">
          {/* Document Picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocPicker(!showDocPicker)}
              className="text-xs h-9 gap-1.5 px-2 whitespace-nowrap flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentDoc.title.slice(0, 15)}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>

            {/* Document Dropdown */}
            {showDocPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 max-h-44 overflow-y-auto">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSwitchDoc(doc.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border last:border-0 hover:bg-background transition text-sm ${
                      doc.id === currentDocId ? 'bg-accent/10 text-accent' : 'text-foreground'
                    }`}
                  >
                    <div className="font-medium text-xs">{doc.title}</div>
                    <div className="text-xs text-muted-foreground">{doc.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Field */}
          <div className="flex-1 flex gap-1.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Ask about this document..."
              disabled={loading}
              className="text-xs sm:text-sm flex-1 h-9"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="sm"
              className="h-9 px-3 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer - Below Composer */}
      <div className="border-t border-border bg-background px-3 sm:px-4 py-2 flex-shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          Powered by PiPilot AI
        </p>
      </div>
    </div>
  )
}
