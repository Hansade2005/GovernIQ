import { useState, useEffect, useContext } from 'react'
import { AuthProvider, AuthContext } from '@/lib/auth/AuthContext'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { ProjectAIAssistant } from '@/components/ProjectAIAssistant'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { DocumentChatPage } from '@/pages/DocumentChatPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectProgressPage } from '@/pages/ProjectProgressPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ReportUploadPage } from '@/pages/ReportUploadPage'
import { AnalyticsDashboard } from '@/pages/AnalyticsDashboard'
import { CommandCenterDashboard } from '@/pages/CommandCenterDashboard'
import { OCRTestPage } from '@/pages/OCRTestPage'
import { OCRTestPublic } from '@/pages/OCRTestPublic'
import { SettingsPage } from '@/pages/SettingsPage'
import { AssistantPage } from '@/pages/AssistantPage'
import { MinutesPage } from '@/pages/MinutesPage'
import { RecordPage } from '@/pages/RecordPage'
import { DeckPage } from '@/pages/DeckPage'
import { UsersPage } from '@/pages/UsersPage'
import { FeedbackPage } from '@/pages/FeedbackPage'
import { SituationRoomPage } from '@/pages/SituationRoomPage'
import { FieldCheckInPage } from '@/pages/FieldCheckInPage'
import { LiveBroadcastPage } from '@/pages/LiveBroadcastPage'
import { SessionProvider, useSession } from '@/lib/SessionContext'
import { Loading } from '@/components/QueryState'

/** Shown when someone reaches a register their capacity does not carry. */
function NotPermitted({ page }) {
  const { role } = useSession()
  return (
    <div className="ledger max-w-xl">
      <p className="eyebrow text-[0.6rem]">Not permitted</p>
      <h1 className="page-title mt-1.5">This register is not open to you</h1>
      <p className="text-[color:var(--sepia)] mt-2 leading-relaxed">
        Your capacity is <strong>{role}</strong>, which does not carry access to
        “{page}”. Ask the superadmin if you need it.
      </p>
      <a href="#/" className="btn btn-outline mt-4">Back to the chamber</a>
    </div>
  )
}

function AppContent() {
  const { user, loading, signOut } = useContext(AuthContext)
  const { allows, loading: roleLoading } = useSession()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2) || 'dashboard'
      const page = hash.split('/')[0]
      setCurrentPage(page || 'dashboard')
      setMobileNavOpen(false) // navigating closes the drawer
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMobileNavOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setCurrentPage('dashboard')
      window.location.hash = '#/'
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--paper)]">
        <div className="text-center">
          <div className="w-4 h-4 rotate-45 border border-[color:var(--kola)] mx-auto mb-6 animate-pulse" />
          <p className="eyebrow">Verifying credentials</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={() => window.location.reload()} />
  }

  if (roleLoading) return <Loading label="Establishing your capacity" />

  /* Each guarded route names the permission it needs. A member who types a
     URL they cannot open is told so plainly rather than shown a blank page. */
  const ROUTE_PERMISSIONS = {
    // The assistant is grounded on internal alerts and risk notes, so it
    // follows registry access rather than being open to every capacity.
    assistant: 'registry.read',
    documents: 'registry.read',
    reports: 'reports.read',
    'upload-reports': 'registry.write',
    projects: 'programmes.read',
    'project-progress': 'programmes.write',
    // A management dashboard — divisional scores and budget efficiency —
    // rather than a public one, so it follows registry access.
    analytics: 'registry.read',
    minutes: 'minutes.read',
    'command-center': 'command.read',
    users: 'users.manage',
    situation: 'live.watch',
    checkin: 'live.report',
    broadcast: 'live.report',
  }

  /* Feedback opens for anyone who may write it or read it. */
  const FEEDBACK_PERMS = ['feedback.read', 'feedback.submit', 'feedback.read.own']

  const renderPage = () => {
    if (currentPage === 'feedback' && !FEEDBACK_PERMS.some((p) => allows(p))) {
      return <NotPermitted page="feedback" />
    }
    const need = ROUTE_PERMISSIONS[currentPage]
    if (need && !allows(need)) return <NotPermitted page={currentPage} />

    switch (currentPage) {
      case 'documents':
        return <DocumentsPage />
      case 'chat':
        return <DocumentChatPage />
      case 'projects':
        return <ProjectsPage />
      case 'project-progress':
        return <ProjectProgressPage />
      case 'reports':
        return <ReportsPage />
      case 'upload-reports':
        return <ReportUploadPage />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'assistant':
        return <AssistantPage />
      case 'minutes':
        return <MinutesPage />
      case 'record':
        return <RecordPage />
      case 'deck':
        return <DeckPage />
      case 'users':
        return <UsersPage />
      case 'feedback':
        return <FeedbackPage />
      case 'situation':
        return <SituationRoomPage />
      case 'checkin':
        return <FieldCheckInPage />
      case 'broadcast':
        return <LiveBroadcastPage />
      case 'command-center':
        return <CommandCenterDashboard />
      case 'ocr-test':
        return <OCRTestPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  const isChatPage = currentPage === 'chat'

  /* Below `lg` the sidebar is an off-canvas drawer rather than a fixed
     column, so small screens get the full width for content. The drawer
     closes on navigation and on Escape. */
  const railWidth = sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
  const contentOffset = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'

  return (
    <div
      className="app-shell min-h-screen flex flex-col bg-[color:var(--paper)] text-[color:var(--ink)]"
      data-rail={sidebarCollapsed ? 'collapsed' : 'expanded'}
    >
      {!isChatPage && (
        <Header
          user={user}
          onSignOut={handleSignOut}
          onOpenNav={() => setMobileNavOpen(true)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {!isChatPage && (
          <>
            {/* Desktop rail */}
            <div
              className={`hidden lg:block fixed left-0 top-14 bottom-0 z-30 transition-[width] duration-200 ${railWidth}`}
            >
              <Sidebar
                user={user}
                onSignOut={handleSignOut}
                currentPage={currentPage}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>

            {/* Mobile drawer */}
            {mobileNavOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div
                  className="absolute inset-0 bg-[color:var(--ink)]/40"
                  onClick={() => setMobileNavOpen(false)}
                  aria-hidden
                />
                <div className="relative w-[17rem] max-w-[85vw] h-full shadow-[0_0_60px_-15px_rgba(20,21,15,0.6)]">
                  <Sidebar
                    user={user}
                    onSignOut={handleSignOut}
                    currentPage={currentPage}
                    isCollapsed={false}
                    onToggleCollapse={() => setMobileNavOpen(false)}
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <main className={`flex-1 min-w-0 ${!isChatPage ? contentOffset : ''}`}>
          {isChatPage ? (
            renderPage()
          ) : (
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-9 py-6 lg:py-7">
              {renderPage()}
            </div>
          )}
        </main>
      </div>

      {/* Programme assistant — a floating aide on the Programmes page only.
          The chamber-wide assistant lives at #/assistant. */}
      {currentPage === 'projects' && <ProjectAIAssistant />}
    </div>
  )
}

export default function App() {
  // Check if we're on a public route that doesn't need auth
  const isPublicRoute = window.location.hash.includes('#/ocr-test-public')

  if (isPublicRoute) {
    return <OCRTestPublic />
  }

  return (
    <AuthProvider>
      <SessionBridge />
    </AuthProvider>
  )
}

/** SessionProvider needs the signed-in user, which lives inside AuthProvider. */
function SessionBridge() {
  const { user } = useContext(AuthContext)
  return (
    <SessionProvider user={user}>
      <AppContent />
    </SessionProvider>
  )
}
