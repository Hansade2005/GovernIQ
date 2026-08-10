import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, Eye, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react'

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('quarterly')
  const [selectedDivision, setSelectedDivision] = useState('all')
  const [showExportModal, setShowExportModal] = useState(false)

  // Project progress data
  const projectProgressData = [
    { quarter: 'Q1', roads: 30, healthcare: 15, digital: 25, education: 20 },
    { quarter: 'Q2', roads: 50, healthcare: 30, digital: 40, education: 35 },
    { quarter: 'Q3', roads: 65, healthcare: 45, digital: 55, education: 50 },
    { quarter: 'Q4', roads: 80, healthcare: 60, digital: 70, education: 65 },
  ]

  const monthlyData = [
    { month: 'Jan', roads: 22, healthcare: 10, digital: 18 },
    { month: 'Feb', roads: 28, healthcare: 15, digital: 22 },
    { month: 'Mar', roads: 35, healthcare: 20, digital: 28 },
    { month: 'Apr', roads: 42, healthcare: 25, digital: 35 },
    { month: 'May', roads: 50, healthcare: 30, digital: 40 },
    { month: 'Jun', roads: 58, healthcare: 38, digital: 48 },
  ]

  const budgetAllocationData = [
    { name: 'Infrastructure', value: 8500, fill: '#3B82F6' },
    { name: 'Health & Education', value: 6200, fill: '#EC4899' },
    { name: 'Administration', value: 3200, fill: '#F59E0B' },
    { name: 'Other', value: 2900, fill: '#10B981' },
  ]

  const divisionalPerformance = [
    { division: 'Mezam', completion: 72, budget: 88, satisfaction: 85 },
    { division: 'Momo', completion: 68, budget: 92, satisfaction: 88 },
    { division: 'Menchum', completion: 60, budget: 85, satisfaction: 80 },
    { division: 'Kweneng', completion: 75, budget: 90, satisfaction: 87 },
    { division: 'Boyo', completion: 82, budget: 95, satisfaction: 92 },
    { division: 'Manyu', completion: 70, budget: 87, satisfaction: 84 },
  ]

  const performanceMetrics = [
    { name: 'Project Completion', value: 71, status: 'On Track', trend: '+3%', icon: '📊' },
    { name: 'Budget Efficiency', value: 89, status: 'Excellent', trend: '+2%', icon: '💰' },
    { name: 'Stakeholder Satisfaction', value: 85, status: 'Excellent', trend: '+4%', icon: '👥' },
    { name: 'Risk Mitigation', value: 78, status: 'Good', trend: '+1%', icon: '⚠️' },
  ]

  const getChartData = () => {
    return timeRange === 'monthly' ? monthlyData : projectProgressData
  }

  const handleDownloadReport = (format) => {
    // Simulate report download
    const reportName = `Analytics-Report-${new Date().toISOString().split('T')[0]}.${format}`
    alert(`📥 Report downloaded: ${reportName}\n\nIn a real implementation, this would generate and download a ${format.toUpperCase()} file with all analytics data.`)
    setShowExportModal(false)
  }

  const handleViewDetails = (metric) => {
    alert(`📈 Viewing details for: ${metric}\n\nThis would open a detailed breakdown of this metric with historical trends and comparisons.`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-display text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time project performance metrics and comprehensive analysis</p>
      </div>

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

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowExportModal(!showExportModal)}
          >
            <Download size={16} />
            Export Report
          </Button>
        </div>
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

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, idx) => (
          <Card key={idx} className="hover:border-accent/50 transition">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-muted-foreground font-medium">{metric.name}</h3>
                <span className="text-xl">{metric.icon}</span>
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-3xl font-bold text-foreground">{metric.value}%</div>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp size={14} />
                  {metric.trend}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge label={metric.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewDetails(metric.name)}
                  className="px-2"
                >
                  <Eye size={14} />
                </Button>
              </div>
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
                <XAxis dataKey={timeRange === 'monthly' ? 'month' : 'quarter'} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="roads" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="healthcare" stroke="#EC4899" strokeWidth={2} />
                <Line type="monotone" dataKey="digital" stroke="#F59E0B" strokeWidth={2} />
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
                  label={({ name, value }) => `${name}: ${value}M`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}M FCFA`} />
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
