import { cn } from '@/lib/utils'

/**
 * Ledger card — a bound page. Vellum surface, hairline border, inset
 * top rule mimicking a stitched Hansard binding. No drop shadow.
 */
export function Card({ children, className, flush = false, ...props }) {
  return (
    <div
      className={cn('ledger', flush && 'ledger-flush', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('mb-5 pb-4 border-b border-[color:var(--rule)]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('serif text-xl leading-tight text-[color:var(--ink)]', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-sm text-[color:var(--sepia)] mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
