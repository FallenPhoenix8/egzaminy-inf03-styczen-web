import fs from "fs"
import path, { join } from "path"
import puppeteer from "puppeteer"
import getExamText from "~/utils/server/get-exam-text"

async function generatePreviewImages(pdfPath) {
  try {
    // Create output directory if it doesn't exist
    const baseName = path.basename(pdfPath, ".pdf")
    const outputDir = path.join(path.dirname(pdfPath), "preview")

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    console.log("Launching browser...")
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    // Set viewport to a reasonable size
    await page.setViewport({ width: 1200, height: 1600 })

    // Create a simple HTML page with PDF.js viewer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; padding: 20px; }
          #canvas-container { display: flex; flex-direction: column; align-items: center; }
          canvas { border: 1px solid #ccc; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div id="canvas-container"></div>
        <script>
          // Initialize PDF.js
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          // PDF loading and rendering
          async function renderPDF(pdfData) {
            const loadingTask = pdfjsLib.getDocument({data: pdfData});
            const pdf = await loadingTask.promise;
            
            const container = document.getElementById('canvas-container');
            
            // Store page count in global variable for puppeteer to access
            window.pageCount = pdf.numPages;
            console.log('PDF has ' + pdf.numPages + ' pages');
            
            // Render each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              
              // Scale to fit viewport width
              const viewport = page.getViewport({scale: 1.5});
              
              // Create canvas for this page
              const canvas = document.createElement('canvas');
              canvas.id = 'page-' + pageNum;
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              canvas.setAttribute('data-loaded', 'false');
              container.appendChild(canvas);
              
              // Render PDF page into canvas context
              const context = canvas.getContext('2d');
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              canvas.setAttribute('data-loaded', 'true');
              console.log('Page ' + pageNum + ' rendered');
            }
            
            // Signal that we're done rendering all pages
            window.pdfRendered = true;
          }
          
          // Function to be called by puppeteer to load PDF
          window.loadPDF = function(base64PDF) {
            const pdfData = atob(base64PDF);
            
            // Convert binary string to array buffer
            const buffer = new ArrayBuffer(pdfData.length);
            const view = new Uint8Array(buffer);
            for (let i = 0; i < pdfData.length; i++) {
              view[i] = pdfData.charCodeAt(i) & 0xFF;
            }
            
            // Render the PDF
            renderPDF(buffer);
          };
        </script>
      </body>
      </html>
    `

    // Create a temporary HTML file
    const tempHtmlPath = path.join(outputDir, "pdf-renderer.html")
    fs.writeFileSync(tempHtmlPath, htmlContent)

    console.log("Loading PDF viewer...")
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0" })

    // Read PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath)
    const pdfBase64 = pdfBuffer.toString("base64")

    // Load the PDF into the viewer
    console.log("Loading PDF into viewer...")
    await page.evaluate((base64PDF) => {
      window.loadPDF(base64PDF)
    }, pdfBase64)

    // Wait for all pages to be rendered
    console.log("Waiting for PDF to render...")
    await page.waitForFunction(() => window.pdfRendered === true, {
      timeout: 60000,
    })

    // Get the page count
    const pageCount = await page.evaluate(() => window.pageCount)
    console.log(`PDF has ${pageCount} pages. Taking screenshots...`)

    // Take screenshots of each page
    for (let i = 1; i <= pageCount; i++) {
      console.log(`Processing page ${i}/${pageCount}...`)

      // Wait for the specific page to be fully rendered
      await page.waitForFunction(
        (pageNum) => {
          const canvas = document.getElementById("page-" + pageNum)
          return canvas && canvas.getAttribute("data-loaded") === "true"
        },
        { timeout: 30000 },
        i
      )

      // Take screenshot of the canvas
      const canvas = await page.$(`#page-${i}`)
      const outputPath = path.join(outputDir, `page-${i}.png`)

      await canvas.screenshot({
        path: outputPath,
        type: "png",
        omitBackground: false,
      })

      console.log(`Saved page ${i} to ${outputPath}`)
    }

    // Clean up temporary file
    fs.unlinkSync(tempHtmlPath)

    console.log("Closing browser...")
    await browser.close()
    console.log(`All ${pageCount} pages converted successfully to ${outputDir}`)
  } catch (error) {
    console.error("Error converting PDF to images:", error)
  }
}

function isPreviewImagesExist(previewImagesPath) {
  if (!fs.existsSync(previewImagesPath)) {
    return false
  }

  const previewImages = fs.readdirSync(previewImagesPath)
  return previewImages.filter((file) => file.endsWith(".png")).length > 0
}

export default defineEventHandler(async (event) => {
  const { exam } = event.context.params
  const examPath = join(useRuntimeConfig().projectRoot, "/public/exams", exam)
  const previewImagesPath = join(examPath, "preview")

  const examFile = join(
    examPath,
    fs
      .readdirSync(examPath)
      .filter((file) => !file.includes("zo") && file.endsWith(".pdf"))[0]
  )

  if (!isPreviewImagesExist(previewImagesPath)) {
    console.log("Preview directory not found. Generating preview images...")
    await generatePreviewImages(examFile)
  }

  const previewImages = fs.readdirSync(previewImagesPath)

  const archive = fs
    .readdirSync(examPath)
    .filter((file) => !file.includes("zo") && !file.endsWith(".pdf"))[0]

  const solution = fs
    .readdirSync(examPath)
    .filter((file) => file.includes("zo") && file.endsWith(".pdf"))[0]

  const details = {
    name: exam,
    text: await getExamText(exam),
    url: {
      exam: `/exams/${exam}`,
      solution: `/exams/${exam}/${solution}`,
      archive: `/exams/${exam}/${archive}`,
    },
    previewImages: previewImages.map(
      (file) => `/exams/${exam}/preview/${file}`
    ),
  }

  return details
})
