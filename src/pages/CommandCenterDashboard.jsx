import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { AlertCircle, TrendingUp, Users, Clock, Flag } from 'lucide-react'

export function CommandCenterDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([
    { id: 1, level: 'critical', message: 'Healthcare budget at 67% spend', project: 'Healthcare Access' },
    { id: 2, level: 'warning', message: 'Infrastructure Q4 checkpoint due', project: 'Regional Roads' },
    { id: 3, level: 'info', message: 'Digital gov platform 55% complete', project: 'Digital Initiative' },
  ])

  const projectData = [
    { name: 'Roads', progress: 80, status: 'On Track', team: 18 },
    { name: 'Healthcare', progress: 60, status: 'At Risk', team: 12 },
    { name: 'Digital', progress: 70, status: 'On Track', team: 24 },
    { name: 'Agriculture', progress: 100, status: 'Completed', team: 8 },
  ]

  const chartData = [
    { month: 'Jan', budget: 2000, spent: 1200 },
    { month: 'Feb', budget: 2000, spent: 1400 },
    { month: 'Mar', budget: 2000, spent: 1600 },
    { month: 'Apr', budget: 2000, spent: 1800 },
    { month: 'May', budget: 2000, spent: 2100 },
    { month: 'Jun', budget: 2000, spent: 2300 },
  ]

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
        <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-primary/20 to-accent/20 p-6 rounded-2xl border border-primary/30">
          <div>
            <h1 className="text-5xl font-bold font-display text-foreground">Command Center</h1>
            <p className="text-lg text-muted-foreground mt-2">Regional Assembly Operations Hub</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-right"
          >
            <p className="text-4xl font-bold font-display text-primary">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
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
