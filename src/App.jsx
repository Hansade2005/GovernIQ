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

function AppContent() {
  const { user, loading, signOut } = useContext(AuthContext)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2) || 'dashboard'
      const page = hash.split('/')[0]
      setCurrentPage(page || 'dashboard')
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-semibold">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={() => window.location.reload()} />
  }

  const renderPage = () => {
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isChatPage && <Header user={user} onSignOut={handleSignOut} />}
      
      <div className="flex flex-1">
        {!isChatPage && (
          <div className={`fixed left-0 top-16 bottom-0 transition-all duration-300 z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <Sidebar 
              user={user} 
              onSignOut={handleSignOut} 
              currentPage={currentPage}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        )}
        
        <main className={`flex-1 overflow-auto transition-all duration-300 ${!isChatPage ? (sidebarCollapsed ? 'ml-20' : 'ml-64') : ''}`}>
          {isChatPage ? (
            renderPage()
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderPage()}
            </div>
          )}
        </main>
      </div>

      {/* AI Project Assistant - Available on all pages */}
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
      <AppContent />
    </AuthProvider>
  )
}
