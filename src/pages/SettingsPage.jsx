import { useState, useContext } from 'react'
import { AuthContext } from '@/lib/auth/AuthContext'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Bell, Moon, Sun, Lock, User, Palette } from 'lucide-react'

export function SettingsPage() {
  const { user } = useContext(AuthContext)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark')
  const [notifications, setNotifications] = useState({
    emailUpdates: localStorage.getItem('emailUpdates') !== 'false',
    documentNotifications: localStorage.getItem('documentNotifications') !== 'false',
    projectNotifications: localStorage.getItem('projectNotifications') !== 'false',
  })
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
  })
  const [saved, setSaved] = useState(false)

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings</p>
      </div>

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={20} className="text-muted-foreground" /> : <Sun size={20} className="text-muted-foreground" />}
            <div>
              <p className="text-foreground font-medium">{darkMode ? 'Dark' : 'Light'} Mode</p>
              <p className="text-xs text-muted-foreground">Adjust the appearance of GovernIQ</p>
            </div>
          </div>
          <button
            onClick={handleThemeToggle}
            className={`relative w-12 h-6 rounded-full transition ${
              darkMode ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                darkMode ? 'translate-x-6' : ''
              }`}
            />
          </button>
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
