import {
  ChevronRight, ChevronLeft,
  LayoutDashboard, FileText, FolderOpen, BarChart3,
  Map, Settings, LogOut, TrendingUp, Radio, Upload, MessageSquare,
  Gavel, Users,
} from 'lucide-react'
import { useSession } from '@/lib/SessionContext'
import { ROLES } from '@/lib/roles'

/**
 * Sidebar — grouped by parliamentary function so members find things
 * where they'd expect them. Labels stay visible by default; collapsing
 * is opt-in. Active item carries a kola diamond.
 */
export function Sidebar({
  onSignOut, currentPage,
  isCollapsed = false, onToggleCollapse = () => {}, onNavigate,
}) {
  const { allows, role, isSuperadmin, profile } = useSession()

  /* Nav is filtered by capacity: a member never sees a door they cannot
     open, rather than finding it locked. */
  const groups = [
    {
      label: 'Chamber',
      items: [
        { id: 'dashboard',      label: 'Overview',       icon: LayoutDashboard, href: '#/' },
        { id: 'assistant',      label: 'Ask the Assembly', icon: MessageSquare, href: '#/assistant' },
        { id: 'minutes',        label: 'Minutes',        icon: Gavel,           href: '#/minutes', need: 'minutes.read' },
        { id: 'command-center', label: 'Command centre', icon: Radio,           href: '#/command-center', need: 'command.read' },
      ],
    },
    {
      label: 'Registry',
      items: [
        { id: 'documents',      label: 'Documents',   icon: FileText, href: '#/documents', need: 'registry.read' },
        { id: 'reports',        label: 'Reports',     icon: Map,      href: '#/reports', need: 'reports.read' },
        { id: 'upload-reports', label: 'Depositions', icon: Upload,   href: '#/upload-reports', need: 'registry.write' },
      ],
    },
    {
      label: 'Programmes',
      items: [
        { id: 'projects',         label: 'Projects',  icon: FolderOpen, href: '#/projects', need: 'programmes.read' },
        { id: 'project-progress', label: 'Execution', icon: TrendingUp, href: '#/project-progress', need: 'programmes.write' },
        { id: 'analytics',        label: 'Analytics', icon: BarChart3,  href: '#/analytics', need: 'programmes.read' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'users', label: 'Users & capacities', icon: Users, href: '#/users', need: 'users.manage' },
      ],
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.need || allows(i.need)) }))
    .filter((g) => g.items.length > 0)

  const collapsedStyle = isCollapsed
    ? { paddingLeft: '0.625rem', paddingRight: '0.625rem', justifyContent: 'center' }
    : undefined

  return (
    <aside className="h-full bg-[color:var(--card-bg)] border-r border-[color:var(--rule)] flex flex-col overflow-y-auto">
      {/* Collapse control */}
      <div className={`h-12 flex items-center border-b border-[color:var(--rule)] ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {!isCollapsed && (
          <p className="eyebrow text-[0.55rem]">Navigation</p>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[3px] hover:bg-[color:var(--linen)] transition text-[color:var(--sepia)] hover:text-[color:var(--ink)]"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2.5 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="eyebrow px-3 pb-1.5 text-[0.55rem]">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="nav-item"
                    data-active={currentPage === item.id}
                    title={isCollapsed ? item.label : undefined}
                    style={collapsedStyle}
                    onClick={onNavigate}
                  >
                    <Icon size={16} strokeWidth={1.85} className="flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[color:var(--rule)] px-2.5 py-3 space-y-0.5">
        <a
          href="#/settings"
          className="nav-item"
          data-active={currentPage === 'settings'}
          style={collapsedStyle}
          title={isCollapsed ? 'Settings' : undefined}
          onClick={onNavigate}
        >
          <Settings size={16} strokeWidth={1.85} className="flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </a>
        {!isCollapsed && (
          <div className="px-3 pb-2 pt-1">
            <p className="eyebrow text-[0.5rem]">Signed in as</p>
            <p className="text-[0.75rem] font-medium text-[color:var(--ink)] truncate mt-0.5">
              {ROLES[role]?.label || role}
            </p>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="nav-item w-full text-left"
          style={collapsedStyle}
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} strokeWidth={1.85} className="flex-shrink-0 text-[color:var(--rust)]" />
          {!isCollapsed && <span className="text-[color:var(--rust)]">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
