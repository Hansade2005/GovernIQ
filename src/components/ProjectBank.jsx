import { useState, useEffect } from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock, MapPin, Building2, Users, FileText, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { listProjects, formatFcfa } from '@/lib/registry'


export function ProjectBank() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expandedProject, setExpandedProject] = useState(null)

  // Load projects from database
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await listProjects({ limit: 200 })
        
        if (data && data.length > 0) {
          setProjects(data)
          setFilteredProjects(data)
          console.log(`Loaded ${data.length} projects from database`)
        } else {
          console.info('No projects found in database, using fallback data')
          setProjects([])
          setFilteredProjects([])
        }
      } catch (err) {
        console.error('Error loading projects:', err)
        setError('Could not load projects from database, using fallback data')
        setProjects([])
        setFilteredProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = projects

    if (searchTerm) {
      // Contractor and location are nullable on the registry row, so a
      // programme entered without them must not break the search.
      const term = searchTerm.toLowerCase()
      const has = (v) => String(v || '').toLowerCase().includes(term)
      filtered = filtered.filter(p => has(p.name) || has(p.contractor) || has(p.location))
    }

    if (selectedDivision) {
      filtered = filtered.filter(p => p.division === selectedDivision)
    }

    if (selectedStatus) {
      filtered = filtered.filter(p => p.status === selectedStatus)
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    setFilteredProjects(filtered)
  }, [searchTerm, selectedDivision, selectedStatus, selectedCategory, projects])

  /* Budget is a bigint in FCFA on the registry row, not the free-text
     string this component was written against, so it is summed directly.
     Execution is derived from what has actually been disbursed rather
     than read from a column that no longer exists. */
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget_fcfa || 0), 0)
  const totalSpent = projects.reduce((sum, p) => sum + Number(p.spent_fcfa || 0), 0)

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'ongoing').length,
    avgProgress: projects.length
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0,
    totalBudget,
    avgExecution: totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0,
  }

  const divisions = [...new Set(projects.map(p => p.division))].sort()
  const categories = [...new Set(projects.map(p => p.category))].sort()

  const getStatusBadge = (status) => {
    return status === 'completed' ? 'success' : 'warning'
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500'
    if (progress >= 60) return 'from-blue-500 to-cyan-500'
    if (progress >= 40) return 'from-yellow-500 to-amber-500'
    return 'from-red-500 to-orange-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-accent" />
            Project Bank
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            2026 NWRA BIP Infrastructure Projects Portfolio
            {!loading && !error && projects.length > 0 && (
              <span className="ml-2 inline-block px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                Live Data
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Avg Progress</div>
          <div className="text-2xl font-bold text-accent">{stats.avgProgress}%</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-purple-600">{formatFcfa(stats.totalBudget)}</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Avg Execution</div>
          <div className="text-2xl font-bold text-teal-600">{stats.avgExecution}%</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-card">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Search Projects</label>
            <input
              type="text"
              placeholder="Search by name, contractor, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Divisions</option>
                {divisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-primary animate-spin mr-2" />
          <span className="text-muted-foreground">Loading projects from database...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-700">
          {error}
        </div>
      )}

      {/* Project Cards */}
      {!loading && (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No projects match your filters</p>
            </Card>
          ) : (
            filteredProjects.map(project => (
              <Card key={project.id} className="p-6 bg-card hover:shadow-md transition-shadow">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                      <Badge variant={getStatusBadge(project.status)}>
                        {project.status === 'completed' ? '✅ Completed' : '🔄 In Progress'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {project.division}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.contractor}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                    className="p-2 hover:bg-background rounded-lg transition-colors"
                  >
                    {expandedProject === project.id ? (
                      <ChevronUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Progress Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold mb-1">PROGRESS</div>
                    <div className="text-lg font-bold text-foreground">{project.progress}%</div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressColor(project.progress)}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold mb-1">BUDGET</div>
                    <div className="text-lg font-bold text-foreground">{formatFcfa(project.budget_fcfa)}</div>
                    <div className="text-xs text-muted-foreground">Total allocation</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold mb-1">SPENT</div>
                    <div className="text-lg font-bold text-foreground">{formatFcfa(project.spent_fcfa)}</div>
                    <div className="text-xs text-muted-foreground">
                      {project.budget_fcfa
                        ? Math.round((Number(project.spent_fcfa || 0) / Number(project.budget_fcfa)) * 100)
                        : 0}% utilised
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold mb-1">CATEGORY</div>
                    <Badge className="bg-accent/10 text-accent border-accent/30">
                      {project.category}
                    </Badge>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedProject === project.id && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">START DATE</div>
                        <div className="text-sm text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">END DATE</div>
                        <div className="text-sm text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB') : '—'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPTION</div>
                      <p className="text-sm text-foreground">{project.description}</p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">RISK NOTED</div>
                      <div className="text-sm text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {project.risks || 'None noted.'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">RECENT UPDATES</div>
                      <div className="space-y-2">
                        {project.updates && project.updates.slice(0, 3).map((update, idx) => (
                          <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                            <div className="text-xs text-muted-foreground">
                              {new Date(update.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-foreground mt-1">{update.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">RISKS & CHALLENGES</div>
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{project.risks}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
