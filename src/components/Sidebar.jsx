import { ChevronRight, LayoutDashboard, FileText, FolderOpen, BarChart3, Map, Settings, LogOut, ChevronLeft, TrendingUp } from 'lucide-react'
import { Button } from './Button'

export function Sidebar({ user, onSignOut, currentPage, isCollapsed = false, onToggleCollapse = () => {} }) {

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#/' },
    { id: 'documents', label: 'Documents', icon: FileText, href: '#/documents' },
    { id: 'projects', label: 'Projects', icon: FolderOpen, href: '#/projects' },
    { id: 'project-progress', label: 'Progress Tracking', icon: TrendingUp, href: '#/project-progress' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '#/analytics' },
    { id: 'reports', label: 'Reports', icon: Map, href: '#/reports' },
  ]

  return (
    <aside
      className={`h-full border-r border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 transition-all duration-300 flex flex-col overflow-y-auto`}
    >
      {/* Header */}
      <div className={`border-b border-border px-4 py-4 flex items-center justify-between ${isCollapsed ? 'flex-col gap-2' : ''}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          <img src="/logo.png" alt="Logo" className="h-8 w-8 flex-shrink-0" />
          {!isCollapsed && (
            <div>
              <p className="font-bold text-sm text-foreground">GovernIQ</p>
              <p className="text-xs text-muted-foreground">Regional Assembly</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-surface-alt rounded-lg transition text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-foreground hover:bg-surface-alt'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </a>
          )
        })}
      </nav>

      {/* Settings & Account */}
      <div className={`border-t border-border p-3 space-y-2`}>
        <a
          href="#/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
            currentPage === 'settings'
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'text-foreground hover:bg-surface-alt'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </a>
        <button
          onClick={onSignOut}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
