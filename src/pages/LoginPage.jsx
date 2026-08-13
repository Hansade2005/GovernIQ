import { useState } from 'react'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { pp } from '@/lib/pipilot'
import { AlertCircle, Loader } from 'lucide-react'

/**
 * Sign-in — a bound title page. Left column: the institutional
 * cartouche (motto, ornament, three parliamentary functions). Right
 * column: a spare Hansard-style form.
 */
export function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await pp.auth.signUpWithPassword({
          email, password, name: name || email.split('@')[0],
        })
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

  const handleOAuth = async () => {
    setError('')
    setLoading(true)
    try { await pp.auth.signIn(); onSuccess() }
    catch (err) { setError(err.message || 'OAuth failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[color:var(--paper)] text-[color:var(--ink)] flex flex-col">
      {/* Ornamental top rule */}
      <div className="ornament ornament-draw" aria-hidden />

      <div className="flex-1 grid md:grid-cols-[1.15fr_1fr] max-w-7xl mx-auto w-full">
        {/* Cartouche */}
        <section className="ceremonial hidden md:flex flex-col justify-between px-10 lg:px-16 py-14 border-r border-[color:var(--rule)] relative">
          <div className="stagger">
            <div className="flex items-center gap-3">
              <img src="/nwra-logo.png" alt="" className="h-11 w-11 object-contain" aria-hidden />
              <div>
                <p className="eyebrow">North West Regional Assembly</p>
                <p className="mono text-[0.7rem] text-[color:var(--sepia)] mt-0.5">
                  Law No. 024 · 24 December 2019
                </p>
              </div>
            </div>

            <h1 className="mt-9 serif display-xl">
              A Chamber<br/>
              <span className="italic text-[color:var(--highland)]">for the</span><br/>
              Grassfields.
            </h1>

            <div className="ornament mt-7 max-w-[240px]" aria-hidden />

            <p className="mt-7 text-[color:var(--sepia)] max-w-md leading-relaxed">
              GovernIQ is the digital register of the North West Regional
              Assembly of Cameroon — where deliberations are recorded,
              programmes are tracked, and the seven divisions govern in
              concert from Bamenda.
            </p>

            <div className="mt-12 grid gap-6 max-w-md">
              {[
                { n: '01', t: 'Registry', d: 'A single, searchable archive of every minute, motion, and ministerial report.' },
                { n: '02', t: 'Programmes', d: 'Live execution of the regional budget across all seven divisions.' },
                { n: '03', t: 'Analytics', d: 'Evidence for the floor, not decoration for a slide.' },
              ].map((row) => (
                <div key={row.n} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="mono text-xs tracking-widest text-[color:var(--brass)] pt-0.5">{row.n}</span>
                  <div>
                    <p className="serif text-base leading-tight">{row.t}</p>
                    <p className="text-xs text-[color:var(--sepia)] mt-1 leading-relaxed">{row.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-8 mt-8 border-t border-[color:var(--rule)]">
            <span className="eyebrow">Volume II · Session 2026</span>
            <span className="mono text-xs text-[color:var(--sepia)]">
              {new Date().toLocaleDateString('en-GB')}
            </span>
          </div>
        </section>

        {/* Form */}
        <section className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-16">
          <div className="md:hidden mb-10 flex items-center gap-3">
            <img src="/nwra-logo.png" alt="" className="h-10 w-10 object-contain" aria-hidden />
            <span className="eyebrow">NW Regional Assembly</span>
          </div>

          <div className="ceremonial max-w-sm w-full mx-auto md:mx-0">
            <p className="eyebrow">{mode === 'signup' ? 'New credential' : 'Present credentials'}</p>
            <h2 className="serif text-4xl mt-3 mb-2">
              {mode === 'signup' ? 'Take the oath.' : 'Take the floor.'}
            </h2>
            <p className="text-sm text-[color:var(--sepia)] mb-8">
              {mode === 'signup'
                ? 'Register for chamber access. An administrator will confirm your role.'
                : 'Sign in to enter the chamber, registry, and programmes.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <Label>Honourable</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    type="text"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@council.gov"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <Label htmlFor="password" className="mb-0">Password</Label>
                  {mode === 'signin' && (
                    <a href="#/reset" className="text-[0.7rem] mono text-[color:var(--sepia)] hover:text-[color:var(--ink)]">
                      Forgot
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </div>

              {error && (
                <div className="flex gap-2 px-3 py-2 border border-[color:var(--rust)] text-[color:var(--rust)] text-xs rounded-[2px]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-2.5"
                disabled={loading}
              >
                {loading ? (
                  <><Loader size={14} className="animate-spin" /> Verifying…</>
                ) : (
                  mode === 'signup' ? 'Register for access' : 'Sign in →'
                )}
              </Button>
            </form>

            <div className="my-6 rule-centered">
              <span className="eyebrow text-[0.6rem]">or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={handleOAuth}
              disabled={loading}
            >
              Continue with single sign-on
            </Button>

            <div className="mt-8 pt-6 border-t border-[color:var(--rule)] text-sm text-[color:var(--sepia)]">
              {mode === 'signup' ? (
                <>Already sworn in?{' '}
                  <button type="button" onClick={() => setMode('signin')} className="text-[color:var(--kola)] hover:underline">Sign in</button>
                </>
              ) : (
                <>New to the chamber?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-[color:var(--kola)] hover:underline">Request access</button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[color:var(--rule)] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow text-[0.6rem]">
          North West Regional Assembly · Up Station, Bamenda
        </p>
        <p className="mono text-[0.65rem] text-[color:var(--sepia)]">
          info@nwra.cm · +237 233 362 100
        </p>
      </footer>
    </div>
  )
}
