import { useState, useEffect } from 'react'
import {
  Menu, X, LogOut, Settings, User, LifeBuoy, FileText, Clock,
  Search, ChevronDown, Sun, Moon, Monitor,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTheme } from '@/lib/theme'
import { GlobalSearch } from './GlobalSearch'

/**
 * Header — a single quiet strip. The seal and wordmark anchor the left,
 * a fixed-width search sits centre-right, the member menu closes it out.
 * No ornament here: it appeared on every page and became noise. The
 * ornament is reserved for sign-in and the Chamber hero.
 */
export function Header({ user, onSignOut, onOpenNav }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { preference, setPreference } = useTheme()

  // ⌘K / Ctrl+K from anywhere, and never while the member is typing
  // into some other field.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  /* First two sit inline on desktop; the rest collapse under "More" so the
     strip never wraps at narrow desktop widths. */
  const mainNav = [
    { label: 'Chamber',        href: '#/' },
    { label: 'Registry',       href: '#/documents' },
    { label: 'Ask the Assembly', href: '#/assistant' },
    { label: 'Programmes',     href: '#/projects' },
    { label: 'Analytics',      href: '#/analytics' },
    { label: 'Command centre', href: '#/command-center' },
    { label: 'Reports',        href: '#/reports' },
    { label: 'Execution',      href: '#/project-progress' },
  ]
  const INLINE_LINKS = 2
  const inlineNav = mainNav.slice(0, INLINE_LINKS)
  const overflowNav = mainNav.slice(INLINE_LINKS)

  return (
    <>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    <header className="sticky top-0 z-50 border-b border-[color:var(--rule)] bg-[color:var(--card-bg)]">
      <div className="px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Seal + wordmark */}
        <a href="#/" className="flex items-center gap-2.5 flex-shrink-0">
          <img
            src="/nwra-logo.png"
            alt="North West Regional Assembly seal"
            className="h-8 w-8 object-contain"
          />
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-[0.9375rem] font-semibold tracking-tight text-[color:var(--ink)]">
              GovernIQ
            </span>
            <span className="eyebrow text-[0.55rem] mt-1">NW Regional Assembly</span>
          </span>
        </a>

        {/* Primary nav — two inline, remainder under More */}
        <nav className="hidden lg:flex items-center gap-0.5 ml-4">
          {inlineNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2.5 py-1.5 text-[0.8125rem] font-medium rounded-[3px] text-[color:var(--sepia)] hover:text-[color:var(--ink)] hover:bg-[color:var(--linen)] transition"
            >
              {item.label}
            </a>
          ))}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-[0.8125rem] font-medium rounded-[3px] text-[color:var(--sepia)] hover:text-[color:var(--ink)] hover:bg-[color:var(--linen)] transition data-[state=open]:bg-[color:var(--linen)] data-[state=open]:text-[color:var(--ink)]">
                More
                <ChevronDown size={13} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="w-52 bg-[color:var(--card-bg)] border border-[color:var(--rule-firm)] rounded-[4px] shadow-[0_16px_40px_-20px_rgba(20,21,15,0.45)] p-1 z-50"
            >
              {overflowNav.map((item) => (
                <DropdownMenu.Item asChild key={item.href}>
                  <a
                    href={item.href}
                    className="block px-2.5 py-2 text-[0.8125rem] text-[color:var(--ink)] hover:bg-[color:var(--linen)] rounded-[3px] cursor-pointer outline-none"
                  >
                    {item.label}
                  </a>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 w-56 h-8 px-2.5 border border-[color:var(--rule-firm)] rounded-[3px] text-[color:var(--sepia-soft)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)] transition"
        >
          <Search size={13} className="flex-shrink-0" />
          <span className="text-[0.8125rem] truncate">Search the registry</span>
          <span className="mono text-[0.6rem] ml-auto px-1 py-0.5 border border-[color:var(--rule)] rounded-[2px] flex-shrink-0">⌘K</span>
        </button>

        {/* On a phone there is no room for the field, but search must still
            be reachable. */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-2 rounded-[3px] text-[color:var(--sepia)] hover:text-[color:var(--ink)] hover:bg-[color:var(--linen)] transition"
          aria-label="Search the registry"
        >
          <Search size={17} />
        </button>

        {/* Date */}
        <span className="hidden xl:block mono text-[0.7rem] text-[color:var(--sepia-soft)] whitespace-nowrap">
          {today}
        </span>

        {/* Member menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-[3px] hover:bg-[color:var(--linen)] transition">
              <span className="w-7 h-7 rounded-full bg-[color:var(--highland)] text-white flex items-center justify-center flex-shrink-0">
                <User size={13} />
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[0.8125rem] font-medium text-[color:var(--ink)] max-w-[130px] truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Member'}
                </span>
                <span className="eyebrow text-[0.5rem]">Councillor</span>
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="w-60 bg-[color:var(--card-bg)] border border-[color:var(--rule-firm)] rounded-[4px] shadow-[0_16px_40px_-20px_rgba(20,21,15,0.45)] p-1 z-50"
          >
            <div className="px-2.5 py-2.5 border-b border-[color:var(--rule)] mb-1">
              <p className="eyebrow text-[0.55rem]">Signed in as</p>
              <p className="text-[0.8125rem] text-[color:var(--ink)] truncate mt-1">{user?.email || 'guest'}</p>
            </div>
            {[
              { icon: Settings, label: 'Settings', href: '#/settings' },
              { icon: FileText, label: 'Registry', href: '#/documents' },
              { icon: Clock, label: 'Activity log', href: '#/activity' },
              { icon: LifeBuoy, label: 'Help & support', href: '#/help' },
            ].map((item) => (
              <DropdownMenu.Item asChild key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] text-[color:var(--ink)] hover:bg-[color:var(--linen)] rounded-[3px] cursor-pointer outline-none"
                >
                  <item.icon size={14} className="text-[color:var(--sepia)]" />
                  {item.label}
                </a>
              </DropdownMenu.Item>
            ))}
            {/* Appearance — light / dark / follow system */}
            <div className="h-px bg-[color:var(--rule)] my-1" />
            <div className="px-2.5 pt-2 pb-2.5">
              <p className="eyebrow text-[0.55rem] mb-2">Appearance</p>
              <div
                role="radiogroup"
                aria-label="Colour theme"
                className="grid grid-cols-3 gap-1 p-0.5 bg-[color:var(--linen)] rounded-[4px]"
              >
                {[
                  { value: 'light',  label: 'Light',  icon: Sun },
                  { value: 'dark',   label: 'Dark',   icon: Moon },
                  { value: 'system', label: 'Auto',   icon: Monitor },
                ].map((opt) => {
                  const active = preference === opt.value
                  return (
                    <button
                      key={opt.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPreference(opt.value)}
                      className={`flex flex-col items-center gap-1 py-1.5 rounded-[3px] text-[0.65rem] font-medium transition ${
                        active
                          ? 'bg-[color:var(--card-bg)] text-[color:var(--ink)] shadow-[0_1px_2px_rgba(20,21,15,0.12)]'
                          : 'text-[color:var(--sepia)] hover:text-[color:var(--ink)]'
                      }`}
                    >
                      <opt.icon size={13} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="h-px bg-[color:var(--rule)] my-1" />
            <DropdownMenu.Item asChild>
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] text-[color:var(--rust)] hover:bg-[color:var(--linen)] rounded-[3px] cursor-pointer outline-none"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <button
          className="lg:hidden p-2 -mr-1 text-[color:var(--ink)] rounded-[3px] hover:bg-[color:var(--linen)] transition"
          onClick={() => (onOpenNav ? onOpenNav() : setMobileOpen(!mobileOpen))}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-[color:var(--rule)] bg-[color:var(--card-bg)] px-4 py-3 space-y-0.5">
          {mainNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 text-sm rounded-[3px] text-[color:var(--ink)] hover:bg-[color:var(--linen)]"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
    </>
  )
}
