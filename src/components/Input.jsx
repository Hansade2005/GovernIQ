import { cn } from '@/lib/utils'

export function Input({ className, disabled, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-4 py-2 bg-input text-foreground border border-border rounded-lg',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
      disabled={disabled}
      {...props}
    />
  )
}

export function Label({ children, className, ...props }) {
  return (
    <label
      className={cn('block text-sm font-semibold text-foreground mb-1', className)}
      {...props}
    >
      {children}
    </label>
  )
}
