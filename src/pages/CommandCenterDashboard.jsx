import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { AlertCircle, TrendingUp, Users, Clock, Flag } from 'lucide-react'
import { listAlerts, getPortfolioSummary, getSeries } from '@/lib/registry'

export function CommandCenterDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([])
  const [projectData, setProjectData] = useState([])
  const [chartData, setChartData] = useState([])

  // The command centre reads the same registry as every other view, so
  // what it flags is what the roll actually says.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [alertRows, summary, series] = await Promise.all([
          listAlerts(), getPortfolioSummary(), getSeries('monthly'),
        ])
        if (!alive) return

        setAlerts(alertRows.map((a) => ({
          id: a.id,
          level: a.level,
          message: a.message || a.title,
          project: a.source || a.title,
        })))

        // Roll the portfolio up by category for the status bars.
        const byCat = {}
        for (const p of summary.projects) {
          const k = p.category || 'Other'
          byCat[k] ??= { name: k, progress: 0, count: 0 }
          byCat[k].progress += p.progress || 0
          byCat[k].count += 1
        }
        setProjectData(Object.values(byCat).map((c) => {
          const progress = Math.round(c.progress / c.count)
          return {
            name: c.name,
            progress,
            status: progress >= 100 ? 'Completed' : progress >= 65 ? 'On Track' : 'At Risk',
            team: c.count,
          }
        }))

        // Budget against disbursement, in millions of FCFA.
        const budgetM = Math.round(summary.budget / 1_000_000)
        setChartData(series.map((row, i) => ({
          month: row.period,
          budget: budgetM,
          spent: Math.round((summary.spent / 1_000_000) * ((i + 1) / series.length)),
        })))
      } catch (err) {
        console.warn('[command centre]', err.message)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getAlertColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
      case 'warning': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
      case 'info': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface-alt p-4 md:p-8">
      {/* TV Display Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-6 pb-8 border-b border-[color:var(--rule)]">
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <p className="eyebrow">Live · Operations</p>
              <span className="ornament-mark" aria-hidden />
            </div>
            <h1 className="serif text-[clamp(2.5rem,5vw,4.75rem)] font-light leading-[0.98] tracking-tight">
              The <span className="italic text-[color:var(--highland)]">Command</span> Centre.
            </h1>
            <div className="ornament ornament-draw mt-5 max-w-sm" aria-hidden />
            <p className="mt-4 text-[color:var(--sepia)] max-w-2xl leading-relaxed">
              A live tableau of the North West Regional Assembly — flagged items, incidents, and consequential decisions of the hour.
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-[0.6rem]">Chamber time</p>
            <p className="figure text-5xl mt-2 figure-brass tabular-nums">
              {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="mono text-[0.7rem] text-[color:var(--sepia)] mt-2">
              {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Critical Alerts Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold font-display text-foreground mb-4 flex items-center gap-2">
          <Flag size={28} className="text-destructive" />
          Flagged Items & Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className={`border-2 ${getAlertColor(alert.level)}`}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle size={28} className="flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-lg mb-1">{alert.message}</p>
                      <p className="text-sm opacity-75">{alert.project}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Projects Status Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold font-display text-foreground mb-4">Project Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projectData.map((project, idx) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              whileHover={{ scale: 1.03 }}
            >
              <Card className="hover:shadow-2xl transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-display text-foreground">{project.name}</h3>
                      <Badge className={
                        project.status === 'On Track' ? 'bg-green-500/20 text-green-700' :
                        project.status === 'Completed' ? 'bg-blue-500/20 text-blue-700' :
                        'bg-yellow-500/20 text-yellow-700'
                      }>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold">Progress</span>
                        <span className="text-sm font-bold text-accent">{project.progress}%</span>
                      </div>
                      <motion.div
                        className="w-full bg-muted rounded-full h-3 overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="bg-gradient-to-r from-primary to-accent h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ delay: 0.5 + idx * 0.1, duration: 1.5 }}
                        />
                      </motion.div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">{project.team} team members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Budget Tracking */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={24} />
                Budget Trend (XAF Millions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="budget" stroke="#6B6FA6" strokeWidth={3} name="Budget" />
                  <Line type="monotone" dataKey="spent" stroke="#DD7E42" strokeWidth={3} name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Analysis */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={24} />
                Monthly Spending Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="budget" fill="#6B6FA6" name="Budgeted" />
                  <Bar dataKey="spent" fill="#DD7E42" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Status Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 bg-green-500 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="font-semibold">System Status: Online</span>
              </div>
              <div>Last Updated: {currentTime.toLocaleTimeString()}</div>
              <div>Platform Version: 2.1 | Display Mode: Command Center</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
