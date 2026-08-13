import { useMemo } from 'react'

/**
 * MarkdownMessage — renders assistant replies.
 *
 * Supports headings, bold, italic, inline code, fenced code blocks,
 * bullet and numbered lists, blockquotes, horizontal rules, tables, and
 * links. Deliberately dependency-free: the assistant emits a known,
 * narrow subset of markdown, so a small parser is easier to reason about
 * than pulling in a full library and sanitiser.
 *
 * Nothing here renders raw HTML — every branch produces React elements
 * from plain strings, so message content cannot inject markup.
 */
export function MarkdownMessage({ content, className = '' }) {
  const blocks = useMemo(() => parseBlocks(content || ''), [content])
  return <div className={`md ${className}`}>{blocks}</div>
}

function parseBlocks(text) {
  const out = []
  // Split on fenced code blocks, keeping the language hint if present.
  const segments = text.split(/```(\w*)\n?([\s\S]*?)```/g)

  for (let i = 0; i < segments.length; i++) {
    // The split yields [prose, lang, code, prose, lang, code, …]
    if (i % 3 === 0) {
      out.push(...parseProse(segments[i], `p${i}`))
    } else if (i % 3 === 2) {
      const lang = segments[i - 1]
      out.push(
        <pre
          key={`code${i}`}
          className="my-3 p-3 rounded-[4px] bg-[color:var(--linen)] border border-[color:var(--rule)] overflow-x-auto"
        >
          {lang && (
            <span className="eyebrow text-[0.55rem] block mb-1.5">{lang}</span>
          )}
          <code className="mono text-xs leading-relaxed whitespace-pre text-[color:var(--ink)]">
            {segments[i].replace(/\n$/, '')}
          </code>
        </pre>
      )
    }
  }
  return out
}

function parseProse(text, keyBase) {
  const lines = text.split('\n')
  const out = []
  let list = null       // { ordered: bool, items: [] }
  let table = null      // { head: [], rows: [] }
  let quote = null      // []

  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    out.push(
      <Tag
        key={`${keyBase}-l${out.length}`}
        className={`my-2 space-y-1 ${list.ordered ? 'list-decimal' : 'list-disc'} pl-5 marker:text-[color:var(--kola)]`}
      >
        {list.items.map((item, i) => (
          <li key={i} className="leading-relaxed pl-0.5">{renderInline(item)}</li>
        ))}
      </Tag>
    )
    list = null
  }

  const flushTable = () => {
    if (!table) return
    out.push(
      <div key={`${keyBase}-t${out.length}`} className="my-3 overflow-x-auto">
        <table className="data w-full">
          <thead>
            <tr>{table.head.map((h, i) => <th key={i}>{renderInline(h)}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className={/^[\d.,%\s+-]+$/.test(cell) ? 'num' : ''}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    table = null
  }

  const flushQuote = () => {
    if (!quote) return
    out.push(
      <blockquote
        key={`${keyBase}-q${out.length}`}
        className="my-3 pl-3 border-l-2 border-[color:var(--kola)] text-[color:var(--sepia)] italic"
      >
        {quote.map((l, i) => <p key={i} className="leading-relaxed">{renderInline(l)}</p>)}
      </blockquote>
    )
    quote = null
  }

  const flushAll = () => { flushList(); flushTable(); flushQuote() }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const trimmed = line.trim()
    const key = `${keyBase}-${idx}`

    // Table row
    if (/^\|.*\|$/.test(trimmed)) {
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim())
      // A separator row (|---|---|) confirms the previous row was the head.
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return
      flushList(); flushQuote()
      if (!table) table = { head: cells, rows: [] }
      else table.rows.push(cells)
      return
    }
    flushTable()

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList()
      if (!quote) quote = []
      quote.push(trimmed.slice(2))
      return
    }
    flushQuote()

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList()
      out.push(<hr key={key} className="my-4 rule-hair border-0 h-px bg-[color:var(--rule)]" />)
      return
    }

    // Headings
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushList()
      const level = heading[1].length
      const sizes = {
        1: 'text-base font-semibold mt-3 mb-1.5',
        2: 'text-[0.9375rem] font-semibold mt-3 mb-1.5',
        3: 'text-[0.875rem] font-semibold mt-2.5 mb-1',
        4: 'text-[0.8125rem] font-semibold mt-2 mb-1',
      }
      const Tag = `h${Math.min(level + 2, 6)}`
      out.push(
        <Tag key={key} className={`${sizes[level]} text-[color:var(--ink)] leading-snug`}>
          {renderInline(heading[2])}
        </Tag>
      )
      return
    }

    // Ordered list
    const ol = trimmed.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }
      list.items.push(ol[1])
      return
    }

    // Bullet list
    const ul = trimmed.match(/^[-*•]\s+(.*)$/)
    if (ul) {
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }
      list.items.push(ul[1])
      return
    }

    flushList()

    // Blank line
    if (!trimmed) return

    out.push(
      <p key={key} className="my-1.5 leading-relaxed">{renderInline(trimmed)}</p>
    )
  })

  flushAll()
  return out
}

/** Inline: **bold**, *italic*, `code`, [text](url), ~~strike~~ */
function renderInline(text) {
  if (!text) return null
  const parts = []
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*\n]+\*|(?<![\w`])_[^_\n]+_(?![\w`])|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${m.index}`

    if (tok.startsWith('**') || tok.startsWith('__')) {
      parts.push(<strong key={key} className="font-semibold text-[color:var(--ink)]">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('~~')) {
      parts.push(<span key={key} className="line-through opacity-70">{tok.slice(2, -2)}</span>)
    } else if (tok.startsWith('`')) {
      parts.push(
        <code key={key} className="mono text-[0.8em] px-1 py-0.5 rounded-[2px] bg-[color:var(--linen)] border border-[color:var(--rule)] text-[color:var(--brass-ink)]">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (tok.startsWith('[')) {
      const link = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (link) {
        parts.push(
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--kola)] underline underline-offset-2 hover:opacity-80"
          >
            {link[1]}
          </a>
        )
      }
    } else {
      // single * or _ → italic
      parts.push(<em key={key} className="italic">{tok.slice(1, -1)}</em>)
    }
    last = m.index + tok.length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}
