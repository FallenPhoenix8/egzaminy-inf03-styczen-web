import puppeteer from "puppeteer"
import fs from "fs"
import path from "path"

export default async function extractTextFromPDF(pdfPath) {
  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    // Create a simple HTML page with PDF.js viewer
    const htmlContent = `
      <!DOCTYPE html>
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
          }

          // Function to be called by Puppeteer to load PDF and extract text
          window.extractText = async function(base64PDF) {
            const pdfData = atob(base64PDF);
            const buffer = new Uint8Array(pdfData.length);
            for (let i = 0; i < pdfData.length; i++) {
              buffer[i] = pdfData.charCodeAt(i) & 0xFF;
            }
            const text = await extractTextFromPDF(buffer);
            return text;
          };
        </script>
      </body>
      </html>
    `

    // Create a temporary HTML file
    const tempHtmlPath = path.join(process.cwd(), "pdf-extractor.html")
    fs.writeFileSync(tempHtmlPath, htmlContent)

    // Load the HTML page
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" })

    // Read PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath)
    const pdfBase64 = pdfBuffer.toString("base64")

    // Extract text from the PDF
    const extractedText = await page.evaluate((base64PDF) => {
      return window.extractText(base64PDF)
    }, pdfBase64)

    // Clean up
    fs.unlinkSync(tempHtmlPath)
    await browser.close()

    // Return the extracted text
    return extractedText
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
  }
}
