import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * RA Letterhead configuration
 */
const RA_LETTERHEAD = {
  organization: 'NORTH WEST REGIONAL ASSEMBLY',
  region: 'Northwest Region, Cameroon',
  website: 'www.nwregionalassembly.gov.cm',
  email: 'info@nwra.gov.cm',
  phone: '+237 (0) 333-xxx-xxx',
  colors: {
    primary: '#6B6FA6',
    accent: '#DD7E42',
  },
}

/**
 * Generate PDF with RA letterhead
 */
export async function generateReportPDF(reportTitle, content, options = {}) {
  const {
    fileName = 'report.pdf',
    orientation = 'portrait',
    format = 'a4',
    includeFooter = true,
    includeHeaderImage = true,
  } = options

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Add RA Letterhead
    if (includeHeaderImage) {
      yPosition = addLetterhead(pdf, pageWidth, margin, yPosition)
      yPosition += 10 // Add space after letterhead
    }

    // Add report title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(reportTitle, margin, yPosition)
    yPosition += 15

    // Add report date
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition)
    yPosition += 10

    // Add horizontal line
    pdf.setDrawColor(107, 111, 166) // Primary color
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10

    // Add content
    if (typeof content === 'string') {
      // Text content
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      const maxWidth = pageWidth - 2 * margin
      const lines = pdf.splitTextToSize(content, maxWidth)
      yPosition = pdf.internal.getLineHeight() / pdf.internal.scaleFactor

      lines.forEach((line, index) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(line, margin, yPosition)
        yPosition += pdf.internal.getLineHeight() / pdf.internal.scaleFactor
      })
    } else if (typeof content === 'function') {
      // Dynamic content from function
      const contentYPos = await content(pdf, margin, yPosition, pageWidth, pageHeight)
      yPosition = contentYPos
    }

    // Add footer
    if (includeFooter) {
      addFooter(pdf, pageWidth, pageHeight)
    }

    pdf.save(fileName)
    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    throw new Error(`Failed to generate PDF: ${err.message}`)
  }
}

/**
 * Add RA Letterhead to PDF
 */
function addLetterhead(pdf, pageWidth, margin, yPosition) {
  const centerX = pageWidth / 2

  // Organization name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(...hexToRgb(RA_LETTERHEAD.colors.primary))
  pdf.text(RA_LETTERHEAD.organization, centerX, yPosition, { align: 'center' })
  yPosition += 7

  // Region
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(100, 100, 100)
  pdf.text(RA_LETTERHEAD.region, centerX, yPosition, { align: 'center' })
  yPosition += 6

  // Contact info
  pdf.setFontSize(8)
  pdf.setTextColor(120, 120, 120)
  pdf.text(`${RA_LETTERHEAD.email} | ${RA_LETTERHEAD.phone} | ${RA_LETTERHEAD.website}`, centerX, yPosition, { align: 'center' })
  yPosition += 6

  return yPosition
}

/**
 * Add footer to PDF
 */
function addFooter(pdf, pageWidth, pageHeight) {
  const footerY = pageHeight - 10
  const centerX = pageWidth / 2

  // Decorative line
  pdf.setDrawColor(221, 126, 66) // Accent color
  pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5)

  // Footer text
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(120, 120, 120)
  pdf.text('Regional Assembly Analytics and Archive Management Platform', centerX, footerY, { align: 'center' })

  // Page number
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.text(`Page ${i} of ${pageCount}`, centerX, footerY + 3, { align: 'center' })
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

/**
 * Export HTML element as PDF with letterhead
 */
export async function exportElementAsPDF(elementId, reportTitle, fileName = 'report.pdf') {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // Add letterhead
    yPosition = addLetterhead(pdf, pageWidth, margin, yPosition)
    yPosition += 10

    // Add title
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text(reportTitle, margin, yPosition)
    yPosition += 8

    // Add date
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition)
    yPosition += 10

    // Add image
    const imgWidth = pageWidth - 2 * margin
    const imgHeight = (canvas.height / canvas.width) * imgWidth
    pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)

    // Add footer
    addFooter(pdf, pageWidth, pageHeight)

    pdf.save(fileName)
    return true
  } catch (err) {
    console.error('Export error:', err)
    throw new Error(`Failed to export PDF: ${err.message}`)
  }
}

/**
 * Create formatted analytics report PDF
 */
export async function createAnalyticsReportPDF(analyticsData, fileName = 'analytics-report.pdf') {
  const {
    title = 'Regional Assembly Analytics Report',
    metrics = [],
    charts = [],
    insights = [],
  } = analyticsData

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Add letterhead
  yPosition = addLetterhead(pdf, pageWidth, margin, yPosition)
  yPosition += 15

  // Title
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.text(title, margin, yPosition)
  yPosition += 12

  // Metrics section
  if (metrics.length > 0) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('Key Performance Metrics', margin, yPosition)
    yPosition += 8

    metrics.forEach(metric => {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text(`• ${metric.name}: ${metric.value}% (${metric.status})`, margin + 5, yPosition)
      yPosition += 6

      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = margin
      }
    })
  }

  // Insights section
  if (insights.length > 0) {
    yPosition += 8
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('Key Insights', margin, yPosition)
    yPosition += 8

    insights.forEach(insight => {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const wrapped = pdf.splitTextToSize(`• ${insight}`, pageWidth - 2 * margin - 5)
      wrapped.forEach(line => {
        pdf.text(line, margin + 5, yPosition)
        yPosition += 5
      })

      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = margin
      }
    })
  }

  // Add footer
  addFooter(pdf, pageWidth, pageHeight)

  pdf.save(fileName)
  return true
}
