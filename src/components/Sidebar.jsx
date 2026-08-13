import {
  ChevronRight, ChevronLeft,
  LayoutDashboard, FileText, FolderOpen, BarChart3,
  Map, Settings, LogOut, TrendingUp, Radio, Upload, MessageSquare,
  Gavel, Landmark, Users, Shield, MessagesSquare, Activity, ClipboardCheck, Video,
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
        { id: 'assistant',      label: 'Ask the Assembly', icon: MessageSquare, href: '#/assistant', need: 'registry.read' },
        { id: 'situation',      label: 'Situation room', icon: Activity,        href: '#/situation', need: 'live.watch' },
        { id: 'minutes',        label: 'Minutes',        icon: Gavel,           href: '#/minutes', need: 'minutes.read' },
        { id: 'command-center', label: 'Command centre', icon: Radio,           href: '#/command-center', need: 'command.read' },
      ],
    },
    {
      label: 'Registry',
      items: [
        { id: 'record',         label: 'The House record', icon: Landmark, href: '#/record', need: 'registry.read' },
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
        { id: 'analytics',        label: 'Analytics', icon: BarChart3,  href: '#/analytics', need: 'registry.read' },
        { id: 'checkin',          label: 'File a report', icon: ClipboardCheck, href: '#/checkin', need: 'live.report' },
        { id: 'broadcast',        label: 'Live walkthrough', icon: Video, href: '#/broadcast', need: 'live.report' },
      ],
    },
    {
      label: 'The public',
      items: [
        { id: 'feedback', label: 'Feedback', icon: MessagesSquare, href: '#/feedback', needAny: ['feedback.read', 'feedback.submit', 'feedback.read.own'] },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'users', label: 'Users & capacities', icon: Users, href: '#/users', need: 'users.manage' },
      ],
    },
  ]
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        (!i.need || allows(i.need)) &&
        (!i.needAny || i.needAny.some((n) => allows(n)))
      ),
    }))
    .filter((g) => g.items.length > 0)

  const displayName =
    profile?.full_name || profile?.email?.split('@')[0] || 'Member'
  const roleLabel = ROLES[role]?.label || role
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

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

      <nav className="py-4 px-2.5 space-y-5">
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

      {/* Who is signed in, and in what capacity. A member should be able to
          see at a glance why a register is or is not on their list. */}
      <div className="border-t border-[color:var(--rule)] mt-auto">
        {isCollapsed ? (
          <div
            className="flex justify-center py-3"
            title={`${displayName} — ${roleLabel}`}
          >
            <span className="w-8 h-8 rounded-full bg-[color:var(--highland)] text-white flex items-center justify-center text-[0.75rem] font-semibold">
              {initial}
            </span>
          </div>
        ) : (
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 flex-shrink-0 rounded-full bg-[color:var(--highland)] text-white flex items-center justify-center text-[0.75rem] font-semibold">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-semibold text-[color:var(--ink)] truncate leading-tight">
                  {displayName}
                </p>
                {profile?.email && (
                  <p className="mono text-[0.65rem] text-[color:var(--sepia-soft)] truncate mt-0.5">
                    {profile.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="stamp text-[color:var(--highland)]">
                {roleLabel}
              </span>
              {isSuperadmin && (
                <span title="Standing superadmin — fixed in code">
                  <Shield size={11} className="text-[color:var(--brass-ink)]" />
                </span>
              )}
            </div>

            {profile?.title && (
              <p className="text-[0.7rem] text-[color:var(--sepia)] mt-1.5 leading-snug">
                {profile.title}
                {profile.division ? ` · ${profile.division} Division` : ''}
              </p>
            )}
          </div>
        )}

        <div className="px-2.5 pb-3 space-y-0.5 border-t border-[color:var(--rule)] pt-2">
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
      </div>
    </aside>
  )
}
