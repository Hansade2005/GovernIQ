import { PageHeader } from '@/components/PageHeader'
import { useState, useContext } from 'react'
import { AuthContext } from '@/lib/auth/AuthContext'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Bell, Moon, Sun, Monitor, Lock, User, Palette } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export function SettingsPage() {
  const { user } = useContext(AuthContext)
  const { preference, resolved, setPreference } = useTheme()
  const darkMode = resolved === 'dark'
  const [notifications, setNotifications] = useState({
    emailUpdates: localStorage.getItem('emailUpdates') !== 'false',
    documentNotifications: localStorage.getItem('documentNotifications') !== 'false',
    projectNotifications: localStorage.getItem('projectNotifications') !== 'false',
  })
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
  })
  const [saved, setSaved] = useState(false)

  const handleThemeToggle = () => setPreference(darkMode ? 'light' : 'dark')

  const handleNotificationChange = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem(key, updated[key])
  }

  const handleProfileSave = () => {
    // In a real app, this would update the user profile via an API
    localStorage.setItem('userProfile', JSON.stringify(profileForm))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account, notifications, and appearance."
      />

      {/* Profile Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Your email is used to sign in</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
            <Input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>
          <Button
            onClick={handleProfileSave}
            className={`w-full transition-all ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {saved ? '✓ Changes Saved' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* Theme Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {darkMode
                ? <Moon size={18} className="text-[color:var(--sepia)]" />
                : <Sun size={18} className="text-[color:var(--sepia)]" />}
              <div>
                <p className="font-medium text-[color:var(--ink)]">
                  {darkMode ? 'Dark' : 'Light'} mode
                </p>
                <p className="text-xs text-[color:var(--sepia)]">
                  {preference === 'system'
                    ? 'Following your device setting'
                    : 'Set manually for this browser'}
                </p>
              </div>
            </div>
            <button
              onClick={handleThemeToggle}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
              className={`relative w-11 h-6 rounded-full transition flex-shrink-0 ${
                darkMode ? 'bg-[color:var(--highland)]' : 'bg-[color:var(--rule-firm)]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Colour theme"
            className="grid grid-cols-3 gap-1 p-1 bg-[color:var(--linen)] rounded-[4px]"
          >
            {[
              { value: 'light',  label: 'Light',  icon: Sun },
              { value: 'dark',   label: 'Dark',   icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map((opt) => {
              const active = preference === opt.value
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreference(opt.value)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-[3px] text-xs font-medium transition ${
                    active
                      ? 'bg-[color:var(--card-bg)] text-[color:var(--ink)] shadow-[0_1px_2px_rgba(20,21,15,0.12)]'
                      : 'text-[color:var(--sepia)] hover:text-[color:var(--ink)]'
                  }`}
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card-alt">
            <div>
              <p className="text-foreground font-medium">Email Updates</p>
              <p className="text-xs text-muted-foreground">Receive general updates and newsletters</p>
            </div>
            <button
              onClick={() => handleNotificationChange('emailUpdates')}
              className={`relative w-12 h-6 rounded-full transition ${
                notifications.emailUpdates ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications.emailUpdates ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-card-alt">
            <div>
              <p className="text-foreground font-medium">Document Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified when documents are updated</p>
            </div>
            <button
              onClick={() => handleNotificationChange('documentNotifications')}
              className={`relative w-12 h-6 rounded-full transition ${
                notifications.documentNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications.documentNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-card-alt">
            <div>
              <p className="text-foreground font-medium">Project Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified about project changes and progress</p>
            </div>
            <button
              onClick={() => handleNotificationChange('projectNotifications')}
              className={`relative w-12 h-6 rounded-full transition ${
                notifications.projectNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications.projectNotifications ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Your account is secured with:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              OAuth authentication (Google, Apple, or X)
            </li>
            <li className="flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Encrypted data storage
            </li>
            <li className="flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Secure session management
            </li>
          </ul>
          <Button variant="outline" className="w-full mt-4">
            Change Password
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 bg-card-alt/50">
        <h3 className="text-sm font-semibold text-foreground mb-2">About GovernIQ</h3>
        <p className="text-xs text-muted-foreground">
          GovernIQ v1.0 • Regional Assembly Intelligence Platform
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          © 2026 Regional Assembly. All rights reserved.
        </p>
      </Card>
    </div>
  )
}
