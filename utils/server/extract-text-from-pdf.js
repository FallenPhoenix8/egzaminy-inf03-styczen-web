import fs from 'fs'
import path from 'path'
import os from 'os'
import { browserPool } from './browser-pool.js'
export default async function extractTextFromPDF(pdfPath) {
  let browser = null
  let tempHtmlPath = null
  
  try {
    // Check if PDF file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`)
    }

    // Get browser from the pool
    browser = await browserPool.getBrowser()

    const page = await browser.newPage()

    // Set timeout for page operations
    page.setDefaultTimeout(30000)

    // Handle page errors
    page.on('error', (error) => {
      console.error('Page error:', error)
    })

    page.on('pageerror', (error) => {
      console.error('Page error in browser:', error)
    })

    // Create a simple HTML page with PDF.js viewer
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>PDF Text Extractor</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      </head>
      <body>
        <script>
          // Initialize PDF.js
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          async function extractTextFromPDF(pdfData) {
            try {
              const loadingTask = pdfjsLib.getDocument({data: pdfData});
              const pdf = await loadingTask.promise;
              let textContent = '';

              // Loop through each page and extract text
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContentPage = await page.getTextContent();
                const textItems = textContentPage.items;

                // Concatenate text items
                for (const item of textItems) {
                  textContent += item.str + ' ';
                }
              }

              return textContent.trim();
            } catch (error) {
              console.error('Error in extractTextFromPDF:', error);
              return '';
            }
          }

          // Function to be called by Puppeteer to load PDF and extract text
          window.extractText = async function(base64PDF) {
            try {
              const pdfData = atob(base64PDF);
              const buffer = new Uint8Array(pdfData.length);
              for (let i = 0; i < pdfData.length; i++) {
                buffer[i] = pdfData.charCodeAt(i) & 0xFF;
              }
              const text = await extractTextFromPDF(buffer);
              return text || '';
            } catch (error) {
              console.error('Error in extractText:', error);
              return '';
            }
          };

          window.addEventListener('error', function(event) {
            console.error('Global error:', event.error);
          });
        </script>
      </body>
      </html>
    `

    // Create a temporary HTML file with unique name to avoid conflicts
    const timestamp = Date.now()
    tempHtmlPath = path.join(process.cwd(), `pdf-extractor-${timestamp}.html`)
    fs.writeFileSync(tempHtmlPath, htmlContent)

    // Load the HTML page with timeout
    await page.goto(`file://${tempHtmlPath}`, { 
      waitUntil: "networkidle0",
      timeout: 30000
    })

    // Read PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath)
    const pdfBase64 = pdfBuffer.toString("base64")

    // Extract text from the PDF with timeout
    const extractedText = await Promise.race([
      page.evaluate((base64PDF) => {
        return window.extractText(base64PDF)
      }, pdfBase64),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Text extraction timeout')), 25000)
      )
    ])

    // Validate extracted text
    const validText = typeof extractedText === 'string' ? extractedText : ''
    
    return validText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return '' // Return empty string instead of undefined
  } finally {
    // Ensure cleanup happens
    try {
      if (browser) {
        await browser.close()
      }
    } catch (closeError) {
      console.error('Error closing browser:', closeError)
    }
    
    try {
      if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath)
      }
    } catch (unlinkError) {
      console.error('Error removing temp file:', unlinkError)
    }
  }
}
