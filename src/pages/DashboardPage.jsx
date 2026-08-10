import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { MapComponent } from '@/components/MapComponent'
import { ThreeDVisualization } from '@/components/ThreeDVisualization'
import { BarChart3, FileText, CheckCircle, AlertCircle, Zap, TrendingUp, Users, MapPin, DollarSign, Calendar, Play } from 'lucide-react'
import { Button } from '@/components/Button'

const metrics = [
  { label: 'Budget Execution', value: '97.5%', icon: BarChart3, trend: '+2.3%', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Projects Active', value: '31', icon: Zap, trend: '+5 this month', color: 'bg-blue-100 text-blue-700' },
  { label: 'Divisions', value: '7', icon: MapPin, trend: 'All operational', color: 'bg-purple-100 text-purple-700' },
  { label: 'Budget (2026)', value: '20.8B', icon: DollarSign, trend: 'FCFA', color: 'bg-orange-100 text-orange-700' }
]

const divisions = [
  { name: 'Mezam Division', projects: 5, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Menchum Division', projects: 4, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Momo Division', projects: 3, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Boyo Division', projects: 1, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Bui Division', projects: 1, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Donga-Mantung Division', projects: 1, status: 'active', head: 'Divisional Officer (DO)' },
  { name: 'Ngo-Ketunjia Division', projects: 1, status: 'active', head: 'Divisional Officer (DO)' }
]

const recentProjects = [
  {
    id: 1,
    name: 'Wum District Hospital Fence',
    division: 'Mezam',
    contractor: 'Lake Nyos Survival',
    status: 'completed',
    progress: 100,
    budget: '45M FCFA',
    image: '/projects/wum-hospital-fence-1.jpg'
  },
  {
    id: 2,
    name: 'GHS Classroom Blocks',
    division: 'Momo',
    contractor: 'ACONSEP CO LTD',
    status: 'completed',
    progress: 100,
    budget: '120M FCFA',
    image: '/projects/ghs-roofing-1.jpg'
  },
  {
    id: 3,
    name: 'Science Lab Construction',
    division: 'Mezam',
    contractor: 'Regional Contractor',
    status: 'ongoing',
    progress: 75,
    budget: '85M FCFA',
    image: '/projects/ghs-roofing-2.jpg'
  },
  {
    id: 4,
    name: 'Batibo Hospital Rehabilitation',
    division: 'Menchum',
    contractor: 'Infrastructure Partners',
    status: 'ongoing',
    progress: 60,
    budget: '95M FCFA',
    image: '/projects/batibo-hospital-1.jpg'
  }
]

const sessions = [
  { date: 'March 12, 2026', type: 'Full Assembly', items: 8, status: 'completed' },
  { date: 'February 15, 2026', type: 'Committee Hearing', items: 12, status: 'completed' },
  { date: 'January 28, 2026', type: 'Special Session', items: 5, status: 'completed' }
]

export function DashboardPage() {
  const [selectedDivision, setSelectedDivision] = useState(null)

  return (
    <div className="space-y-8">
      {/* Hero Section - Full Title No Truncation */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border border-primary/20 p-8 md:p-12 shadow-lg">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold font-display text-foreground mb-4 tracking-tight leading-tight">
            Regional Governance & Project Management Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            North West Regional Assembly of Cameroon — Real-time project tracking, financial oversight, divisional coordination, and institutional transparency platform
          </p>
          <div className="flex flex-wrap gap-4">
            <Badge label="7 Operational Divisions" icon={MapPin} />
            <Badge label="97.5% Budget Execution" icon={CheckCircle} />
            <Badge label="31 Active Projects" icon={Zap} />
            <Badge label="20.8B FCFA 2026 Budget" icon={DollarSign} />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.color} bg-opacity-10`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold font-display text-foreground">{metric.value}</p>
              </div>
              <p className="text-xs text-accent mt-2 font-medium">{metric.trend}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Division Overview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                7 Divisions & House of Chiefs
              </h2>
              <p className="text-sm text-muted-foreground mt-2">Active operational regions</p>
            </div>

            <div className="space-y-3">
              {divisions.map((div, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-surface-alt/50 transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{div.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Headed by {div.head}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-primary">{div.projects}</div>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-surface rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all"
                      style={{ width: `${(div.projects / 6) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 h-7 flex-1"
                      onClick={() => console.log('View division:', div.name)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs px-2 h-7 flex-1"
                      onClick={() => setSelectedDivision(selectedDivision === idx ? null : idx)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Financial Summary */}
        <div>
          <Card className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-accent" />
              2026 Budget
            </h2>

            <div className="space-y-4 flex-1">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Total Budget</span>
                  <span className="text-lg font-bold text-primary">20.8B FCFA</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Investment</span>
                  <span className="text-lg font-bold text-emerald-600">87.31%</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '87.31%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">18.1B FCFA</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Functioning</span>
                  <span className="text-lg font-bold text-blue-600">12.69%</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '12.69%' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">2.7B FCFA</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-surface-alt/50 rounded-lg border border-accent/20">
              <p className="text-xs text-muted-foreground mb-2">2025 Execution Rate</p>
              <p className="text-2xl font-bold text-accent">97.5%</p>
              <p className="text-xs text-foreground mt-2">10.3B FCFA (adjusted)</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Interactive Map */}
      <MapComponent />

      {/* 3D Visualization */}
      <ThreeDVisualization />

      {/* Recent Projects */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent" />
          Featured Projects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition group"
            >
              <div className="relative h-40 overflow-hidden bg-surface">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3E' + project.name.split(' ')[0] + '%3C/text%3E%3C/svg%3E'
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    label={project.status === 'completed' ? 'Completed' : 'Ongoing'}
                    icon={project.status === 'completed' ? CheckCircle : AlertCircle}
                    variant={project.status === 'completed' ? 'success' : 'warning'}
                  />
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2">{project.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {project.contractor} • {project.division}
                </p>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-foreground">Progress</span>
                    <span className="text-xs font-bold text-primary">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-accent">{project.budget}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 h-7"
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('View project:', project.id)
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-accent" />
          Recent Sessions & Deliberations
        </h2>

        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface-alt/30 transition group">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{session.type}</h3>
                  <p className="text-sm text-muted-foreground">{session.date}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-lg font-bold text-primary">{session.items}</p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-3 h-8"
                  onClick={() => console.log('View session:', idx)}
                >
                  <FileText size={14} className="mr-1" />
                  Minutes
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button className="w-full py-3" onClick={() => console.log('View all sessions')}>
            <FileText className="w-4 h-4 mr-2" />
            View All Sessions
          </Button>
          <Button variant="outline" className="w-full py-3" onClick={() => console.log('Schedule new')}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule New
          </Button>
        </div>
      </Card>
    </div>
  )
}
