import { cn } from '@/lib/utils'

export function Input({ className, disabled, ...props }) {
  return (
    <input
      className={cn('field', className)}
      disabled={disabled}
      {...props}
    />
  )
}

export function Label({ children, className, ...props }) {
  return (
    <label
      className={cn(
        'eyebrow block mb-2',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}
