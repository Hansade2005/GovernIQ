import { useState, useRef } from 'react'
import { Upload, Loader, CheckCircle, AlertCircle, Copy, Download, Zap } from 'lucide-react'
import { extractDocumentText } from '@/lib/ocr'

// Sample extracted text for demo
const DEMO_SAMPLE = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Key Points:
1. First important point - Lorem ipsum dolor sit amet
2. Second important point - Consectetur adipiscing elit
3. Third important point - Sed do eiusmod tempor

Dates mentioned:
- January 15, 2024
- March 30, 2024
- September 22, 2024

Numbers & Statistics:
- Total Records: 1,247
- Processed: 892 (71.5%)
- Pending: 355 (28.5%)
- Success Rate: 98.7%

Conclusion:
This is a sample extracted text from an OCR test document. The extraction was successful and the text is now searchable and analyzable.`

export function OCRTestPublic() {
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef(null)

  const supportedFormats = ['PDF', 'PNG', 'JPG', 'JPEG', 'GIF', 'TIFF']

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const ext = selectedFile.name.split('.').pop().toUpperCase()
    if (!supportedFormats.includes(ext)) {
      setError(`Unsupported format. Supported: ${supportedFormats.join(', ')}`)
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.')
      return
    }

    setFile(selectedFile)
    setError('')
    setSuccess(false)
    setExtractedText('')
    setProgress(0)
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

  const handleTestOCR = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)
    setExtractedText('')
    setProgress(0)
    setStatusMessage('')

    try {
      console.log('Starting OCR test with file:', file.name, 'type:', file.type)
      
      // Progress callback for tracking extraction
      const onProgress = (progressData) => {
        if (progressData.step === 'ocr_fallback') {
          setStatusMessage('PDF is image-based (scanned). Running OCR...')
          setProgress(30)
        } else if (progressData.step === 'ocr_page') {
          const percent = Math.round(progressData.progress * 100)
          setStatusMessage(`Processing page ${progressData.page}/${progressData.totalPages} - ${percent}%`)
          setProgress(30 + Math.round((progressData.progress * 60)))
        }
      }

      setStatusMessage('Analyzing document...')
      setProgress(10)
      
      const text = await extractDocumentText(file, onProgress)

      console.log('OCR extraction complete. Text length:', text.length)
      setExtractedText(text)
      setSuccess(true)
      setProgress(100)
      setStatusMessage('')
    } catch (err) {
      console.error('OCR test failed:', err)
      setError(`OCR Error: ${err.message}`)
      setProgress(0)
      setStatusMessage('')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoOCR = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)
    setExtractedText('')
    setProgress(0)

    try {
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 150))
        setProgress(Math.min((i + 1) * 10, 95))
      }

      setExtractedText(DEMO_SAMPLE)
      setSuccess(true)
      setProgress(100)
    } catch (err) {
      console.error('Demo OCR failed:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
    alert('✓ Text copied to clipboard!')
  }

  const handleDownloadText = () => {
    const element = document.createElement('a')
    const blob = new Blob([extractedText], {type: 'text/plain'})
    element.href = URL.createObjectURL(blob)
    element.download = `extracted_text_${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">OCR Test Lab</h1>
          </div>
          <div className="text-xs text-muted-foreground">Tesseract.js + PDF.js</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">OCR Text Extraction Test</h2>
          <p className="text-muted-foreground">Test Tesseract.js and PDF.js OCR functionality with your documents</p>
        </div>

        {/* Demo Section */}
        {!extractedText && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demo Card */}
            <div className="border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-foreground">Quick Demo</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                See OCR extraction in action with a sample document. No upload needed.
              </p>
              <button
                onClick={handleDemoOCR}
                disabled={loading}
                className="w-full px-4 py-2 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                    Running... {progress}%
                  </>
                ) : (
                  '▶ Run Demo'
                )}
              </button>
            </div>

            {/* Upload Card */}
            <div className="border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Upload File</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Test with your own PDF, image, or document file.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                📁 Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={supportedFormats.map(f => `.${f.toLowerCase()}`).join(',')}
                className="hidden"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* File Info */}
        {file && !extractedText && (
          <div className="border border-border rounded-lg p-4 bg-card/50">
            <p className="text-sm text-foreground">
              <strong>✓ Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <button
              onClick={handleTestOCR}
              disabled={loading}
              className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                '🔍 Extract Text (OCR)'
              )}
            </button>
            {loading && (
              <div className="mt-3">
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {statusMessage || (progress < 30 ? 'Analyzing document...' : progress < 95 ? 'Processing pages...' : 'Finalizing extraction...')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {success && extractedText && (
          <div className="space-y-4">
            <div className="border border-green-500/20 bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">✓ OCR Successful!</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1 text-sm bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 rounded hover:opacity-90 transition flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="px-3 py-1 text-sm bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 rounded hover:opacity-90 transition flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-white dark:bg-black/30 rounded border border-green-200 dark:border-green-800">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Characters</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{extractedText.length.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white dark:bg-black/30 rounded border border-green-200 dark:border-green-800">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Words</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {extractedText.split(/\s+/).filter(w => w).length.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-black/30 rounded border border-green-200 dark:border-green-800">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Lines</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">{extractedText.split('\n').length}</p>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extracted Text Preview</p>
              <textarea
                value={extractedText}
                readOnly
                className="w-full h-64 p-3 bg-background border border-border rounded text-sm text-foreground font-mono resize-none focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setExtractedText('')
                setSuccess(false)
                setFile(null)
              }}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:opacity-90 transition"
            >
              ← Start Over
            </button>
          </div>
        )}

        {/* Instructions */}
        {!extractedText && (
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-bold text-foreground">1.</span>
                <span><strong>Choose a method:</strong> Try the demo or upload your own file (PDF, PNG, JPG, etc.)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground">2.</span>
                <span><strong>Smart extraction:</strong> PDF.js for searchable PDFs → Tesseract.js OCR for scanned images</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground">3.</span>
                <span><strong>View results:</strong> See character count, word count, and full text preview</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-foreground">4.</span>
                <span><strong>Export:</strong> Copy or download the extracted text as .txt</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded text-xs space-y-2">
              <p><strong>💡 Extraction Strategy:</strong></p>
              <ul className="space-y-1 ml-2">
                <li>• <strong>Searchable PDFs:</strong> Uses PDF.js for instant text extraction</li>
                <li>• <strong>Scanned PDFs:</strong> Automatically falls back to Tesseract.js OCR</li>
                <li>• <strong>Images:</strong> Tesseract.js OCR (PNG/JPG/GIF/TIFF at 150+ DPI for best results)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-16 py-8 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>OCR Test Lab — Testing Tesseract.js and PDF.js text extraction</p>
        </div>
      </div>
    </div>
  )
}
