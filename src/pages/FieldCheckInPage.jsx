import { useState, useEffect } from 'react'
import { MapPin, Camera, Send, Check, X, Loader, Radio } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { Loading, LoadFailure } from '@/components/QueryState'
import { useQuery } from '@/lib/useRegistry'
import { useSession } from '@/lib/SessionContext'
import { listProjects } from '@/lib/registry'
import {
  fileSiteReport, uploadSitePhoto, readPosition,
  listSiteReports, sinceWhen, SITE_CONDITIONS,
} from '@/lib/siteReports'

/**
 * Field check-in — written for a supervisor standing at the site on a
 * phone, on a poor connection, possibly in the sun.
 *
 * Everything is large, the order matches what they are doing (where am I,
 * what changed, here is the proof), and the page says plainly whether the
 * handset found a position rather than silently filing a report with no
 * coordinates.
 */
export function FieldCheckInPage() {
  const { profile } = useSession()

  const [form, setForm] = useState({
    projectId: '', headline: '', note: '',
    progress: '', workers: '', condition: 'working',
  })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(true)
  const [photos, setPhotos] = useState([])      // { file, preview }
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [filed, setFiled] = useState(null)

  const { data, loading, error: loadError, refresh } = useQuery(async () => {
    const [projects, mine] = await Promise.all([
      listProjects({ limit: 300 }),
      listSiteReports({ limit: 8 }),
    ])
    return { projects, mine }
  }, [])

  // Ask for a position as soon as the page opens; the supervisor is
  // already at the site, so this is almost always what they want.
  useEffect(() => {
    let alive = true
    readPosition().then((p) => { if (alive) { setCoords(p); setLocating(false) } })
    return () => { alive = false }
  }, [])

  const projects = (data?.projects ?? []).filter((p) => p.status === 'ongoing')
  const chosen = projects.find((p) => p.id === form.projectId)

  const addPhotos = (files) => {
    const next = Array.from(files).slice(0, 4 - photos.length).map((file) => ({
      file, preview: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...next])
  }

  const submit = async () => {
    setBusy(true); setError('')
    try {
      const paths = []
      for (let i = 0; i < photos.length; i++) {
        setStage(`Uploading photograph ${i + 1} of ${photos.length}`)
        paths.push(await uploadSitePhoto(photos[i].file))
      }
      setStage('Filing the report')
      const saved = await fileSiteReport({
        projectId: form.projectId,
        projectName: chosen?.name,
        division: chosen?.division,
        progress: form.progress === '' ? undefined : Number(form.progress),
        headline: form.headline,
        note: form.note,
        workersOnSite: form.workers === '' ? undefined : Number(form.workers),
        condition: form.condition,
        coords,
        photoPaths: paths,
        reportedBy: profile?.full_name || profile?.email || 'Site supervisor',
      })
      setFiled(saved)
      setForm({ projectId: '', headline: '', note: '', progress: '', workers: '', condition: 'working' })
      photos.forEach((p) => URL.revokeObjectURL(p.preview))
      setPhotos([])
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false); setStage('')
    }
  }

  if (loading && !data) return <Loading label="Opening the site register" />
  if (loadError && !data) return <LoadFailure error={loadError} onRetry={refresh} />

  return (
    <div className="stagger space-y-6 max-w-2xl">
      <PageHeader
        eyebrow="From the site"
        title="File a report"
        description="What has changed since your last visit. It reaches the Situation Room immediately."
      />

      {filed && (
        <div className="px-3.5 py-3 rounded-[4px] border border-[color:var(--sage)]">
          <p className="flex items-center gap-2 font-semibold text-[color:var(--sage)]">
            <Radio size={14} /> Filed and on the wire
          </p>
          <p className="text-[color:var(--sepia)] mt-1 leading-relaxed">
            “{filed.headline}” is now on the President's board.
          </p>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-[4px] border border-[color:var(--rust)] text-[color:var(--rust)]">
          {error}
        </div>
      )}

      {/* Position */}
      <Card>
        <div className="flex items-start gap-2.5">
          <MapPin size={15} className={coords ? 'text-[color:var(--sage)]' : 'text-[color:var(--brass-ink)]'} />
          <div className="min-w-0 flex-1">
            {locating ? (
              <p className="eyebrow text-[0.55rem]">Finding your position…</p>
            ) : coords ? (
              <>
                <p className="eyebrow text-[0.55rem]">Position recorded</p>
                <p className="mono text-[0.75rem] mt-1">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  {coords.accuracy && (
                    <span className="text-[color:var(--sepia-soft)]"> · ±{Math.round(coords.accuracy)} m</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow text-[0.55rem] text-[color:var(--brass-ink)]">No position</p>
                <p className="text-[color:var(--sepia)] mt-1 leading-relaxed">
                  The report will be filed without coordinates. Allow location
                  access, or carry on — the report still counts.
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => { setLocating(true); readPosition().then((p) => { setCoords(p); setLocating(false) }) }}
            className="btn btn-ghost flex-shrink-0"
            disabled={locating}
          >
            {locating ? <Loader size={13} className="animate-spin" /> : 'Retry'}
          </button>
        </div>
      </Card>

      {/* The report */}
      <Card>
        <div className="space-y-4">
          <div>
            <Label>Which site are you at?</Label>
            <select
              className="field text-base py-2.5"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">Choose a programme…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.division}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>What has changed? (one line)</Label>
            <Input
              className="text-base py-2.5"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="Roof trusses in place on the east wing"
            />
          </div>

          <div>
            <Label>How does the site stand?</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SITE_CONDITIONS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, condition: k })}
                  className={`px-3 py-2.5 rounded-[4px] border text-[0.8125rem] font-medium transition ${
                    form.condition === k
                      ? 'bg-[color:var(--highland)] text-white border-[color:var(--highland)]'
                      : 'border-[color:var(--rule)] text-[color:var(--sepia)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)]'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Progress (%)</Label>
              <Input type="number" min="0" max="100" inputMode="numeric" className="text-base py-2.5"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
                placeholder={chosen ? String(chosen.progress) : '—'} />
            </div>
            <div>
              <Label>Workers on site</Label>
              <Input type="number" min="0" inputMode="numeric" className="text-base py-2.5"
                value={form.workers}
                onChange={(e) => setForm({ ...form, workers: e.target.value })}
                placeholder="0" />
            </div>
          </div>

          <div>
            <Label>Anything else (optional)</Label>
            <textarea
              className="field min-h-[110px] text-base leading-relaxed"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Weather, deliveries, anything holding the work up."
            />
          </div>

          {/* Photographs */}
          <div>
            <Label>Photographs ({photos.length} of 4)</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p.preview} alt="" className="h-24 w-24 object-cover rounded-[4px] border border-[color:var(--rule)]" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.preview)
                      setPhotos(photos.filter((_, j) => j !== i))
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[color:var(--rust)] text-white flex items-center justify-center"
                    aria-label="Remove photograph"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <label className="h-24 w-24 rounded-[4px] border border-dashed border-[color:var(--rule-firm)] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[color:var(--ink)] text-[color:var(--sepia)]">
                  <Camera size={18} />
                  <span className="text-[0.65rem]">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={submit} disabled={busy} className="w-full justify-center py-3 text-base">
              {busy ? <><Loader size={15} className="animate-spin" /> {stage || 'Filing…'}</>
                    : <><Send size={15} /> File the report</>}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recently filed */}
      {data.mine.length > 0 && (
        <Card>
          <div className="panel-head">
            <p className="eyebrow">Recently filed</p>
          </div>
          <div className="space-y-2.5">
            {data.mine.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium truncate">{r.headline}</p>
                  <p className="mono text-[0.65rem] text-[color:var(--sepia-soft)] mt-0.5 truncate">
                    {r.project_name}
                  </p>
                </div>
                <span className="mono text-[0.65rem] text-[color:var(--sepia-soft)] flex-shrink-0">
                  {sinceWhen(r.reported_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
