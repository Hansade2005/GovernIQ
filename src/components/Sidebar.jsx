import {
  ChevronRight, ChevronLeft,
  LayoutDashboard, FileText, FolderOpen, BarChart3,
  Map, Settings, LogOut, TrendingUp, Radio, Upload,
} from 'lucide-react'

/**
 * Sidebar — grouped by parliamentary function so members find things
 * where they'd expect them. Labels stay visible by default; collapsing
 * is opt-in. Active item carries a kola diamond.
 */
export function Sidebar({
  onSignOut, currentPage,
  isCollapsed = false, onToggleCollapse = () => {},
}) {
  const groups = [
    {
      label: 'Chamber',
      items: [
        { id: 'dashboard',      label: 'Overview',       icon: LayoutDashboard, href: '#/' },
        { id: 'command-center', label: 'Command centre', icon: Radio,           href: '#/command-center' },
      ],
    },
    {
      label: 'Registry',
      items: [
        { id: 'documents',      label: 'Documents',   icon: FileText, href: '#/documents' },
        { id: 'reports',        label: 'Reports',     icon: Map,      href: '#/reports' },
        { id: 'upload-reports', label: 'Depositions', icon: Upload,   href: '#/upload-reports' },
      ],
    },
    {
      label: 'Programmes',
      items: [
        { id: 'projects',         label: 'Projects',  icon: FolderOpen, href: '#/projects' },
        { id: 'project-progress', label: 'Execution', icon: TrendingUp, href: '#/project-progress' },
        { id: 'analytics',        label: 'Analytics', icon: BarChart3,  href: '#/analytics' },
      ],
    },
  ]

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
        >
          <Settings size={16} strokeWidth={1.85} className="flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </a>
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
