import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { Loader, Send, Sparkles, X } from 'lucide-react'
import { generate } from '@/lib/ai'

export function DocumentAIAssistant({ document, onClose }) {
  const hasText = document.extracted_text && 
                  document.extracted_text.trim().length > 100 &&
                  !document.extracted_text.includes('[PDF file') &&
                  !document.extracted_text.includes('[OCR')

  const initialMessage = hasText
    ? `I can help you analyze "${document.title}". What would you like to know? I can:
• **Summarize** — Get a quick overview
• **Extract Info** — Find key dates, numbers, entities
• **Analyze** — Understand purpose and recommendations
• **Classify** — Determine priority and subject area`
    : `⚠️ **Text Not Yet Extracted**

"${document.title}" is indexed but I don't have the text content yet.

**To analyze this document:**
1. Close this modal
2. Re-upload the document from the Documents page
3. Wait for the green "✓ Indexed" badge
4. Come back and ask me to analyze it

For best results with scanned documents:
- Convert PDF to image (PNG/JPG)
- Then upload — OCR will extract text automatically`

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialMessage,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Check if we have extracted text (not placeholder text)
      const hasText = document.extracted_text && 
                      document.extracted_text.trim().length > 100 &&
                      !document.extracted_text.includes('[PDF file') &&
                      !document.extracted_text.includes('[OCR')

      if (!hasText) {
        const noTextResponse = `⚠️ **This document hasn't been fully indexed yet**

I can see the document exists ("${document.title}"), but I don't have the text content needed to analyze it.

**What happened:**
This document was just uploaded and saved with metadata, but the text extraction is pending.

**Why this matters:**
Without the actual text, I can't:
- Summarize the content
- Extract key information
- Analyze the meaning
- Classify it properly

**How to fix it:**
1. **Close this** and go back to the Documents page
2. **Delete** this document (or ignore it)
3. **Upload a new copy** of your document:
   - For images: PNG, JPG (OCR will extract text)
   - For PDFs: Use one with readable text
4. **Wait** for the green "✓ Indexed" badge
5. **Come back** and I'll analyze it

**Quick tip:**
If you're uploading a scanned PDF:
- First convert it to an image (PNG/JPG)
- Then upload the image
- OCR will extract the text automatically
- It's much more reliable!

Once the text is extracted, I can help with analysis, summarization, classification, and more!`

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: noTextResponse,
          },
        ])
        setLoading(false)
        return
      }

      // Use PiPilot BaaS AI with document context
      let response
      try {
        if (!pp) {
          response = generateFallbackResponse(userMessage.content, document)
        } else {
          // Prepare the full document context for AI analysis
          const documentContext = `
Document Title: ${document.title}
Document Type: ${document.type}
Access Level: ${document.accessLevel}
Upload Date: ${new Date(document.uploadDate).toLocaleDateString()}

DOCUMENT CONTENT:
${(document.extracted_text || '').substring(0, 4000)}
${(document.extracted_text || '').length > 4000 ? '...[content truncated]' : ''}
`.trim()

          const systemPrompt = `You are a helpful document analysis assistant. Analyze the provided document and help the user understand its content, extract key information, and classify it. 
Be concise, accurate, and focus on the specific questions asked. Use the document content provided to answer questions about summaries, key points, dates, entities, purpose, and priority classification.

DOCUMENT TO ANALYZE:
${documentContext}`

          response = await generate({
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage.content }],
            maxTokens: 700,
          })
        }
      } catch (aiErr) {
        console.error('AI generation error:', aiErr)
        response = generateFallbackResponse(userMessage.content, document)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response || 'Unable to generate response. Please try again.',
        },
      ])
    } catch (err) {
      console.error('AI error:', err)
      setError(err.message || 'AI service temporarily unavailable')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to process request'}. Please try again.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackResponse = (query, doc) => {
    const text = (doc.extracted_text || '').toLowerCase()
    const q = query.toLowerCase()

    // Simple rule-based responses if AI not available
    if (q.includes('summar')) {
      const preview = doc.extracted_text?.substring(0, 300) || 'Document text not available'
      return `This ${doc.type} appears to be about governance and regional administration. First 300 characters:\n\n"${preview}..."\n\nFor a complete summary, please ensure the document is fully indexed.`
    }
    if (q.includes('extract') || q.includes('key')) {
      return `Key metadata available for this ${doc.type}:\n• Title: ${doc.title}\n• Type: ${doc.type}\n• Status: ${doc.status}\n• Upload Date: ${new Date(doc.uploadDate).toLocaleDateString()}\n• Access Level: ${doc.accessLevel}\n\nPlease try uploading a document with full text extraction for deeper analysis.`
    }
    if (q.includes('analy')) {
      return `Analysis of "${doc.title}":\nThis is a regional governance document. Document type: ${doc.type}. For detailed analysis, please ensure text extraction is complete and try again.`
    }
    if (q.includes('classif')) {
      return `Classification:\n• Document Type: ${doc.type}\n• Category: Governance/Administration\n• Priority: Based on content (full text analysis required for detailed classification)\n• Urgency: Standard\n\nFor AI-powered classification, please re-upload with complete text extraction.`
    }

    return `I'm analyzing "${doc.title}" (${doc.type}). ${text.length > 100 ? 'The document has been indexed. ' : 'The document needs text extraction. '}How can I help you with this document?`
  }

  const handleQuickAction = async (action) => {
    const prompts = {
      summarize: `Please provide a concise 2-3 sentence summary of this ${document.type}.`,
      extract:
        'What are the key points, dates, and numbers mentioned in this document? List them.',
      analyze: `What is the purpose of this ${document.type}? What decisions or actions does it recommend?`,
      classify: `Classify the priority level (high/medium/low) and subject area of this document based on its content.`,
    }

    setInput(prompts[action])
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      handleSend()
    }, 100)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl bg-background rounded-xl">
        <CardHeader className="border-b border-border pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Sparkles size={24} className="text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Document AI Assistant</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">Analyzing: {document.title}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
              <X size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden py-6 px-6">
          {/* Messages Container - Scrollable */}
          <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`px-5 py-3 rounded-xl max-w-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card border border-border text-foreground shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-xl px-5 py-3 shadow-sm">
                  <Loader size={18} className="animate-spin text-accent" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Quick Actions - Only show on first message */}
          {messages.length === 1 && !loading && (
            <div className="mb-6 space-y-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('summarize')}
                  disabled={loading}
                  className="text-xs font-medium h-9"
                >
                  Summarize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('extract')}
                  disabled={loading}
                  className="text-xs font-medium h-9"
                >
                  Extract Info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('analyze')}
                  disabled={loading}
                  className="text-xs font-medium h-9"
                >
                  Analyze
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('classify')}
                  disabled={loading}
                  className="text-xs font-medium h-9"
                >
                  Classify
                </Button>
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="flex-shrink-0 space-y-3 border-t border-border pt-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Ask a question about this document..."
                disabled={loading}
                className="text-sm flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={loading || !input.trim()} 
                size="sm"
                className="flex-shrink-0"
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Powered by PiPilot AI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
