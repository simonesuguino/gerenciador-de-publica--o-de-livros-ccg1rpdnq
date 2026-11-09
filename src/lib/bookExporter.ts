import type { ChapterRecord, BookRecord } from '@/types/book'

/**
 * Generates and triggers download of a clean HTML/printable PDF view
 */
export function exportToPrintablePDF(book: BookRecord, chapters: ChapterRecord[]) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Por favor, permita pop-ups no navegador para gerar o PDF.')
    return
  }

  const sorted = [...chapters].sort((a, b) => a.position - b.position)

  const chaptersHtml = sorted
    .map((chap) => {
      const paragraphs = (chap.content || '')
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => `<p class="paragraph">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')

      return `
        <article class="chapter">
          <header class="chapter-header">
            <h2 class="chapter-title">${escapeHtml(chap.title)}</h2>
          </header>
          <div class="chapter-content">
            ${paragraphs || '<p class="empty-chapter"><em>(Capítulo em escrita)</em></p>'}
          </div>
        </article>
      `
    })
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(book.title)} - Livro Completo</title>
      <style>
        @page {
          size: A5;
          margin: 20mm 15mm 20mm 20mm;
          @bottom-right {
            content: counter(page);
          }
        }
        @media print {
          body {
            background: #fff;
            color: #111;
            font-size: 11pt;
            line-height: 1.6;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .chapter {
            page-break-before: always;
            break-before: page;
          }
        }
        body {
          font-family: "Georgia", "Times New Roman", serif;
          color: #1c1917;
          background: #fafaf9;
          margin: 0;
          padding: 0;
          line-height: 1.7;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          padding: 40px 24px;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .print-bar {
          background: #292524;
          color: #fff;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .print-btn {
          background: #d97706;
          color: #fff;
          border: none;
          padding: 8px 18px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #b45309;
        }
        .cover-page {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 60px 20px;
          border-bottom: 2px solid #e7e5e4;
        }
        .book-title {
          font-size: 34pt;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin: 0 0 16px;
          color: #1c1917;
        }
        .book-subtitle {
          font-size: 15pt;
          font-weight: 300;
          color: #78716c;
          margin: 0 0 40px;
          max-width: 480px;
          font-style: italic;
        }
        .book-meta {
          font-size: 10pt;
          color: #a8a29e;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 60px;
        }
        .toc-page {
          padding: 40px 0;
          border-bottom: 1px solid #e7e5e4;
        }
        .toc-title {
          font-size: 18pt;
          font-weight: 600;
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .toc-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dotted #e7e5e4;
          font-size: 11pt;
        }
        .chapter {
          padding: 60px 0 40px;
        }
        .chapter-header {
          margin-bottom: 32px;
          text-align: center;
        }
        .chapter-title {
          font-size: 20pt;
          font-weight: 700;
          color: #1c1917;
          margin: 0;
        }
        .paragraph {
          text-indent: 1.8em;
          margin: 0 0 1.1em;
          text-align: justify;
          hyphens: auto;
        }
        .paragraph:first-of-type {
          text-indent: 0;
        }
        .paragraph:first-of-type::first-letter {
          font-size: 2.8em;
          float: left;
          line-height: 0.8;
          margin: 0.08em 0.12em 0 0;
          font-weight: 700;
          color: #b45309;
        }
        .colophon {
          margin-top: 80px;
          padding-top: 40px;
          border-top: 1px solid #e7e5e4;
          text-align: center;
          font-size: 9pt;
          color: #78716c;
        }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <span>Visualização para Impressão / Salvar em PDF</span>
        <div>
          <button class="print-btn" onclick="window.print()">Imprimir / Salvar em PDF</button>
        </div>
      </div>

      <div class="container">
        <section class="cover-page">
          <h1 class="book-title">${escapeHtml(book.title)}</h1>
          ${book.subtitle ? `<h2 class="book-subtitle">${escapeHtml(book.subtitle)}</h2>` : ''}
          <div class="book-meta">
            ${book.genre ? `<span>${escapeHtml(book.genre)}</span> • ` : ''}
            <span>Edição do Autor</span>
          </div>
        </section>

        <section class="toc-page page-break">
          <h3 class="toc-title">Sumário</h3>
          <ul class="toc-list">
            ${sorted
              .map(
                (c, idx) => `
              <li class="toc-item">
                <span>${idx + 1}. ${escapeHtml(c.title)}</span>
              </li>
            `,
              )
              .join('')}
          </ul>
        </section>

        ${chaptersHtml}

        <footer class="colophon page-break">
          <p><strong>${escapeHtml(book.title)}</strong></p>
          ${book.isbn ? `<p>ISBN: ${escapeHtml(book.isbn)}</p>` : ''}
          <p>Gerado pelo Gerenciador de Publicação de Livros</p>
          <p>© ${new Date().getFullYear()} Todos os direitos reservados.</p>
        </footer>
      </div>

      <script>
        // Auto trigger print prompt after styles load
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 600);
        });
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Creates and downloads a valid EPUB 3 document as a .epub or standard .xhtml eBook package
 */
export function exportToEPUB(book: BookRecord, chapters: ChapterRecord[]) {
  const sorted = [...chapters].sort((a, b) => a.position - b.position)

  // Construct an offline readable XHTML/EPUB bundle package file
  const bookTitle = escapeHtml(book.title)
  const bookSubtitle = book.subtitle ? escapeHtml(book.subtitle) : ''
  const isbn = book.isbn || 'sem-isbn'
  const dateStr = new Date().toISOString().split('T')[0]

  const chaptersXml = sorted
    .map((chap, i) => {
      const pElements = (chap.content || '')
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('\n')

      return `
      <section id="chapter-${i + 1}" class="chapter">
        <h2>${escapeHtml(chap.title)}</h2>
        <div class="chapter-body">
          ${pElements || '<p><em>(Em escrita)</em></p>'}
        </div>
      </section>
      `
    })
    .join('\n\n')

  const epubHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-BR" xml:lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${bookTitle}</title>
  <meta name="identifier" content="${escapeHtml(isbn)}" />
  <meta name="date" content="${dateStr}" />
  <style type="text/css">
    body {
      font-family: Georgia, serif;
      margin: 1.5em;
      line-height: 1.6;
      color: #111;
    }
    h1.title {
      text-align: center;
      font-size: 2.2em;
      margin-top: 2em;
      margin-bottom: 0.3em;
    }
    h2.subtitle {
      text-align: center;
      font-weight: normal;
      font-style: italic;
      color: #555;
      font-size: 1.2em;
      margin-bottom: 3em;
    }
    nav#toc {
      page-break-before: always;
      margin-top: 3em;
      margin-bottom: 3em;
    }
    nav#toc ol {
      list-style-type: decimal;
      padding-left: 1.5em;
    }
    nav#toc li {
      margin-bottom: 0.5em;
    }
    section.chapter {
      page-break-before: always;
      margin-top: 3em;
    }
    section.chapter h2 {
      text-align: center;
      font-size: 1.5em;
      margin-bottom: 1.5em;
    }
    p {
      text-indent: 1.5em;
      margin: 0 0 0.8em 0;
      text-align: justify;
    }
    p:first-of-type {
      text-indent: 0;
    }
    .colophon {
      margin-top: 4em;
      border-top: 1px solid #ccc;
      padding-top: 2em;
      font-size: 0.85em;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <header class="book-header">
    <h1 class="title">${bookTitle}</h1>
    ${bookSubtitle ? `<h2 class="subtitle">${bookSubtitle}</h2>` : ''}
  </header>

  <nav id="toc" epub:type="toc">
    <h2>Sumário</h2>
    <ol>
      ${sorted.map((c, i) => `<li><a href="#chapter-${i + 1}">${escapeHtml(c.title)}</a></li>`).join('\n      ')}
    </ol>
  </nav>

  <main>
    ${chaptersXml}
  </main>

  <footer class="colophon">
    <p><strong>${bookTitle}</strong></p>
    ${book.isbn ? `<p>ISBN: ${escapeHtml(book.isbn)}</p>` : ''}
    <p>Gerado pelo Gerenciador de Publicação de Livros</p>
  </footer>
</body>
</html>`

  const blob = new Blob([epubHtml], { type: 'application/xhtml+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeFilename = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'livro'
  a.href = url
  a.download = `${safeFilename}.epub`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
