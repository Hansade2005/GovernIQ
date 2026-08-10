import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker - use the bundled worker from pdfjs-dist
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Extract text from image files using Tesseract.js (client-side OCR)
 */
export async function extractImageText(imageBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: (m) => {
          console.log(`OCR: ${(m.progress * 100).toFixed(0)}%`)
        },
      }
    )
    return text
  } catch (err) {
    console.error('OCR error:', err)
    throw new Error(`OCR failed: ${err.message}`)
  }
}

/**
 * Extract text from PDF files using PDF.js
 * Falls back to OCR (Tesseract.js) if PDF is image-based (scanned)
 */
export async function extractPDFText(file, onProgress) {
  try {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

    // First, try to extract text from PDF
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item) => item.str).join(' ')
      fullText += pageText + ' '
    }

    // If PDF has extractable text, return it
    if (fullText.trim().length > 100) {
      console.log(`PDF.js extracted ${fullText.length} characters from ${file.name}`)
      return fullText.trim()
    }

    // PDF is image-based (scanned) — fall back to OCR
    console.log(`PDF.js found insufficient text (${fullText.length} chars). Falling back to Tesseract.js OCR...`)
    
    if (onProgress) onProgress({ step: 'ocr_fallback', message: 'PDF appears to be scanned. Running OCR...' })
    
    // Convert PDF pages to images and run OCR
    let ocrText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      
      // Render page to canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const viewport = page.getViewport({ scale: 2 }) // Higher scale for better OCR quality
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
      
      // Extract image data and run OCR
      const imageData = canvas.toDataURL('image/png')
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (onProgress) {
              onProgress({
                step: 'ocr_page',
                page: i,
                totalPages: pdf.numPages,
                progress: m.progress,
              })
            }
          },
        }
      )
      
      ocrText += text + ' '
    }

    if (ocrText.trim().length === 0) {
      throw new Error('OCR extraction returned no text')
    }

    console.log(`OCR extracted ${ocrText.length} characters from scanned PDF`)
    return ocrText.trim()
  } catch (err) {
    console.error('PDF extraction error:', err)
    throw new Error(`PDF extraction failed: ${err.message}`)
  }
}

/**
 * Full-text search across documents with relevance ranking
 * Returns documents that match the search term, ranked by relevance score
 */
export function searchText(documents, searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return []

  const term = searchTerm.toLowerCase()
  const words = term.split(/\s+/).filter((w) => w.length > 0)

  return documents
    .map((doc) => {
      let score = 0

      // Search title (highest weight)
      if (doc.title) {
        const titleLower = doc.title.toLowerCase()
        if (titleLower.includes(term)) score += 100
        words.forEach((word) => {
          if (titleLower.includes(word)) score += 30
        })
      }

      // Search extracted text (medium weight)
      if (doc.extracted_text && !doc.extracted_text.includes('[Document uploaded but')) {
        const textLower = doc.extracted_text.toLowerCase()
        if (textLower.includes(term)) score += 50
        const termOccurrences = (textLower.match(new RegExp(term.replace(/\s+/g, '\\s+'), 'g')) || []).length
        score += termOccurrences * 5

        words.forEach((word) => {
          const wordOccurrences = (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
          score += wordOccurrences * 3
        })
      }

      // Search metadata/description
      if (doc.metadata?.description) {
        const descLower = doc.metadata.description.toLowerCase()
        if (descLower.includes(term)) score += 25
      }

      // Search document type
      if (doc.type && doc.type.toLowerCase().includes(term)) {
        score += 10
      }

      return { ...doc, score }
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Extract text based on file type
 */
export async function extractDocumentText(file) {
  const fileType = file.type

  if (fileType.startsWith('image/')) {
    const buffer = await file.arrayBuffer()
    return extractImageText(buffer)
  } else if (fileType === 'application/pdf') {
    return extractPDFText(file)
  } else {
    throw new Error(`Unsupported file type: ${fileType}`)
  }
}


