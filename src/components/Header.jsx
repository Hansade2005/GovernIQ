import { useState } from 'react'
import { Menu, X, LogOut, Settings, User, LifeBuoy, FileText, Clock, Search } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

/**
 * Header — parchment strip. Left: institutional wordmark with an
 * ornamental diamond in place of a logo mark. Right: search, session
 * date, user affordance. Deliberately quiet so the ornament below the
 * hero can carry visual weight.
 */
export function Header({ user, onSignOut }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const mainNav = [
    { label: 'Chamber',     href: '#/' },
    { label: 'Registry',    href: '#/documents' },
    { label: 'Programmes',  href: '#/projects' },
    { label: 'Analytics',   href: '#/analytics' },
    { label: 'Command',     href: '#/command-center' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--rule)] bg-[color:var(--paper)]/92 backdrop-blur">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
        {/* Wordmark */}
        <a href="#/" className="flex items-center gap-3 flex-shrink-0 group">
          <span
            className="inline-block w-4 h-4 rotate-45 border border-[color:var(--kola)]"
            aria-hidden
          />
          <span className="flex flex-col leading-none">
            <span className="serif text-[1.05rem] tracking-tight text-[color:var(--ink)]">
              GovernIQ
            </span>
            <span className="eyebrow text-[0.6rem] mt-0.5">NW Regional Assembly</span>
          </span>
        </a>

        {/* Date stamp — desktop only */}
        <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-[color:var(--rule)] text-[color:var(--sepia)]">
          <span className="eyebrow text-[0.6rem]">Session of</span>
          <span className="mono text-xs text-[color:var(--ink)]">{today}</span>
        </div>

        <div className="flex-1" />

        {/* Tablet condensed nav */}
        <nav className="hidden md:flex items-center gap-1">
          {mainNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-xs uppercase tracking-widest mono text-[color:var(--sepia)] hover:text-[color:var(--ink)] transition"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Search cue */}
        <button
          className="hidden lg:flex items-center gap-2 h-9 px-3 border border-[color:var(--rule)] text-[color:var(--sepia)] hover:text-[color:var(--ink)] hover:border-[color:var(--ink)] transition rounded-[2px]"
          aria-label="Search the registry"
          onClick={() => (window.location.hash = '#/documents')}
        >
          <Search size={14} />
          <span className="text-xs">Search the registry</span>
          <span className="mono text-[0.65rem] ml-2 px-1.5 py-0.5 border border-[color:var(--rule)]">⌘K</span>
        </button>

        {/* User */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 pl-3 pr-2 h-9 border border-transparent hover:border-[color:var(--rule)] transition rounded-[2px]">
              <span className="w-7 h-7 border border-[color:var(--ink)] flex items-center justify-center rounded-[1px]">
                <User size={13} className="text-[color:var(--ink)]" />
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-medium text-[color:var(--ink)] max-w-[120px] truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Honourable Member'}
                </span>
                <span className="eyebrow text-[0.55rem]">Councillor</span>
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="w-64 bg-[color:var(--paper)] border border-[color:var(--rule)] rounded-[3px] shadow-[0_20px_50px_-30px_rgba(20,21,15,0.35)] p-1"
          >
            <div className="px-3 py-3 border-b border-[color:var(--rule)] mb-1">
              <p className="eyebrow text-[0.6rem]">Signed in as</p>
              <p className="text-sm text-[color:var(--ink)] truncate mt-0.5">{user?.email || 'guest'}</p>
            </div>
            {[
              { icon: Settings, label: 'Settings', href: '#/settings' },
              { icon: FileText, label: 'Documentation', href: '#/documents' },
              { icon: Clock, label: 'Activity Log', href: '#/activity' },
              { icon: LifeBuoy, label: 'Help & Support', href: '#/help' },
            ].map((item) => (
              <DropdownMenu.Item asChild key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--ink)] hover:bg-[color:var(--linen)] rounded-[2px] cursor-pointer"
                >
                  <item.icon size={14} className="text-[color:var(--sepia)]" />
                  {item.label}
                </a>
              </DropdownMenu.Item>
            ))}
            <div className="h-px bg-[color:var(--rule)] my-1" />
            <DropdownMenu.Item asChild>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--rust)] hover:bg-[color:var(--linen)] rounded-[2px] cursor-pointer"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* Mobile trigger */}
        <button
          className="md:hidden p-2 text-[color:var(--ink)]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Signature ornament — the woven diamond hairline */}
      <div className="ornament ornament-draw" aria-hidden />

      {mobileOpen && (
        <nav className="md:hidden border-t border-[color:var(--rule)] bg-[color:var(--vellum)] px-4 py-4 space-y-1">
          {mainNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 text-sm text-[color:var(--ink)] hover:bg-[color:var(--linen)] rounded-[2px]"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
