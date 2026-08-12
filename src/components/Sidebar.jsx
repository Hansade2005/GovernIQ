import {
  ChevronRight, ChevronLeft,
  LayoutDashboard, FileText, FolderOpen, BarChart3,
  Map, Settings, LogOut, TrendingUp, Radio, Upload,
} from 'lucide-react'

/**
 * Sidebar — vellum column, grouped by parliamentary function. Active
 * item marked with a kola diamond (via .nav-item[data-active]).
 * Mono eyebrows label the groupings. No filled pills.
 */
export function Sidebar({
  user, onSignOut, currentPage,
  isCollapsed = false, onToggleCollapse = () => {},
}) {
  const groups = [
    {
      label: 'Chamber',
      items: [
        { id: 'dashboard',  label: 'Overview',       icon: LayoutDashboard, href: '#/' },
        { id: 'command-center', label: 'Command Centre', icon: Radio,       href: '#/command-center' },
      ],
    },
    {
      label: 'Registry',
      items: [
        { id: 'documents',    label: 'Documents',   icon: FileText,   href: '#/documents' },
        { id: 'reports',      label: 'Reports',     icon: Map,        href: '#/reports' },
        { id: 'upload-reports', label: 'Depositions', icon: Upload,   href: '#/upload-reports' },
      ],
    },
    {
      label: 'Programmes',
      items: [
        { id: 'projects',         label: 'Projects',   icon: FolderOpen, href: '#/projects' },
        { id: 'project-progress', label: 'Execution',  icon: TrendingUp, href: '#/project-progress' },
        { id: 'analytics',        label: 'Analytics',  icon: BarChart3,  href: '#/analytics' },
      ],
    },
  ]

  return (
    <aside
      className="h-full bg-[color:var(--vellum)] border-r border-[color:var(--rule)] flex flex-col overflow-y-auto"
    >
      {/* Institutional cartouche */}
      <div className={`px-5 pt-5 pb-4 border-b border-[color:var(--rule)] ${isCollapsed ? 'px-3 flex flex-col items-center gap-2' : ''}`}>
        <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-3 w-full' : ''}`}>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-[0.6rem]">Est. 2020 · Bamenda</p>
              <p className="serif text-lg leading-tight text-[color:var(--ink)] mt-1">
                Regional<br/>Assembly
              </p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 border border-[color:var(--rule)] rounded-[1px] hover:border-[color:var(--ink)] transition text-[color:var(--sepia)] hover:text-[color:var(--ink)]"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        {!isCollapsed && (
          <div className="ornament mt-4 -mx-1" aria-hidden />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="eyebrow px-3 pb-2 text-[0.6rem]">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className="nav-item"
                    data-active={isActive}
                    title={isCollapsed ? item.label : undefined}
                    style={isCollapsed ? { paddingLeft: '0.75rem', justifyContent: 'center' } : undefined}
                  >
                    <Icon size={15} strokeWidth={1.75} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Foot */}
      <div className="border-t border-[color:var(--rule)] px-3 py-3 space-y-0.5">
        <a
          href="#/settings"
          className="nav-item"
          data-active={currentPage === 'settings'}
          style={isCollapsed ? { paddingLeft: '0.75rem', justifyContent: 'center' } : undefined}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={15} strokeWidth={1.75} />
          {!isCollapsed && <span>Settings</span>}
        </a>
        <button
          onClick={onSignOut}
          className="nav-item w-full text-left"
          style={isCollapsed ? { paddingLeft: '0.75rem', justifyContent: 'center' } : undefined}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={15} strokeWidth={1.75} className="text-[color:var(--rust)]" />
          {!isCollapsed && <span className="text-[color:var(--rust)]">Sign out</span>}
        </button>
        {!isCollapsed && (
          <p className="eyebrow pt-4 pb-1 px-3 text-[0.55rem]">
            v2.0 · Hansard Ed.
          </p>
        )}
      </div>
    </aside>
  )
}
