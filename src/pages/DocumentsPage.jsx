import { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DocumentUploadForm } from '@/components/DocumentUploadForm'
import { FileText, Download, Calendar, Users, Search, Filter, Archive, Sparkles, Trash2, Eye } from 'lucide-react'
import { pp } from '@/lib/pipilot'
import { searchText } from '@/lib/ocr'
import { useAuth } from '@/lib/auth/useAuth'

export function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('All Types')
  const [expandedDoc, setExpandedDoc] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [error, setError] = useState('')

  // Fetch documents from BaaS with timeout
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        
        // Set a 10-second timeout for loading documents
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Document loading timed out (10s). Please refresh the page.'))
          }, 10000)
        })

        const docsPromise = pp.from('documents').select({ limit: 100 })
        const docs = await Promise.race([docsPromise, timeoutPromise])
        
        setDocuments(docs || [])
        setError('')
      } catch (err) {
        console.error('Failed to fetch documents:', err)
        setError(err.message || 'Failed to load documents. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Get unique document types
  const documentTypes = [
    'All Types',
    ...new Set(documents.map((d) => d.type || 'other')),
  ]

  // Perform full-text search with relevance ranking
  const searchResults =
    searchTerm.length >= 2 ? searchText(documents, searchTerm) : []

  // Filter documents
  const filtered = documents.filter((doc) => {
    const matchType = selectedType === 'All Types' || doc.type === selectedType
    const matchSearch =
      searchTerm.length < 2 ||
      searchResults.some((result) => result.id === doc.id)
    return matchType && matchSearch
  })

  // Sort by search relevance if searching, otherwise by date
  const displayDocuments =
    searchTerm.length >= 2
      ? filtered.sort((a, b) => {
          const aResult = searchResults.find((r) => r.id === a.id)
          const bResult = searchResults.find((r) => r.id === b.id)
          return (bResult?.score || 0) - (aResult?.score || 0)
        })
      : filtered.sort(
          (a, b) =>
            new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0)
        )

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev])
    setShowUploadForm(false)
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await pp.from('documents').delete(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      setExpandedDoc(null)
    } catch (err) {
      console.error('Delete failed:', err)
      setError('Failed to delete document.')
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      report: 'bg-blue-100 text-blue-700',
      minutes: 'bg-purple-100 text-purple-700',
      resolution: 'bg-green-100 text-green-700',
      policy: 'bg-orange-100 text-orange-700',
      financial: 'bg-green-100 text-green-700',
      project: 'bg-amber-100 text-amber-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-semibold">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-display text-foreground mb-2">
          Document Archive
        </h1>
        <p className="text-muted-foreground">
          Manage, search, and analyze institutional documents with AI-powered insights
        </p>
      </div>

      {/* Upload Section */}
      {showUploadForm && (
        <DocumentUploadForm onUploadSuccess={handleUploadSuccess} user={user} />
      )}

      {/* Action Button */}
      {!showUploadForm && (
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <FileText className="w-4 h-4 mr-2" />
          Upload New Document
        </Button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Documents</p>
              <p className="text-3xl font-bold font-display text-primary">
                {documents.length}
              </p>
            </div>
            <Archive className="w-8 h-8 text-accent opacity-20" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Indexed Documents</p>
              <p className="text-3xl font-bold font-display text-primary">
                {documents.filter((d) => d.text_indexed).length}
              </p>
            </div>
            <Search className="w-8 h-8 text-accent opacity-20" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Search Results</p>
              <p className="text-3xl font-bold font-display text-accent">
                {searchTerm.length >= 2 ? searchResults.length : '—'}
              </p>
            </div>
            <Sparkles className="w-8 h-8 text-accent opacity-20" />
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Search & Filter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents (title, content, metadata)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
              {searchTerm.length > 0 && searchTerm.length < 2 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Type at least 2 characters to search
                </p>
              )}
            </div>

            {/* Document Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {searchTerm.length >= 2 && (
            <p className="text-sm text-muted-foreground">
              Found {searchResults.length} results for "{searchTerm}"
            </p>
          )}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {displayDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-foreground font-semibold mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No results found'}
            </p>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0
                ? 'Upload your first document to get started.'
                : 'Try adjusting your search or filters'}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setShowUploadForm(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </Card>
        ) : (
          displayDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="p-6 border-l-4 border-l-primary hover:shadow-lg transition"
            >
              {/* Main Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-accent flex-shrink-0" />
                    <h3 className="text-lg font-bold text-foreground">{doc.title}</h3>
                    {doc.text_indexed && (
                      <Badge
                        label="✓ Indexed"
                        className="bg-green-100 text-green-700"
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge label={doc.type || 'document'} variant="secondary" />
                    {doc.metadata?.description && (
                      <p className="text-sm text-muted-foreground">
                        {doc.metadata.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.uploadDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div>{doc.size || 'Unknown size'}</div>
                    <Badge label={doc.accessLevel || 'internal'} />
                  </div>
                </div>

                {/* AI Assistant Button */}
                {doc.text_indexed && (
                  <button
                    onClick={() => window.location.hash = `#/chat/${doc.id}`}
                    className="ml-4 p-2 hover:bg-accent/10 rounded-lg transition text-accent"
                    title="Open AI Chat"
                  >
                    <Sparkles className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Expanded Details */}
              {expandedDoc === doc.id && (
                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  {doc.metadata?.fileName && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        File Name
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {doc.metadata.fileName}
                      </p>
                    </div>
                  )}

                  {doc.extracted_text && !doc.extracted_text.includes('[') && (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Text Preview
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {doc.extracted_text.substring(0, 300)}...
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        download={doc.title}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="flex-1 px-4 py-2 rounded-lg border border-destructive text-destructive font-medium hover:bg-destructive/10 transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Expand Toggle */}
              <button
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                className="mt-4 text-sm text-primary hover:text-primary/80 font-medium transition"
              >
                {expandedDoc === doc.id ? 'Show Less' : 'Show More'}
              </button>
            </Card>
          ))
        )}
      </div>



      {/* Info Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
        <div className="flex items-start gap-4">
          <Archive className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Advanced Document Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload documents in PDF, images (PNG, JPG, TIFF), or GIF format. Documents are automatically indexed with OCR text extraction, enabling full-text search and AI-powered analysis. All documents are securely stored with access control based on your specified security level.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
