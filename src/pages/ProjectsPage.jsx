import { useState } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ProjectBank } from '@/components/ProjectBank'
import { PageHeader } from '@/components/PageHeader'
import { useQuery } from '@/lib/useRegistry'
import { Loading, LoadFailure } from '@/components/QueryState'
import { listProjects, listDivisions, formatFcfa } from '@/lib/registry'
import { Search, Filter, Download, MapPin, DollarSign, Calendar, CheckCircle, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react'

const statusFilters = ['All', 'completed', 'ongoing', 'pending']

export function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDivision, setSelectedDivision] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const { data, loading, error, refresh } = useQuery(async () => {
    const [projects, divisionRows] = await Promise.all([listProjects(), listDivisions()])
    return { projects, divisionRows }
  }, [])

  const projectsData = data?.projects ?? []
  const divisions = ['All', ...(data?.divisionRows ?? []).map((d) => d.name)]

  // Filter projects
  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.contractor || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDivision = selectedDivision === 'All' || project.division === selectedDivision
    const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus

    return matchesSearch && matchesDivision && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'ongoing':
        return 'bg-blue-100 text-blue-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />
      case 'ongoing':
        return <AlertCircle size={16} />
      case 'pending':
        return <Calendar size={16} />
      default:
        return null
    }
  }

  const handleViewProject = (project) => {
    setSelectedProject(project)
  }

  const handleExportProjects = () => {
    alert('📥 Exporting project list...\n\nThis would generate a CSV/Excel file with all current projects and their details.')
  }

  const handleDownloadProjectReport = (projectId) => {
    const project = projectsData.find(p => p.id === projectId)
    alert(`📥 Downloading project report for: ${project.name}\n\nThis would generate a detailed PDF report with photos, timeline, and financials.`)
  }

  const handleEditProject = (projectId) => {
    alert(`✏️ Edit mode for project ID: ${projectId}\n\nIn a real app, this would open a form to edit project details.`)
  }

  const handleDeleteProject = (projectId) => {
    alert(`🗑️ Delete confirmation for project ID: ${projectId}\n\nIn a real app, this would require admin confirmation before deletion.`)
  }

  if (loading && !data) return <Loading label="Loading programmes" />
  if (error && !data) return <LoadFailure error={error} onRetry={refresh} />

  return (
    <div className="stagger space-y-8">
      <PageHeader
        eyebrow="Programmes"
        title="Projects"
        description="Every infrastructure and development programme on the roll — contractor, budget, and rate of execution."
      />

      {/* Project Bank Section */}
      <div className="border-b border-border pb-12">
        <ProjectBank />
      </div>

      {/* Sub-section */}
      <div>
        <p className="eyebrow mb-1.5">Roll of programmes</p>
        <h2 className="page-title">Under active supervision</h2>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto relative">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search projects or contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportProjects}
          >
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="bg-surface-alt/50 border-border">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Division</label>
              <div className="flex flex-wrap gap-2">
                {divisions.map(div => (
                  <Button
                    key={div}
                    variant={selectedDivision === div ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDivision(div)}
                  >
                    {div}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(status => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDivision('All')
                setSelectedStatus('All')
                setSearchQuery('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredProjects.length} of {projectsData.length} projects
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <Card key={project.id} className="hover:border-accent/50 transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project.id)}
                      title="Edit project"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-foreground font-medium">{project.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-foreground font-medium">{formatFcfa(project.budget_fcfa)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="text-foreground font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contractor</p>
                    <p className="text-foreground font-medium text-sm">{project.contractor}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm font-bold text-primary">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Budget Tracking */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Spent</p>
                    <p className="text-lg font-bold text-foreground">{formatFcfa(project.spent_fcfa)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Budget</p>
                    <p className="text-lg font-bold text-foreground">{formatFcfa(project.budget_fcfa)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleViewProject(project)}
                  >
                    <Eye size={16} />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownloadProjectReport(project.id)}
                  >
                    <Download size={16} />
                    Report
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No projects found matching your filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDivision('All')
                setSelectedStatus('All')
                setSearchQuery('')
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{selectedProject.name}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Project Overview</h3>
                <p className="text-muted-foreground mb-4">{selectedProject.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Division</p>
                    <p className="font-semibold text-foreground">{selectedProject.division}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-semibold px-2 py-1 rounded inline-block text-sm ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-alt/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-semibold text-foreground">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-surface-alt/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-semibold text-foreground">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Financial Tracking</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-alt/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold text-foreground">{formatFcfa(selectedProject.budget_fcfa)}</p>
                  </div>
                  <div className="bg-surface-alt/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-semibold text-foreground">{formatFcfa(selectedProject.spent_fcfa)}</p>
                  </div>
                  <div className="bg-surface-alt/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold text-foreground">{selectedProject.progress}%</p>
                  </div>
                </div>
              </div>

              {/* Contacts & Risks */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Project Management</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Project Manager</p>
                    <p className="text-foreground">{selectedProject.contact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contractor</p>
                    <p className="text-foreground">{selectedProject.contractor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Risks & Issues</p>
                    <p className="text-foreground">{selectedProject.risks}</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setSelectedProject(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
