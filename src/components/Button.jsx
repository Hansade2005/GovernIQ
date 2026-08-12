import { cn } from '@/lib/utils'

/**
 * GovernIQ Button — ledger-style. Crisp 2px corners, sober weight, kola
 * focus ring. Variants map to the shared .btn-* classes so the visual
 * language stays in one place (index.css).
 */
export function Button({
  children,
  variant = 'default',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  const variantClass = {
    default: 'btn-primary',
    primary: 'btn-primary',
    secondary: 'btn-outline',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    accent: 'btn-accent',
    destructive: 'btn-danger',
  }[variant] || 'btn-primary'

  const sizeClass = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-[0.95rem] px-6 py-3',
  }[size] || 'text-sm px-4 py-2'

  return (
    <button
      className={cn('btn', variantClass, sizeClass, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
