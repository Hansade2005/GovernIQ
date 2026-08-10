import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, LogOut, Settings, User, LifeBuoy, FileText, Clock } from 'lucide-react'
import { Button } from './Button'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function Header({ user, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Core navigation items (visible in header)
  const mainNavItems = [
    { label: 'Dashboard', href: '#/', icon: null },
    { label: 'Documents', href: '#/documents', icon: null },
    { label: 'Projects', href: '#/projects', icon: null },
    { label: 'Analytics', href: '#/analytics', icon: null },
  ]

  // Additional items (in dropdown menu)
  const additionalItems = [
    { label: 'Reports', href: '#/reports', icon: FileText },
    { label: 'Upload Reports', href: '#/upload-reports', icon: null },
    { label: 'Command Center', href: '#/command-center', icon: null },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="w-full px-2 sm:px-2 lg:px-3 py-1.5 flex items-center justify-between gap-1.5">
        {/* Logo */}
        <a href="#/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="Regional Assembly Logo" className="h-7 w-7 object-contain flex-shrink-0" />
          <div className="hidden sm:flex flex-col">
            <h1 className="font-bold text-sm font-display text-foreground leading-tight">
              GovernIQ
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none whitespace-nowrap">Regional Assembly</p>
          </div>
        </a>

        {/* Desktop Navigation - Hidden (replaced by sidebar) */}
        <div className="hidden lg:flex flex-1" />

        {/* Tablet Navigation - Compact Dropdown */}
        <div className="hidden md:flex lg:hidden">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" className="px-2 h-auto">
                Menu
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="w-56 bg-card border border-border rounded-lg shadow-lg p-1" align="end">
              {mainNavItems.map((item) => (
                <DropdownMenu.Item key={item.href} asChild>
                  <a
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-border my-1" />
              {additionalItems.map((item) => (
                <DropdownMenu.Item key={item.href} asChild>
                  <a
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon size={16} />}
                    {item.label}
                  </a>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {/* User Profile Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-1.5 h-auto py-1 text-xs sm:text-sm">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={12} className="text-primary" />
              </div>
              <span className="hidden sm:inline font-semibold truncate max-w-[80px]">
                {(user?.email?.split('@')[0] || 'User').slice(0, 20)}
                {(user?.email?.split('@')[0] || 'User').length > 20 ? '…' : ''}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="w-56 bg-card border border-border rounded-lg shadow-lg p-1" align="end">
            {/* User Info Header */}
            <div className="px-3 py-3 border-b border-border mb-1">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="font-semibold text-sm text-foreground truncate">{user?.email || 'User'}</p>
            </div>

            {/* User Menu Items */}
            <DropdownMenu.Item asChild>
              <a
                href="#/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer transition-colors"
              >
                <Settings size={16} />
                Settings
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <a
                href="#/help"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer transition-colors"
              >
                <LifeBuoy size={16} />
                Help & Support
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <a
                href="#/documentation"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer transition-colors"
              >
                <FileText size={16} />
                Documentation
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <a
                href="#/activity"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-alt rounded cursor-pointer transition-colors"
              >
                <Clock size={16} />
                Activity Log
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1" />

            {/* Sign Out */}
            <DropdownMenu.Item asChild>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded cursor-pointer transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-1 hover:bg-surface-alt rounded-lg transition-colors flex-shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Menu - Collapsible */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-surface-alt/50 px-3 sm:px-4 py-2 space-y-1 max-h-[calc(100vh-60px)] overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1 mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Navigation</p>
            {mainNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-sm font-semibold text-foreground hover:bg-card rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Additional Items */}
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Operations</p>
            {additionalItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:bg-card rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon && <item.icon size={16} />}
                {item.label}
              </a>
            ))}
          </div>

          {/* User Menu Items */}
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">Account</p>
            <a
              href="#/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:bg-card rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings size={16} />
              Settings
            </a>
            <a
              href="#/help"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground hover:bg-card rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LifeBuoy size={16} />
              Help
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onSignOut()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
