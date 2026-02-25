function sanitizeText(value) {
  return String(value ?? '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildContentStream(lines) {
  const safeLines = lines.map((line) => sanitizeText(line))
  const body = safeLines
    .map((line, index) => (index === 0 ? `(${line}) Tj` : `0 -14 Td (${line}) Tj`))
    .join('\n')

  return `BT\n/F1 10 Tf\n50 780 Td\n${body}\nET\n`
}

export function downloadSimplePdf({ filename, lines }) {
  const linesPerPage = 48
  const pages = []

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage))
  }
  if (pages.length === 0) pages.push(['Report'])

  const objectContents = []
  const pageObjectNumbers = []
  const contentObjectNumbers = []

  for (let i = 0; i < pages.length; i += 1) {
    pageObjectNumbers.push(3 + i * 2)
    contentObjectNumbers.push(4 + i * 2)
  }
  const fontObjectNumber = 3 + pages.length * 2

  const kids = pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')
  objectContents[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objectContents[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`

  pages.forEach((pageLines, index) => {
    const pageObjectNumber = pageObjectNumbers[index]
    const contentObjectNumber = contentObjectNumbers[index]
    const stream = buildContentStream(pageLines)
    objectContents[pageObjectNumber] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    objectContents[contentObjectNumber] =
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
  })

  objectContents[fontObjectNumber] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (let i = 1; i < objectContents.length; i += 1) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objectContents[i]}\nendobj\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objectContents.length}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i < objectContents.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objectContents.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
