import { useState } from 'react'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { pp } from '@/lib/pipilot'
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react'

export function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignUp, setShowSignUp] = useState(false)
  const [name, setName] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (showSignUp) {
        await pp.auth.signUpWithPassword({ email, password, name: name || email.split('@')[0] })
      } else {
        await pp.auth.signInWithPassword({ email, password })
      }
      onSuccess()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await pp.auth.signIn()
      onSuccess()
    } catch (err) {
      setError(err.message || 'OAuth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface-alt flex flex-col md:flex-row items-center justify-center p-4">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center px-12">
        <div className="mb-8">
          <img src="/logo.png" alt="Regional Assembly Logo" className="w-16 h-16 object-contain mb-6" />
          <h1 className="text-5xl font-bold font-display text-foreground mb-4">
            Regional Assembly Analytics
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Digital governance and archive management for the North West Regional Assembly
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold">📋</div>
            <div>
              <h3 className="font-semibold text-foreground">Records Management</h3>
              <p className="text-sm text-muted-foreground">Digital storage with OCR, metadata, and lifecycle management</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold">📊</div>
            <div>
              <h3 className="font-semibold text-foreground">Project Monitoring</h3>
              <p className="text-sm text-muted-foreground">Real-time dashboards and interactive analytics</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold">🔒</div>
            <div>
              <h3 className="font-semibold text-foreground">Compliance & Security</h3>
              <p className="text-sm text-muted-foreground">Role-based access and digital signatures</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 md:max-w-sm">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="md:hidden mb-4">
              <img src="/ra-logo.png" alt="Regional Assembly Logo" className="w-12 h-12 object-contain mb-3" />
            </div>
            <CardTitle className="text-2xl">
              {showSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              {showSignUp && (
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    type="text"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@council.gov"
                    type="email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    {showSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  showSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleOAuthSignIn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in with OAuth'}
            </Button>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {showSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignUp(true)}
                    className="text-primary font-semibold hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          This platform requires authentication. Contact your administrator for access.
        </p>
      </div>
    </div>
  )
}
