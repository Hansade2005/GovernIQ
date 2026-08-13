import { useState, useEffect, useContext } from 'react'
import { Plus, Edit2, Trash2, Camera, MessageSquare, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { AuthContext } from '@/lib/auth/AuthContext'
import {
  listProgress, createProgress, updateProgress, deleteProgress,
  uploadProgressPhoto, listProjects,
} from '@/lib/registry'

export function ProjectProgressPage() {
  const { user } = useContext(AuthContext)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state for adding/editing progress
  const [formData, setFormData] = useState({
    project_id: '',
    project_name: '',
    progress_percentage: 50,
    progress_remark: '',
    citizen_opinion: '',
    images: []
  })

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      // Try to load progress reports, fallback to empty array
      try {
        const data = await listProgress()
        setProjects(data || [])
      } catch (err) {
        console.error('Failed to load from project_progress:', err)
        setProjects([])
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProgress = () => {
    setSelectedProject(null)
    setFormData({
      project_id: '',
      project_name: '',
      progress_percentage: 50,
      progress_remark: '',
      citizen_opinion: '',
      images: []
    })
    setShowModal(true)
  }

  const handleEditProgress = (project) => {
    setSelectedProject(project)
    setFormData({
      project_id: project.id,
      project_name: project.name || project.project_name || '',
      progress_percentage: project.progress_percentage || 50,
      progress_remark: project.progress_remark || '',
      citizen_opinion: project.citizen_opinion || '',
      images: project.images || []
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    for (const file of files) {
      try {
        // Read file as data URL
        const reader = new FileReader()
        reader.onload = async (event) => {
          const fileName = `progress/${user.id}/${Date.now()}-${file.name}`
          
          try {
            // Upload to storage
            const { url: imageUrl } = await uploadProgressPhoto(file)
            
            setFormData(prev => ({
              ...prev,
              images: [...prev.images, {
                url: imageUrl,
                name: file.name,
                uploadedAt: new Date().toISOString()
              }]
            }))
          } catch (err) {
            console.error('Failed to upload image:', err)
          }
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error('Error processing image:', err)
      }
    }
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSaveProgress = async () => {
    if (!formData.project_name || formData.progress_percentage === '') {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      const progressData = {
        project_name: formData.project_name,
        progress_percentage: parseInt(formData.progress_percentage),
        progress_remark: formData.progress_remark,
        citizen_opinion: formData.citizen_opinion,
        images: formData.images,
        owner_id: user.id,
        updatedAt: new Date().toISOString()
      }

      if (selectedProject) {
        // Update existing
        await updateProgress(selectedProject.id, progressData)
      } else {
        // Create new
        progressData.createdAt = new Date().toISOString()
        await createProgress(progressData)
      }

      setShowModal(false)
      loadProjects()
    } catch (err) {
      console.error('Failed to save progress:', err)
      alert('Error saving progress. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this progress record?')) {
      return
    }

    try {
      setLoading(true)
      await deleteProgress(id)
      loadProjects()
    } catch (err) {
      console.error('Failed to delete progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(p =>
    (p.project_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500'
    if (percentage >= 60) return 'from-blue-500 to-cyan-500'
    if (percentage >= 40) return 'from-yellow-500 to-amber-500'
    return 'from-red-500 to-rose-500'
  }

  const getStatusBadge = (percentage) => {
    if (percentage >= 80) return { label: 'On Track', color: 'bg-green-100 text-green-800' }
    if (percentage >= 60) return { label: 'Progressing', color: 'bg-blue-100 text-blue-800' }
    if (percentage >= 40) return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'At Risk', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="ornament-mark" aria-hidden />
            <p className="eyebrow">Programmes</p>
          </div>
          <h1 className="page-title">Execution</h1>
          <p className="mt-1.5 text-[color:var(--sepia)] max-w-xl leading-relaxed">
            Programme status with visual evidence and stakeholder testimony.
          </p>
        </div>
        <Button
          onClick={handleAddProgress}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New Progress Report
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-foreground mt-2">{filteredProjects.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg. Progress</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {filteredProjects.length > 0
                  ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / filteredProjects.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-accent opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Photos Uploaded</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {filteredProjects.reduce((sum, p) => sum + (p.images?.length || 0), 0)}
              </p>
            </div>
            <Camera className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button onClick={handleAddProgress} variant="outline">
            Create your first progress report
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const status = getStatusBadge(project.progress_percentage || 0)
            
            return (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 relative">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor(project.progress_percentage || 0)} transition-all duration-500`}
                    style={{ width: `${project.progress_percentage || 0}%` }}
                  />
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">{project.project_name || project.name}</h3>
                      <Badge className={`mt-2 ${status.color}`}>{status.label}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{project.progress_percentage || 0}%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  {/* Progress Remark */}
                  {project.progress_remark && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Progress Remark
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-2">{project.progress_remark}</p>
                    </div>
                  )}

                  {/* Citizen Opinion */}
                  {project.citizen_opinion && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4" />
                        Citizen Opinion
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 line-clamp-2">{project.citizen_opinion}</p>
                    </div>
                  )}

                  {/* Image Gallery Preview */}
                  {project.images && project.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        Photos ({project.images.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {project.images.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-lg bg-gray-200 overflow-hidden">
                            <img
                              src={img.url}
                              alt={img.name || `Progress ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {project.images.length > 3 && (
                          <div className="aspect-square rounded-lg bg-gray-300 flex items-center justify-center">
                            <p className="text-sm font-semibold text-gray-700">+{project.images.length - 3}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <p className="text-xs text-muted-foreground mb-4">
                    Updated: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditProgress(project)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProgress(project.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedProject ? 'Edit Progress Report' : 'New Progress Report'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Project Name *</label>
                <Input
                  value={formData.project_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                  placeholder="Enter project name"
                  list="project-list"
                />
                <datalist id="project-list">
                  {projects.map(p => (
                    <option key={p.id} value={p.project_name || p.name} />
                  ))}
                </datalist>
              </div>

              {/* Progress Percentage */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Progress: {formData.progress_percentage}% *
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Progress Remark */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Progress Remark
                </label>
                <textarea
                  value={formData.progress_remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress_remark: e.target.value }))}
                  placeholder="Describe the current project status, achievements, and challenges..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Citizen Opinion */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Citizen Opinion / Community Feedback
                </label>
                <textarea
                  value={formData.citizen_opinion}
                  onChange={(e) => setFormData(prev => ({ ...prev, citizen_opinion: e.target.value }))}
                  placeholder="Record feedback from citizens and stakeholders about the project..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  <Camera className="w-4 h-4 inline mr-2" />
                  Project Photos
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-input"
                  />
                  <label htmlFor="image-input" className="cursor-pointer block">
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Click to upload photos</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>

                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Uploaded Images ({formData.images.length})</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{img.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgress}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Progress Report'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
