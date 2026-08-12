import { cn } from '@/lib/utils'

/**
 * Stamp — official register mark. Hairline outline in the color of its
 * meaning; mono uppercase label. Solid variants are reserved for the
 * primary call to action badge (e.g. hero highlights).
 *
 * Accepts either `children` (preferred) or a legacy `label` prop.
 */
export function Badge({
  children,
  label,
  icon: Icon,
  variant = 'default',
  className,
  ...props
}) {
  const styles = {
    default:     { cls: 'stamp', color: 'text-[color:var(--sepia)]' },
    primary:     { cls: 'stamp', color: 'text-[color:var(--highland)]' },
    secondary:   { cls: 'stamp', color: 'text-[color:var(--brass)]' },
    accent:      { cls: 'stamp', color: 'text-[color:var(--kola)]' },
    outline:     { cls: 'stamp', color: 'text-[color:var(--ink)]' },
    muted:       { cls: 'stamp', color: 'text-[color:var(--sepia)]' },
    success:     { cls: 'stamp', color: 'text-[color:var(--sage)]' },
    warning:     { cls: 'stamp', color: 'text-[color:var(--brass)]' },
    destructive: { cls: 'stamp', color: 'text-[color:var(--rust)]' },
    solid:       { cls: 'stamp stamp-solid bg-[color:var(--highland)] text-[color:var(--paper)] border-0', color: '' },
  }[variant] || { cls: 'stamp', color: 'text-[color:var(--sepia)]' }

  const content = children ?? label

  return (
    <span className={cn(styles.cls, styles.color, className)} {...props}>
      {Icon && <Icon size={10} strokeWidth={2.25} />}
      {content}
    </span>
  )
}
