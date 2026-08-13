import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DocumentUploadForm } from '@/components/DocumentUploadForm'
import { FileText, Download, Calendar, Users, Search, Filter, Archive, Sparkles, Trash2, Eye } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import {
  listDocuments, searchDocuments, deleteDocument,
  getPublicUrl, formatBytes, DOCUMENT_CATEGORIES,
} from '@/lib/documentStore'
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

  // Load the registry from Supabase. Search runs server-side so results
  // reflect the whole archive, not just the page already in memory.
  const refresh = useCallback(async (term = '') => {
    try {
      setLoading(true)
      const docs = term.trim().length >= 2
        ? await searchDocuments(term)
        : await listDocuments()
      setDocuments(docs)
      setError('')
    } catch (err) {
      console.error('Failed to load documents:', err)
      setError(err.message || 'Could not load the registry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Debounce search so each keystroke doesn't hit the database.
  useEffect(() => {
    const t = setTimeout(() => { refresh(searchTerm) }, 300)
    return () => clearTimeout(t)
  }, [searchTerm, refresh])

  const documentTypes = ['All Types', ...DOCUMENT_CATEGORIES]

  const searchResults = searchTerm.length >= 2 ? documents : []

  const displayDocuments = documents.filter(
    (doc) => selectedType === 'All Types' || doc.category === selectedType
  )

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev])
    setShowUploadForm(false)
  }

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete “${doc.title}”? This also removes the stored file.`)) return
    try {
      await deleteDocument(doc)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      setExpandedDoc(null)
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err.message || 'Could not delete the document.')
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-3.5 h-3.5 rotate-45 border border-[color:var(--kola)] mx-auto mb-4 animate-pulse" />
          <p className="eyebrow">Opening the registry</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stagger space-y-6">
      <PageHeader
        eyebrow="Registry"
        title="Documents"
        description="Every minute, motion, and ministerial report — indexed by OCR and searchable in full text."
        actions={
          !showUploadForm && (
            <Button onClick={() => setShowUploadForm(true)}>
              <FileText size={14} />
              Upload document
            </Button>
          )
        }
      />

      {/* Upload Section */}
      {showUploadForm && (
        <DocumentUploadForm onUploadSuccess={handleUploadSuccess} user={user} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total documents',   value: documents.length,                                icon: Archive },
          { label: 'Indexed for search', value: documents.filter((d) => d.text_indexed).length, icon: Search },
          { label: 'Matching search',   value: searchTerm.length >= 2 ? searchResults.length : '—', icon: Sparkles, accent: true },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="eyebrow text-[0.6rem]">{s.label}</p>
                <p className={`figure text-3xl mt-2 ${s.accent ? 'figure-kola' : 'figure-highland'}`}>
                  {s.value}
                </p>
              </div>
              <s.icon size={16} className="text-[color:var(--sepia-soft)] flex-shrink-0" />
            </div>
          </Card>
        ))}
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
            <Card key={doc.id} className="record-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[0.9375rem] font-semibold text-[color:var(--ink)]">
                      {doc.title}
                    </h3>
                    <Badge variant="secondary">{doc.category || 'Other'}</Badge>
                    {doc.text_indexed && <Badge variant="success">Indexed</Badge>}
                  </div>

                  {doc.description && (
                    <p className="text-[color:var(--sepia)] mt-1.5 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 mono text-[0.7rem] text-[color:var(--sepia-soft)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span>{formatBytes(doc.file_size)}</span>
                    {doc.file_name && <span className="truncate max-w-[220px]">{doc.file_name}</span>}
                  </div>
                </div>

                {doc.text_indexed && (
                  <button
                    onClick={() => (window.location.hash = `#/chat/${doc.id}`)}
                    className="p-2 rounded-[3px] text-[color:var(--sepia)] hover:text-[color:var(--kola)] hover:bg-[color:var(--linen)] transition flex-shrink-0"
                    title="Interrogate this document"
                    aria-label="Interrogate this document"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>

              {expandedDoc === doc.id && (
                <div className="mt-4 pt-4 border-t border-[color:var(--rule)] space-y-4">
                  {doc.ocr_text && (
                    <div>
                      <p className="eyebrow text-[0.55rem] mb-1.5">Extracted text</p>
                      <p className="text-[color:var(--sepia)] leading-relaxed">
                        {doc.ocr_text.slice(0, 400)}
                        {doc.ocr_text.length > 400 ? '…' : ''}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {getPublicUrl(doc.storage_path) && (
                      <a
                        href={getPublicUrl(doc.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    )}
                    <button onClick={() => handleDelete(doc)} className="btn btn-danger">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                className="mt-3 text-[0.75rem] font-medium text-[color:var(--kola)] hover:opacity-80 transition"
              >
                {expandedDoc === doc.id ? 'Show less' : 'Show more'}
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
