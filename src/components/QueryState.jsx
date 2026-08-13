/**
 * Loading and failure states for registry-backed views.
 *
 * An empty screen is an invitation to act, and a failure says what went
 * wrong and offers the next step — neither is a bare spinner or a shrug.
 */

export function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-3.5 h-3.5 rotate-45 border border-[color:var(--kola)] mx-auto mb-4 animate-pulse" />
        <p className="eyebrow">{label}</p>
      </div>
    </div>
  )
}

export function LoadFailure({ error, onRetry }) {
  return (
    <div className="ledger border-[color:var(--rust)]">
      <p className="eyebrow text-[0.6rem] text-[color:var(--rust)]">Could not load</p>
      <p className="mt-1.5 text-[color:var(--ink)]">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline mt-3">
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, description, action }) {
  return (
    <div className="ledger text-center py-12">
      <span className="ornament-mark mx-auto block mb-4" aria-hidden />
      <p className="font-semibold text-[color:var(--ink)]">{title}</p>
      {description && (
        <p className="text-[color:var(--sepia)] mt-1.5 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
