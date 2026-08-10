import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Upload, Loader, CheckCircle, AlertCircle, Copy, Download, ZapOff } from 'lucide-react'
import { extractImageText, extractPDFText, extractDocumentText } from '@/lib/ocr'

// Sample image for demo - a simple text-heavy PNG
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

export function OCRTestPage() {
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [usingDemo, setUsingDemo] = useState(false)
  const fileInputRef = useRef(null)

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

    try {
      console.log('Starting OCR test with file:', file.name, 'type:', file.type)
      
      let text = ''
      const fileType = file.type

      if (fileType.startsWith('image/')) {
        console.log('Processing image file with Tesseract.js...')
        const buffer = await file.arrayBuffer()
        
        // Simulate progress updates
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 300))
          setProgress(Math.min((i + 1) * 20, 80))
        }
        
        text = await extractImageText(buffer)
        setProgress(95)
      } else if (fileType === 'application/pdf') {
        console.log('Processing PDF file with PDF.js...')
        
        // Simulate progress
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 300))
          setProgress(Math.min((i + 1) * 30, 80))
        }
        
        text = await extractPDFText(file)
        setProgress(95)
      } else {
        throw new Error(`Unsupported file type: ${fileType}`)
      }

      console.log('OCR extraction complete. Text length:', text.length)
      setExtractedText(text)
      setSuccess(true)
      setProgress(100)
    } catch (err) {
      console.error('OCR test failed:', err)
      setError(`OCR Error: ${err.message}`)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText)
    alert('Text copied to clipboard!')
  }

  const handleDownloadText = () => {
    const element = document.createElement('a')
    const file = new Blob([extractedText], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `${file?.name || 'extracted'}_text.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDemoOCR = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)
    setExtractedText('')
    setProgress(0)

    try {
      // Simulate OCR processing with progress updates
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 150))
        setProgress(Math.min((i + 1) * 10, 95))
      }

      setExtractedText(DEMO_SAMPLE)
      setSuccess(true)
      setProgress(100)
      setUsingDemo(true)
    } catch (err) {
      console.error('Demo OCR failed:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">OCR Test Page</h1>
        <p className="text-muted-foreground">Test Tesseract.js OCR functionality for image and PDF text extraction</p>
      </div>

      {/* File Upload Card */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <CardTitle>Step 1: Upload File</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
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
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-foreground font-semibold mb-1">
              {file ? file.name : 'Drag and drop or click to select'}
            </p>
            <p className="text-sm text-muted-foreground">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type}`
                : `Supported: ${supportedFormats.join(', ')} (max 50 MB)`}
            </p>
          </div>

          {file && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground font-semibold">✓ File selected: {file.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR Test Card */}
      <Card className="border-accent/20">
        <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            <CardTitle>Step 2: Extract Text</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Button
            onClick={handleTestOCR}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing... {progress}%
              </>
            ) : (
              'Start OCR Extraction'
            )}
          </Button>

          {loading && (
            <div className="mt-4">
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {progress < 80 ? 'Initializing OCR engine...' : 'Finalizing extraction...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {success && extractedText && (
        <Card className="border-green-500/20 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle className="text-green-900 dark:text-green-100">✓ OCR Successful</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyText}
                  size="sm"
                  variant="outline"
                  className="border-green-200 dark:border-green-800"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  onClick={handleDownloadText}
                  size="sm"
                  variant="outline"
                  className="border-green-200 dark:border-green-800"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white dark:bg-black/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Characters</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {extractedText.length.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-black/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Words</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {extractedText.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-black/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Lines</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {extractedText.split('\n').length}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 bg-card/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extracted Text Preview</p>
                <textarea
                  value={extractedText}
                  readOnly
                  className="w-full h-48 p-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono resize-none focus:outline-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Section */}
      {!extractedText && !loading && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <ZapOff className="w-5 h-5 text-accent" />
              Try the Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Click below to see how OCR text extraction works with a sample document. This demonstrates the full extraction and analysis flow.
            </p>
            <Button
              onClick={handleDemoOCR}
              variant="accent"
              className="w-full"
              size="lg"
            >
              <ZapOff className="w-4 h-4 mr-2" />
              Run Demo OCR Extraction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!extractedText && !loading && (
        <Card className="border-muted/30 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">How to Test with Your Files</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. <strong>Upload a file:</strong> Drag and drop or click to select a PNG, JPG, PDF, or other supported format</p>
            <p>2. <strong>Run OCR:</strong> Click "Start OCR Extraction" to process the file</p>
            <p>3. <strong>View results:</strong> See the extracted text, character count, and preview</p>
            <p>4. <strong>Export:</strong> Copy the text or download it as a .txt file</p>
            <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded">
              <p className="text-xs"><strong>Tip:</strong> For best results with scanned documents, use high-quality images (PNG/JPG at 150+ DPI)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
