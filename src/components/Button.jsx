import { cn } from '@/lib/utils'

export function Button({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className,
  disabled,
  ...props 
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:scale-95',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95',
    outline: 'border border-border bg-background text-foreground hover:bg-surface-alt active:scale-95',
    ghost: 'text-foreground hover:bg-surface-alt active:scale-95',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      className={cn(
        'font-semibold rounded-lg transition-all duration-200 flex items-center gap-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
