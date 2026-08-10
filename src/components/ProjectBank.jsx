import { useState, useEffect } from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock, MapPin, Building2, Users, FileText, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { pp } from '@/lib/pipilot'

// Fallback data in case database is unavailable
const fallbackProjectData = [
  {
    id: 1,
    name: 'Wum District Hospital Fence',
    division: 'Mezam',
    contractor: 'Lake Nyos Survival CO LTD',
    status: 'completed',
    progress: 100,
    budget: '45M FCFA',
    spent: '44.8M FCFA',
    execution: 99.6,
    startDate: '2025-10-15',
    endDate: '2026-03-20',
    description: 'Perimeter fence construction for Wum District Hospital',
    location: 'Wum, Mezam',
    category: 'Health Infrastructure',
    updates: [
      { date: '2026-06-13', status: 'Phase 2 ongoing with high-quality execution' },
      { date: '2026-05-28', status: 'Resumption of works after stop-work resolution' },
      { date: '2026-04-27', status: 'Advanced construction phase' }
    ],
    risks: 'Resolved - Stop-work order lifted',
    phase: 'Completed'
  },
  {
    id: 2,
    name: 'GHS Lip (Mbiame) - 3 Classrooms + 2 Offices',
    division: 'Momo',
    contractor: 'ACONSEP CO LTD',
    status: 'in-progress',
    progress: 85,
    budget: '120M FCFA',
    spent: '102M FCFA',
    execution: 85,
    startDate: '2026-04-05',
    endDate: '2026-12-31',
    description: 'Construction of classroom block with office spaces',
    location: 'Lip, Mbiame, Momo Division',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-14', status: 'Painting ongoing - network challenges' },
      { date: '2026-06-15', status: 'Finishing works, environmental landscaping complete' },
      { date: '2026-05-25', status: 'Roofing complete' }
    ],
    risks: 'Network connectivity issues affecting operations',
    phase: 'Phase 3 - Final finishing'
  },
  {
    id: 3,
    name: 'GHS Mbiame - 3 Classrooms + 2 Offices',
    division: 'Momo',
    contractor: 'ACONSEP CO LTD',
    status: 'in-progress',
    progress: 80,
    budget: '125M FCFA',
    spent: '100M FCFA',
    execution: 80,
    startDate: '2026-03-15',
    endDate: '2026-11-30',
    description: 'Classroom block and administrative office construction',
    location: 'Mbiame, Momo Division',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-10', status: 'Interior finishing in progress' },
      { date: '2026-06-20', status: 'Roofing completed successfully' },
      { date: '2026-05-15', status: 'Wall construction advancing' }
    ],
    risks: 'Delayed material deliveries impacting schedule',
    phase: 'Phase 3 - Interior work ongoing'
  },
  {
    id: 4,
    name: 'Science Lab GHS Weh',
    division: 'Mezam',
    contractor: 'Lake Nyos Survival CO LTD',
    status: 'in-progress',
    progress: 70,
    budget: '85M FCFA',
    spent: '59.5M FCFA',
    execution: 70,
    startDate: '2026-02-01',
    endDate: '2026-10-31',
    description: 'State-of-the-art science laboratory facility',
    location: 'Weh, Mezam',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-12', status: 'Equipment installation ongoing' },
      { date: '2026-06-25', status: 'Structural work completed' },
      { date: '2026-05-20', status: 'Foundation and framing complete' }
    ],
    risks: 'Equipment procurement delays',
    phase: 'Phase 3 - Equipment installation'
  },
  {
    id: 5,
    name: 'GTHS Nkambe - 3 Classrooms + 2 Offices',
    division: 'Donga-Mantung',
    contractor: 'AFUHCAM ENGINEERING COMPANY LTD',
    status: 'in-progress',
    progress: 50,
    budget: '130M FCFA',
    spent: '65M FCFA',
    execution: 50,
    startDate: '2026-01-10',
    endDate: '2026-12-15',
    description: 'Government Technical High School classroom and office block',
    location: 'Nkambe, Donga-Mantung',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-08', status: 'Concrete pouring at intermediate stage' },
      { date: '2026-06-15', status: 'Foundation work ongoing' },
      { date: '2026-05-10', status: 'Site preparation completed' }
    ],
    risks: 'Labor shortage affecting progress velocity',
    phase: 'Phase 2 - Foundation & framing'
  },
  {
    id: 6,
    name: 'GTHS Ndop - 3 Classrooms + 2 Offices',
    division: 'Momo',
    contractor: 'Ashimenyi Enterprise',
    status: 'in-progress',
    progress: 60,
    budget: '128M FCFA',
    spent: '76.8M FCFA',
    execution: 60,
    startDate: '2026-02-15',
    endDate: '2026-11-15',
    description: 'Classroom block with administrative offices for GTHS Ndop',
    location: 'Ndop, Momo Division',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-09', status: 'Wall construction progressing steadily' },
      { date: '2026-06-18', status: 'Concrete foundation completed' },
      { date: '2026-05-12', status: 'Site mobilization complete' }
    ],
    risks: 'Weather conditions affecting construction timeline',
    phase: 'Phase 2 - Wall construction'
  },
  {
    id: 7,
    name: 'Batibo District Hospital Medical Ward',
    division: 'Menchum',
    contractor: 'Ets. Denzel',
    status: 'completed',
    progress: 100,
    budget: '95M FCFA',
    spent: '94.2M FCFA',
    execution: 99.2,
    startDate: '2025-09-20',
    endDate: '2026-04-15',
    description: 'Medical ward renovation and expansion for Batibo District Hospital',
    location: 'Batibo, Menchum Division',
    category: 'Health Infrastructure',
    updates: [
      { date: '2026-05-30', status: 'Project handover completed' },
      { date: '2026-04-20', status: 'Final inspection passed' },
      { date: '2026-03-15', status: 'Medical equipment installation complete' }
    ],
    risks: 'None - Successfully completed',
    phase: 'Completed'
  },
  {
    id: 8,
    name: 'Batibo District Hospital Nursing Home',
    division: 'Menchum',
    contractor: 'Ets. Denzel',
    status: 'completed',
    progress: 100,
    budget: '75M FCFA',
    spent: '74.5M FCFA',
    execution: 99.3,
    startDate: '2025-10-05',
    endDate: '2026-03-30',
    description: 'Nursing home accommodation facilities construction',
    location: 'Batibo, Menchum Division',
    category: 'Health Infrastructure',
    updates: [
      { date: '2026-04-10', status: 'Handover and staff orientation complete' },
      { date: '2026-03-25', status: 'Final furnishing completed' },
      { date: '2026-02-28', status: 'Construction phase complete' }
    ],
    risks: 'None - Successfully completed',
    phase: 'Completed'
  },
  {
    id: 9,
    name: 'Ngomgham Health Center - Excavation & Roofing',
    division: 'Boyo',
    contractor: 'Mile90 Project',
    status: 'in-progress',
    progress: 55,
    budget: '55M FCFA',
    spent: '30.25M FCFA',
    execution: 55,
    startDate: '2026-03-01',
    endDate: '2026-10-31',
    description: 'Health center construction with excavation and roofing',
    location: 'Ngomgham, Boyo Division',
    category: 'Health Infrastructure',
    updates: [
      { date: '2026-07-06', status: 'Roofing frame installation ongoing' },
      { date: '2026-06-20', status: 'Wall construction phase' },
      { date: '2026-05-15', status: 'Excavation works completed' }
    ],
    risks: 'Supply chain delays for roofing materials',
    phase: 'Phase 2 - Roofing'
  },
  {
    id: 10,
    name: 'GTHS Misaje - Building Workshop',
    division: 'Mezam',
    contractor: 'Regional Construction',
    status: 'in-progress',
    progress: 40,
    budget: '68M FCFA',
    spent: '27.2M FCFA',
    execution: 40,
    startDate: '2026-04-01',
    endDate: '2026-12-20',
    description: 'Workshop building for technical training at GTHS Misaje',
    location: 'Misaje, Mezam',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-05', status: 'Foundation and base work in progress' },
      { date: '2026-06-15', status: 'Site preparation ongoing' },
      { date: '2026-05-20', status: 'Initial mobilization' }
    ],
    risks: 'Project delayed - limited contractor resources',
    phase: 'Phase 1 - Foundation work'
  },
  {
    id: 11,
    name: 'Bui District Hospital Maternity Ward',
    division: 'Bui',
    contractor: 'Healthcare Build Solutions',
    status: 'in-progress',
    progress: 65,
    budget: '110M FCFA',
    spent: '71.5M FCFA',
    execution: 65,
    startDate: '2026-02-20',
    endDate: '2026-11-20',
    description: 'Maternity ward expansion for Bui District Hospital',
    location: 'Kumbo, Bui',
    category: 'Health Infrastructure',
    updates: [
      { date: '2026-07-10', status: 'Interior fitting ongoing' },
      { date: '2026-06-25', status: 'Roofing structure complete' },
      { date: '2026-05-18', status: 'Wall construction advancing' }
    ],
    risks: 'Weather delays affecting schedule',
    phase: 'Phase 3 - Interior works'
  },
  {
    id: 12,
    name: 'District Secondary School - Classroom Extension',
    division: 'Ngo-Ketunjia',
    contractor: 'Construction Excellence Ltd',
    status: 'in-progress',
    progress: 75,
    budget: '140M FCFA',
    spent: '105M FCFA',
    execution: 75,
    startDate: '2026-01-15',
    endDate: '2026-10-31',
    description: 'Classroom block extension for improved student capacity',
    location: 'Ndop, Ngo-Ketunjia',
    category: 'Education Infrastructure',
    updates: [
      { date: '2026-07-12', status: 'Final finishing and painting' },
      { date: '2026-06-20', status: 'Roofing completed' },
      { date: '2026-05-25', status: 'Structural work progressing' }
    ],
    risks: 'Budget constraints for additional finishing work',
    phase: 'Phase 3 - Final finishing'
  }
]

export function ProjectBank() {
  const [projects, setProjects] = useState(fallbackProjectData)
  const [filteredProjects, setFilteredProjects] = useState(fallbackProjectData)
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
        if (!pp) {
          console.warn('PiPilot client not available, using fallback data')
          setLoading(false)
          return
        }

        const data = await pp.from('projects').select({ limit: 100 })
        
        if (data && data.length > 0) {
          setProjects(data)
          setFilteredProjects(data)
          console.log(`Loaded ${data.length} projects from database`)
        } else {
          console.info('No projects found in database, using fallback data')
          setProjects(fallbackProjectData)
          setFilteredProjects(fallbackProjectData)
        }
      } catch (err) {
        console.error('Error loading projects:', err)
        setError('Could not load projects from database, using fallback data')
        setProjects(fallbackProjectData)
        setFilteredProjects(fallbackProjectData)
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
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.contractor.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term)
      )
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

  // Calculate statistics
  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    avgProgress: Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length || 0),
    totalBudget: projects.reduce((sum, p) => {
      const match = p.budget.match(/(\d+)/)
      return sum + (match ? parseInt(match[1]) : 0)
    }, 0),
    avgExecution: Math.round(projects.reduce((sum, p) => sum + (p.execution || 0), 0) / projects.length || 0)
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
          <div className="text-2xl font-bold text-purple-600">{stats.totalBudget}M</div>
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
                    <div className="text-lg font-bold text-foreground">{project.budget}</div>
                    <div className="text-xs text-muted-foreground">Total allocation</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold mb-1">SPENT</div>
                    <div className="text-lg font-bold text-foreground">{project.spent}</div>
                    <div className="text-xs text-muted-foreground">{project.execution}% utilized</div>
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
                          {new Date(project.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">END DATE</div>
                        <div className="text-sm text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(project.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPTION</div>
                      <p className="text-sm text-foreground">{project.description}</p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">CURRENT PHASE</div>
                      <div className="text-sm text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {project.phase}
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
