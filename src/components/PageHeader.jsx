/**
 * PageHeader — the working-register masthead.
 *
 * Every dashboard page opens the same way: a mono eyebrow, a compact
 * sans title, an optional one-line description, and an actions slot on
 * the right. Deliberately small: on a management screen the content is
 * the point, not the title. The ceremonial serif treatment is reserved
 * for sign-in and the Chamber hero.
 */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[color:var(--rule)]">
      <div className="min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="ornament-mark" aria-hidden />
            <p className="eyebrow">{eyebrow}</p>
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="text-[color:var(--sepia)] mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
