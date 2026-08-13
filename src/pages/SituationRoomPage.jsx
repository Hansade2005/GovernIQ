import { useState, useEffect, useRef, useCallback } from 'react'
import { Radio, MapPin, Users, AlertTriangle, RefreshCw, WifiOff, Camera } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Loading, LoadFailure } from '@/components/QueryState'
import { LiveWalkthroughs } from '@/components/LiveWalkthroughs'
import { useQuery } from '@/lib/useRegistry'
import { listProjects } from '@/lib/registry'
import { watchSites } from '@/lib/live'
import {
  listSiteReports, summariseLive, sinceWhen, sitePhotoUrl, SITE_CONDITIONS,
} from '@/lib/siteReports'

/**
 * The Situation Room — what is happening across the region, now.
 *
 * The board reads the register on load and then holds a live wire open.
 * A report filed at a site anywhere in the North West appears here within
 * about a second, without a refresh.
 *
 * The measure that matters to a President is not how many reports arrived
 * but how many active sites did NOT report today — silence is the signal
 * that something has gone wrong, so it is given as much room as activity.
 */

const CONDITION_VARIANT = {
  working: 'success',
  halted: 'accent',
  blocked: 'destructive',
  complete: 'primary',
}

export function SituationRoomPage() {
  const [live, setLive] = useState([])       // arrived over the wire this session
  const [connected, setConnected] = useState(false)
  const [flash, setFlash] = useState(null)   // id of the newest arrival
  const seen = useRef(new Set())

  const { data, loading, error, refresh } = useQuery(async () => {
    const [reports, projects] = await Promise.all([
      listSiteReports({ limit: 120 }),
      listProjects({ limit: 300 }),
    ])
    return { reports, projects }
  }, [])

  const onReport = useCallback((payload) => {
    if (!payload?.id || seen.current.has(payload.id)) return
    seen.current.add(payload.id)
    setLive((prev) => [payload, ...prev])
    setFlash(payload.id)
    setTimeout(() => setFlash((f) => (f === payload.id ? null : f)), 6000)
  }, [])

  useEffect(() => {
    const stop = watchSites(onReport)
    setConnected(true)
    return () => { stop(); setConnected(false) }
  }, [onReport])

  if (loading && !data) return <Loading label="Opening the situation room" />
  if (error && !data) return <LoadFailure error={error} onRetry={refresh} />

  // Live arrivals sit on top of what was read from the register.
  const stored = data.reports.filter((r) => !seen.current.has(r.id))
  const reports = [...live, ...stored]
  const s = summariseLive(reports, data.projects)

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Live"
        title="Situation room"
        description="Reports filed from the sites themselves, as they arrive. Every programme in every registered division."
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[color:var(--rule)]">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[color:var(--sage)] animate-pulse' : 'bg-[color:var(--rust)]'}`} />
              <span className="eyebrow text-[0.5rem]">{connected ? 'On the wire' : 'Off the wire'}</span>
            </span>
            <button onClick={refresh} className="btn btn-outline" title="Re-read the register">
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      {/* Standing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="eyebrow text-[0.6rem]">Sites reporting today</p>
          <p className="figure text-3xl mt-2 figure-highland">
            {s.sitesReportingToday}
            <span className="mono text-sm text-[color:var(--sepia-soft)]"> / {s.activeSites}</span>
          </p>
          <div className="progress-track mt-3">
            <div className="progress-fill" style={{ width: `${s.activeSites ? (s.sitesReportingToday / s.activeSites) * 100 : 0}%` }} />
          </div>
        </Card>
        <Card>
          <p className="eyebrow text-[0.6rem]">Reports in 24 hours</p>
          <p className="figure text-3xl mt-2 figure-highland">{s.reportsToday}</p>
        </Card>
        <Card>
          <p className="eyebrow text-[0.6rem]">Workers on site</p>
          <p className="figure text-3xl mt-2 figure-brass">{s.workersOnSite}</p>
        </Card>
        <Card>
          <p className="eyebrow text-[0.6rem]">Sites in trouble</p>
          <p className={`figure text-3xl mt-2 ${s.trouble.length ? 'figure-kola' : 'figure-highland'}`}>
            {s.trouble.length}
          </p>
        </Card>
      </div>

      {/* Live pictures, when a supervisor is walking a site */}
      <LiveWalkthroughs />

      {/* Silence is the signal */}
      {s.silent.length > 0 && (
        <Card className="border-[color:var(--brass-ink)]">
          <div className="flex items-start gap-2.5">
            <WifiOff size={15} className="text-[color:var(--brass-ink)] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold">
                {s.silent.length} active programme{s.silent.length === 1 ? '' : 's'} filed nothing today
              </p>
              <p className="text-[color:var(--sepia)] mt-1 leading-relaxed">
                Silence from a site is not the same as calm. These are the ones to ask about.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {s.silent.map((p) => (
                  <span key={p.id} className="stamp text-[color:var(--brass-ink)]">
                    {p.name.length > 38 ? p.name.slice(0, 38) + '…' : p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Trouble */}
      {s.trouble.length > 0 && (
        <Card className="border-[color:var(--rust)]">
          <div className="panel-head">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[color:var(--rust)]" />
              <p className="eyebrow text-[color:var(--rust)]">Halted or blocked</p>
            </div>
          </div>
          <div className="space-y-3">
            {s.trouble.map((r) => (
              <div key={r.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[0.875rem]">{r.project_name}</p>
                  <p className="text-[color:var(--sepia)] mt-0.5">{r.headline}</p>
                </div>
                <Badge variant={CONDITION_VARIANT[r.condition]}>
                  {SITE_CONDITIONS[r.condition]?.label || r.condition}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* The wire */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Radio size={14} className="text-[color:var(--kola)]" />
          <p className="eyebrow">From the sites</p>
          {live.length > 0 && (
            <span className="stamp text-[color:var(--sage)]">
              {live.length} live this session
            </span>
          )}
        </div>

        {reports.length === 0 ? (
          <Card>
            <p className="text-[color:var(--sepia)]">
              No site has filed a report yet. They appear here the moment one does.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 40).map((r) => {
              const isNew = flash === r.id
              return (
                <Card
                  key={r.id}
                  className={`transition-colors duration-700 ${isNew ? 'border-[color:var(--kola)] bg-[color:var(--linen)]' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[0.9375rem] font-semibold">{r.headline}</h3>
                        <Badge variant={CONDITION_VARIANT[r.condition]}>
                          {SITE_CONDITIONS[r.condition]?.label || r.condition}
                        </Badge>
                        {isNew && <span className="stamp text-[color:var(--kola)]">just in</span>}
                      </div>

                      <p className="mono text-[0.7rem] text-[color:var(--sepia-soft)] mt-1.5">
                        {r.project_name}{r.division ? ` · ${r.division} Division` : ''}
                      </p>

                      {r.note && (
                        <p className="text-[color:var(--sepia)] mt-2 leading-relaxed">{r.note}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 mono text-[0.7rem] text-[color:var(--sepia-soft)]">
                        <span className="text-[color:var(--ink)]">{sinceWhen(r.reported_at)}</span>
                        {r.reported_by && <span>{r.reported_by}</span>}
                        {typeof r.workers_on_site === 'number' && (
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {r.workers_on_site} on site
                          </span>
                        )}
                        {r.latitude != null && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}
                          </span>
                        )}
                        {typeof r.progress === 'number' && <span>{r.progress}% complete</span>}
                      </div>

                      {Array.isArray(r.photo_paths) && r.photo_paths.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {r.photo_paths.map((p) => (
                            <a
                              key={p}
                              href={sitePhotoUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <img
                                src={sitePhotoUrl(p)}
                                alt=""
                                className="h-20 w-28 object-cover rounded-[3px] border border-[color:var(--rule)]"
                                loading="lazy"
                              />
                            </a>
                          ))}
                          <span className="flex items-center gap-1 eyebrow text-[0.5rem] flex-shrink-0">
                            <Camera size={10} /> from site
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
