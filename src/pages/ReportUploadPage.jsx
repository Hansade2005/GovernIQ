import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input, Label } from '@/components/Input'
import { Badge } from '@/components/Badge'
import { pp } from '@/lib/pipilot'
import { Upload, FileIcon, Trash2, Eye, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export function ReportUploadPage() {
  const [reports, setReports] = useState([
    {
      id: 1,
      title: 'Q1 2024 Performance Report',
      uploadedBy: 'Roads Ministry',
      uploadDate: '2024-04-15',
      status: 'approved',
      files: [
        { name: 'performance-q1.pdf', type: 'pdf', size: '2.4 MB' },
        { name: 'metrics.png', type: 'image', size: '450 KB' },
      ],
    },
  ])
  
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    projectOwner: '',
    description: '',
    files: [],
  })
  const [uploading, setUploading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    setUploadData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }))
  }

  const handleRemoveFile = (index) => {
    setUploadData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }))
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      // In production, upload files to storage
      const newReport = {
        id: Math.max(...reports.map(r => r.id), 0) + 1,
        title: uploadData.title,
        uploadedBy: uploadData.projectOwner,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        files: uploadData.files.map(f => ({
          name: f.name,
          type: f.type.startsWith('image') ? 'image' : 'pdf',
          size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        })),
        description: uploadData.description,
      }

      setReports([newReport, ...reports])
      setUploadData({ title: '', projectOwner: '', description: '', files: [] })
      setShowUploadForm(false)
    } finally {
      setUploading(false)
    }
  }

  const statusColors = {
    approved: 'bg-green-500/20 text-green-700 dark:text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-baseline gap-3 mb-3">
          <p className="eyebrow">Depositions</p>
          <span className="ornament-mark" aria-hidden />
        </div>
        <h1 className="serif text-[clamp(2rem,4vw,3.5rem)] font-light leading-[0.98] tracking-tight max-w-4xl">
          Lay a <span className="italic text-[color:var(--highland)]">report</span> before the chamber.
        </h1>
        <div className="ornament ornament-draw mt-5 max-w-xs" aria-hidden />
        <p className="mt-4 text-[color:var(--sepia)] max-w-2xl leading-relaxed">
          Upload programme reports with attachments, visual evidence, and figures.
        </p>
      </motion.div>

      {/* Upload Form */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Upload New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Report Title</Label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Q2 Infrastructure Update"
                      required
                    />
                  </div>
                  <div>
                    <Label>Project Owner / Ministry</Label>
                    <Input
                      value={uploadData.projectOwner}
                      onChange={(e) => setUploadData(prev => ({ ...prev, projectOwner: e.target.value }))}
                      placeholder="e.g., Ministry of Roads"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the report content"
                    rows={3}
                    className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* File Upload Area */}
                <div>
                  <Label>Attach Files (Images, PDFs)</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-foreground font-semibold mb-1">
                      Click or drag files here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Support: PNG, JPEG, PDF, GIF (max 10MB each)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.pdf,.gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* File List */}
                  {uploadData.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadData.files.map((file, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 bg-surface-alt rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileIcon size={20} className="text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(idx)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={uploading || !uploadData.title || uploadData.files.length === 0}>
                    {uploading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Submit Report
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upload Button */}
      {!showUploadForm && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowUploadForm(true)} className="w-full md:w-auto">
            <Upload size={18} />
            Upload New Report
          </Button>
        </motion.div>
      )}

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileIcon size={48} className="mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No reports uploaded yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileIcon size={20} className="text-primary flex-shrink-0" />
                        <h3 className="text-lg font-bold font-display text-foreground truncate">{report.title}</h3>
                        <Badge className={statusColors[report.status]}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                        <span>By: {report.uploadedBy}</span>
                        <span>•</span>
                        <span>{report.uploadDate}</span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground italic mb-3">{report.description}</p>
                      )}
                      {/* File List */}
                      <div className="flex flex-wrap gap-2">
                        {report.files.map((file, fidx) => (
                          <Badge key={fidx} variant="outline" className="text-xs">
                            {file.type === 'pdf' ? '📄' : '🖼️'} {file.name} ({file.size})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                        <Eye size={18} />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download size={18} />
                        Export PDF
                      </Button>
                      {report.status === 'pending' && (
                        <>
                          <Button size="sm">
                            <CheckCircle size={18} />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm">
                            <AlertCircle size={18} />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
