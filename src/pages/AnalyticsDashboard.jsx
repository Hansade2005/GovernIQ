import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, Eye, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { useQuery } from '@/lib/useRegistry'
import { Loading, LoadFailure } from '@/components/QueryState'
import {
  getSeries, listDivisionPerformance, listProjects,
  getPortfolioSummary, formatFcfa,
} from '@/lib/registry'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('quarterly')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [showExportModal, setShowExportModal] = useState(false)

  const { data, loading, error, refresh } = useQuery(async () => {
    const [quarterly, monthly, performance, summary] = await Promise.all([
      getSeries('quarterly'),
      getSeries('monthly'),
      listDivisionPerformance(2026),
      getPortfolioSummary(),
    ])
    return { quarterly, monthly, performance, summary }
  }, [])

  const quarterly = data?.quarterly ?? []
  const monthly = data?.monthly ?? []
  const divisionalPerformance = (data?.performance ?? []).map((d) => ({
    division: d.division,
    completion: d.completion,
    budget: d.budget_score,
    satisfaction: d.satisfaction,
  }))
  const summary = data?.summary

  // Budget split by programme category, computed from the roll itself.
  const budgetAllocationData = (() => {
    if (!summary) return []
    const palette = { Infrastructure: '#1B3B2F', Health: '#B0431F', Education: '#A88028', Digital: '#4F7A5C' }
    const byCat = {}
    for (const p of summary.projects) {
      const key = p.category || 'Other'
      byCat[key] = (byCat[key] || 0) + Number(p.budget_fcfa || 0)
    }
    return Object.entries(byCat).map(([name, value]) => ({
      name,
      value: Math.round(value / 1_000_000),
      fill: palette[name] || '#6B6452',
    }))
  })()

  const performanceMetrics = summary ? [
    { name: 'Programme completion', value: summary.avgProgress, status: summary.avgProgress >= 70 ? 'On track' : 'Needs attention', trend: '+3%' },
    { name: 'Budget utilisation',   value: summary.utilisation, status: summary.utilisation >= 80 ? 'Excellent' : 'On track', trend: '+2%' },
    { name: 'Completed programmes', value: summary.total ? Math.round(summary.completed / summary.total * 100) : 0, status: 'Reported', trend: '+4%' },
    { name: 'Programmes at risk',   value: summary.total ? Math.round(summary.atRisk.length / summary.total * 100) : 0, status: summary.atRisk.length ? 'Monitor' : 'Clear', trend: '-1%' },
  ] : []

  // Project progress data
  const getChartData = () => (timeRange === 'monthly' ? monthly : quarterly)

  const handleDownloadReport = (format) => {
    // Simulate report download
    const reportName = `Analytics-Report-${new Date().toISOString().split('T')[0]}.${format}`
    alert(`📥 Report downloaded: ${reportName}\n\nIn a real implementation, this would generate and download a ${format.toUpperCase()} file with all analytics data.`)
    setShowExportModal(false)
  }

  const handleViewDetails = (metric) => {
    alert(`📈 Viewing details for: ${metric}\n\nThis would open a detailed breakdown of this metric with historical trends and comparisons.`)
  }

  if (loading && !data) return <Loading label="Compiling analytics" />
  if (error && !data) return <LoadFailure error={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Programmes"
        title="Analytics"
        description="Programme execution, budget efficiency, and divisional performance across the seven divisions."
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(!showExportModal)}>
            <Download size={14} />
            Export
          </Button>
        }
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['monthly', 'quarterly', 'yearly'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>

        <span className="eyebrow">Reporting period</span>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <Card className="border-accent/50 bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Export Analytics Report</h3>
            <button
              onClick={() => setShowExportModal(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['pdf', 'excel', 'csv'].map(format => (
              <Button
                key={format}
                variant="outline"
                size="sm"
                onClick={() => handleDownloadReport(format)}
                className="text-xs"
              >
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, idx) => (
          <Card key={idx}>
            <p className="eyebrow text-[0.6rem]">{metric.name}</p>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span className="figure text-3xl figure-highland">{metric.value}</span>
              <span className="mono text-xs text-[color:var(--sepia-soft)]">%</span>
              <span className="flex items-center gap-1 ml-auto mono text-[0.7rem] text-[color:var(--sage)]">
                <TrendingUp size={11} strokeWidth={2.25} />
                {metric.trend}
              </span>
            </div>
            <div className="progress-track mt-3">
              <div className="progress-fill" style={{ width: `${metric.value}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge variant={metric.value >= 85 ? 'success' : 'secondary'}>{metric.status}</Badge>
              <button
                onClick={() => handleViewDetails(metric.name)}
                className="text-[color:var(--sepia)] hover:text-[color:var(--ink)] transition p-1 rounded-[2px]"
                aria-label={`Details for ${metric.name}`}
              >
                <Eye size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress Over Time */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Project Progress Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="roads" stroke="#1B3B2F" strokeWidth={2} />
                <Line type="monotone" dataKey="healthcare" stroke="#B54923" strokeWidth={2} />
                <Line type="monotone" dataKey="digital" stroke="#A88028" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Allocation */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Budget Allocation (2026)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetAllocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={92}
                  dataKey="value"
                >
                  {budgetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}M FCFA`} />
                {/* Labels drawn outside the arcs were clipped by the card at
                    narrow widths — and this view is projected on a wall, where
                    a half-cut figure reads as a broken chart. The legend below
                    always fits. */}
                <Legend
                  verticalAlign="bottom"
                  formatter={(value, entry) => `${value} · ${entry?.payload?.value}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Divisional Performance */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Divisional Performance Comparison</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={16} />
              Filter
            </Button>
          </div>

          <div className="space-y-4">
            {divisionalPerformance.map((div, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 hover:border-accent/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{div.division} Division</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => alert(`📊 Viewing detailed performance for ${div.division} Division`)}
                  >
                    <Eye size={16} />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Completion Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Completion</span>
                      <span className="text-sm font-bold text-foreground">{div.completion}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${div.completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Budget Exec.</span>
                      <span className="text-sm font-bold text-foreground">{div.budget}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${div.budget}%` }}
                      />
                    </div>
                  </div>

                  {/* Satisfaction */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Satisfaction</span>
                      <span className="text-sm font-bold text-foreground">{div.satisfaction}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${div.satisfaction}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="border-accent/50 bg-accent/5">
        <div className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="text-2xl">✓</div>
              <div>
                <p className="font-semibold text-foreground mb-1">Strong Budget Execution</p>
                <p className="text-sm text-muted-foreground">89% budget efficiency across all projects, exceeding targets</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="font-semibold text-foreground mb-1">Schedule Monitoring</p>
                <p className="text-sm text-muted-foreground">Some projects showing minor delays; contractor follow-up needed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">👥</div>
              <div>
                <p className="font-semibold text-foreground mb-1">High Stakeholder Satisfaction</p>
                <p className="text-sm text-muted-foreground">85% satisfaction rate; community engagement effective</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">📈</div>
              <div>
                <p className="font-semibold text-foreground mb-1">Consistent Growth Trend</p>
                <p className="text-sm text-muted-foreground">Quarterly progress increasing; all sectors showing positive momentum</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
