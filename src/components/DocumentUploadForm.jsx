import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Input } from '@/components/Input'
import { Upload, Loader, Check, AlertCircle, FileText } from 'lucide-react'
import { pp } from '@/lib/pipilot'
import { extractDocumentText } from '@/lib/ocr'

export function DocumentUploadForm({ onUploadSuccess, user }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('report')
  const [description, setDescription] = useState('')
  const [accessLevel, setAccessLevel] = useState('confidential')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractingStatus, setExtractingStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const documentTypes = [
    { value: 'report', label: 'Report' },
    { value: 'minutes', label: 'Session Minutes' },
    { value: 'resolution', label: 'Resolution' },
    { value: 'policy', label: 'Policy Document' },
    { value: 'financial', label: 'Financial Report' },
    { value: 'project', label: 'Project Status' },
  ]

  const accessLevels = [
    { value: 'public', label: 'Public' },
    { value: 'internal', label: 'Internal' },
    { value: 'confidential', label: 'Confidential' },
  ]

  const supportedFormats = ['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'TIFF']

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const ext = selectedFile.name.split('.').pop().toUpperCase()
    if (!supportedFormats.includes(ext)) {
      setError(`Unsupported format. Supported: ${supportedFormats.join(', ')}`)
      return
    }

    // Validate size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.')
      return
    }

    setFile(selectedFile)
    setError('')
    setSuccess(false)
    // Auto-fill title from filename
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files?.[0]) {
      fileInputRef.current.files = e.dataTransfer.files
      handleFileSelect({ target: fileInputRef.current })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // 1. Extract text from document using intelligent extraction strategy
      // PDF.js first → OCR fallback if PDF is scanned
      setExtracting(true)
      setExtractingStatus('Processing document...')
      let extractedText = ''
      try {
        const onProgress = (progress) => {
          if (progress.step === 'ocr_fallback') {
            setExtractingStatus('PDF is scanned. Running OCR...')
          } else if (progress.step === 'ocr_page') {
            const percent = Math.round(progress.progress * 100)
            setExtractingStatus(`OCR: Page ${progress.page}/${progress.totalPages} - ${percent}%`)
          }
        }
        extractedText = await extractDocumentText(file, onProgress)
      } catch (ocrErr) {
        console.warn('Text extraction failed, continuing with empty text:', ocrErr)
        extractedText = `[Document uploaded but text extraction failed: ${ocrErr.message}]`
      }
      setExtractingStatus('')
      setExtracting(false)

      // 2. Upload file to PiPilot storage
      const timestamp = Date.now()
      const storagePath = `documents/${timestamp}-${file.name}`
      const downloadUrl = await pp.storage.upload(storagePath, file)

      // 3. Save document metadata + extracted text to database
      const userId = user?.userId || user?.id || 'demo-user'
      const documentRecord = {
        title: title.trim(),
        type: documentType,
        status: 'active',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        owner_id: userId,
        storagePath,
        downloadUrl,
        extracted_text: extractedText,
        text_indexed: extractedText.length > 50 && !extractedText.includes('[Document uploaded but'),
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          description: description.trim(),
          tags: [documentType, 'indexed'],
        },
        accessLevel,
      }

      // Insert into documents table
      const { ids } = await pp.from('documents').insert(documentRecord)
      const docId = ids?.[0]

      if (!docId) {
        throw new Error('Failed to save document to database')
      }

      // Reset form and show success
      setFile(null)
      setTitle('')
      setDescription('')
      setDocumentType('report')
      setAccessLevel('confidential')
      setSuccess(true)

      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess({
          id: docId,
          ...documentRecord,
        })
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
      setExtracting(false)
    }
  }

  return (
    <Card className="border-accent/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent" />
          <CardTitle>Upload New Document</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={supportedFormats.map((f) => `.${f.toLowerCase()}`).join(',')}
              className="hidden"
              disabled={loading}
            />
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-semibold mb-1">
              {file ? file.name : 'Drag and drop or click to select'}
            </p>
            <p className="text-sm text-muted-foreground">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : `Supported: ${supportedFormats.join(', ')} (max 50 MB)`}
            </p>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Document Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Regional Budget 2026"
              disabled={loading}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
            >
              {documentTypes.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document..."
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none h-20"
            />
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Access Level
            </label>
            <div className="flex gap-3">
              {accessLevels.map((level) => (
                <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accessLevel"
                    value={level.value}
                    checked={accessLevel === level.value}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    disabled={loading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Upload successful!</p>
                <p className="text-xs text-green-700">
                  Your document has been indexed and is ready for analysis.
                </p>
              </div>
            </div>
          )}

          {extracting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
              <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Extracting text...</p>
                <p className="text-xs text-blue-700">
                  Processing your document with OCR. This may take a minute.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!file || loading || !title.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {extracting ? 'Extracting text...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Documents are securely stored and indexed for full-text search and AI analysis.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
