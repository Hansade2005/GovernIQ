import { useState } from 'react'
import { Plus, Shield, Trash2, X, Lock } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { Loading, LoadFailure } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { useSession } from '@/lib/SessionContext'
import {
  listProfiles, upsertProfile, setRole, removeProfile,
  ROLES, ROLE_KEYS,
} from '@/lib/roles'

const blank = () => ({ email: '', full_name: '', role: 'member', title: '', division: '' })

export function UsersPage() {
  const { isSuperadmin, profile } = useSession()
  const [adding, setAdding] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { data, loading, error: loadError, refresh } = useQuery(() => listProfiles(), [])
  const rows = data ?? []

  if (!isSuperadmin) {
    return (
      <div className="stagger space-y-6">
        <PageHeader eyebrow="Administration" title="Users" />
        <Card>
          <p className="flex items-center gap-2 text-[color:var(--sepia)]">
            <Lock size={14} className="flex-shrink-0" />
            The roll of users is kept by the superadmin. Ask them to change an
            account's capacity.
          </p>
        </Card>
      </div>
    )
  }

  if (loading && !data) return <Loading label="Opening the roll of users" />
  if (loadError && !data) return <LoadFailure error={loadError} onRetry={refresh} />

  const run = async (fn, ...args) => {
    setBusy(true); setError('')
    try { await fn(...args); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  const save = async () => {
    if (!adding.email.trim()) { setError('An email address is required.'); return }
    await run(upsertProfile, adding)
    if (!error) setAdding(null)
  }

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & capacities"
        description="Who may sign in, and in what capacity. A capacity decides which registers a person sees and whether they may write to them."
        actions={
          <Button onClick={() => { setAdding(blank()); setError('') }}>
            <Plus size={14} /> Add a user
          </Button>
        }
      />

      {error && (
        <div className="px-3 py-2 rounded-[4px] border border-[color:var(--rust)] text-[color:var(--rust)]">
          {error}
        </div>
      )}

      {adding && (
        <Card>
          <div className="panel-head">
            <div>
              <p className="eyebrow">New user</p>
              <h3 className="text-[1.0625rem] font-semibold mt-1">Grant access</h3>
            </div>
            <button onClick={() => setAdding(null)} className="btn btn-ghost" aria-label="Cancel">
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={adding.email} placeholder="member@nwra.cm"
                onChange={(e) => setAdding({ ...adding, email: e.target.value })} />
              <p className="text-[0.7rem] text-[color:var(--sepia)] mt-1">
                Must match the address they sign in with.
              </p>
            </div>
            <div>
              <Label>Full name</Label>
              <Input value={adding.full_name}
                onChange={(e) => setAdding({ ...adding, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Capacity</Label>
              <select className="field" value={adding.role}
                onChange={(e) => setAdding({ ...adding, role: e.target.value })}>
                {ROLE_KEYS.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
              </select>
              <p className="text-[0.7rem] text-[color:var(--sepia)] mt-1">
                {ROLES[adding.role].description}
              </p>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={adding.title} placeholder="Clerk of the Assembly"
                onChange={(e) => setAdding({ ...adding, title: e.target.value })} />
            </div>
            <div>
              <Label>Division (optional)</Label>
              <Input value={adding.division} placeholder="Mezam"
                onChange={(e) => setAdding({ ...adding, division: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t border-[color:var(--rule)]">
            <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Grant access'}</Button>
            <Button variant="outline" onClick={() => setAdding(null)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* What each capacity carries */}
      <Card>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Reference</p>
            <h3 className="text-[1.0625rem] font-semibold mt-1">What each capacity carries</h3>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_KEYS.map((r) => (
            <div key={r} className="px-3 py-2.5 rounded-[4px] border border-[color:var(--rule)]">
              <p className="font-semibold text-[0.8125rem]">{ROLES[r].label}</p>
              <p className="text-[color:var(--sepia)] mt-1 leading-relaxed">{ROLES[r].description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* The roll */}
      <Card>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Roll of users</p>
            <h3 className="text-[1.0625rem] font-semibold mt-1">{rows.length} accounts</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data w-full">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Capacity</th><th>Division</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.email}>
                  <td>
                    <span className="font-medium">{p.full_name || '—'}</span>
                    {p.title && <span className="block text-[0.7rem] text-[color:var(--sepia)]">{p.title}</span>}
                  </td>
                  <td className="mono text-[0.75rem]">
                    {p.email}
                    {p.email === profile?.email && (
                      <span className="eyebrow text-[0.5rem] ml-2">you</span>
                    )}
                  </td>
                  <td>
                    {p.standing ? (
                      <span className="flex items-center gap-1.5">
                        <Badge variant="primary">{ROLES[p.role]?.label || p.role}</Badge>
                        <span title="Standing superadmin — fixed in code so the platform cannot be locked out">
                          <Shield size={12} className="text-[color:var(--brass-ink)]" />
                        </span>
                      </span>
                    ) : (
                      <select
                        className="field py-1 text-[0.75rem]"
                        value={p.role}
                        disabled={busy}
                        onChange={(e) => run(setRole, p.email, e.target.value)}
                      >
                        {ROLE_KEYS.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
                      </select>
                    )}
                  </td>
                  <td>{p.division || '—'}</td>
                  <td>
                    {!p.standing && (
                      <button
                        className="p-1.5 rounded-[3px] text-[color:var(--rust)] hover:bg-[color:var(--linen)]"
                        aria-label={`Remove ${p.email}`}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Remove ${p.email}? They will fall back to read-only access.`)) {
                            run(removeProfile, p.email)
                          }
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="eyebrow text-[0.5rem] mt-4 pt-3 border-t border-[color:var(--rule)] leading-relaxed">
          A standing superadmin is fixed in code and cannot be demoted or removed here,
          so a mistaken edit can never lock the platform out. Anyone signing in without
          a row on this roll gets read-only access.
        </p>
      </Card>
    </div>
  )
}
