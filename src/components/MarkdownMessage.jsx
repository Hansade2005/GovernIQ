import { useMemo } from 'react'

/**
 * MarkdownMessage — Renders markdown-like text with support for:
 * - **bold** text
 * - *italic* text (using _underscores_)
 * - `inline code`
 * - ```code blocks```
 * - - bullet lists
 * - Links [text](url)
 * 
 * Uses a simple regex-based approach for client-side rendering
 * without external markdown library dependency.
 */
export function MarkdownMessage({ content }) {
  const renderedContent = useMemo(() => {
    if (!content) return null

    // Split by code blocks first (to preserve their literal text)
    const parts = content.split(/```([\s\S]*?)```/)
    
    return parts.map((part, idx) => {
      // Even indices are normal text, odd are code blocks
      if (idx % 2 === 1) {
        return (
          <div key={idx} className="bg-card border border-border rounded-lg p-4 my-3 overflow-x-auto">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
              {part.trim()}
            </pre>
          </div>
        )
      }

      // Process normal text with inline markdown
      const lines = part.split('\n')
      return lines.map((line, lineIdx) => {
        // Handle bullet lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const content = line.trim().slice(2)
          return (
            <div key={`${idx}-${lineIdx}`} className="ml-4 my-1 flex gap-2">
              <span className="text-accent flex-shrink-0">•</span>
              <span>{renderInlineMarkdown(content)}</span>
            </div>
          )
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          const content = line.trim().replace(/^\d+\.\s/, '')
          return (
            <div key={`${idx}-${lineIdx}`} className="ml-4 my-1">
              {renderInlineMarkdown(content)}
            </div>
          )
        }

        // Empty lines become spacers
        if (!line.trim()) {
          return <div key={`${idx}-${lineIdx}`} className="my-2" />
        }

        // Regular paragraphs
        return (
          <p key={`${idx}-${lineIdx}`} className="my-2">
            {renderInlineMarkdown(line)}
          </p>
        )
      })
    })
  }, [content])

  return <div className="text-sm leading-relaxed space-y-1">{renderedContent}</div>
}

/**
 * Render inline markdown: **bold**, _italic_, `code`, [links]
 */
function renderInlineMarkdown(text) {
  const parts = []
  let lastIdx = 0

  // Pattern: **bold** or __bold__ or `code` or [text](url)
  const regex = /(\*\*.*?\*\*|__.*?__|`.*?`|\[.*?\]\(.*?\))/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }

    const matched = match[0]

    // Bold: **text** or __text__
    if (matched.startsWith('**') || matched.startsWith('__')) {
      const boldText = matched.slice(2, -2)
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {boldText}
        </strong>
      )
    }
    // Code: `text`
    else if (matched.startsWith('`')) {
      const codeText = matched.slice(1, -1)
      parts.push(
        <code key={match.index} className="bg-card px-2 py-0.5 rounded text-xs font-mono text-accent border border-border">
          {codeText}
        </code>
      )
    }
    // Link: [text](url)
    else if (matched.startsWith('[')) {
      const linkMatch = matched.match(/\[(.*?)\]\((.*?)\)/)
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline hover:text-accent/80 transition"
          >
            {linkText}
          </a>
        )
      }
    }

    lastIdx = match.index + matched.length
  }

  // Add remaining text
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }

  return parts.length > 0 ? parts : text
}
