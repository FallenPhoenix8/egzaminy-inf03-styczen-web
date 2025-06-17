import fs from "fs"
import path, { join } from "path"
import puppeteer from "puppeteer"
import getExamText from "~/utils/server/get-exam-text"

// Map to track ongoing preview generation processes
const previewGenerationMap = new Map()

async function generatePreviewImages(pdfPath) {
  let browser = null
  let tempHtmlPath = null
  
  try {
    // Check if this PDF is already being processed
    if (previewGenerationMap.has(pdfPath)) {
      console.log(`Preview generation already in progress for ${pdfPath}`)
      return await previewGenerationMap.get(pdfPath)
    }

    // Create a promise for this generation process
    const generationPromise = (async () => {
      try {
        // Create output directory if it doesn't exist
        const outputDir = path.join(path.dirname(pdfPath), "preview")

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        // Check if PDF file exists
        if (!fs.existsSync(pdfPath)) {
          throw new Error(`PDF file not found: ${pdfPath}`)
        }

        console.log("Launching browser...")
        browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor"
          ],
        })

        const page = await browser.newPage()
        
        // Set timeout and error handlers
        page.setDefaultTimeout(60000)
        
        page.on('error', (error) => {
          console.error('Page error:', error)
        })

        page.on('pageerror', (error) => {
          console.error('Page error in browser:', error)
        })

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
              try {
                // Initialize PDF.js
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                // PDF loading and rendering
                async function renderPDF(pdfData) {
                  try {
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
                  } catch (error) {
                    console.error('Error rendering PDF:', error);
                    window.pdfError = error.message;
                  }
                }
                
                // Function to be called by puppeteer to load PDF
                window.loadPDF = function(base64PDF) {
                  try {
                    const pdfData = atob(base64PDF);
                    
                    // Convert binary string to array buffer
                    const buffer = new ArrayBuffer(pdfData.length);
                    const view = new Uint8Array(buffer);
                    for (let i = 0; i < pdfData.length; i++) {
                      view[i] = pdfData.charCodeAt(i) & 0xFF;
                    }
                    
                    // Render the PDF
                    renderPDF(buffer);
                  } catch (error) {
                    console.error('Error loading PDF:', error);
                    window.pdfError = error.message;
                  }
                };
              } catch (error) {
                console.error('Global error:', error);
                window.pdfError = error.message;
              }
            </script>
          </body>
          </html>
        `

        // Create a temporary HTML file with unique name
        const timestamp = Date.now()
        tempHtmlPath = path.join(outputDir, `pdf-renderer-${timestamp}.html`)
        fs.writeFileSync(tempHtmlPath, htmlContent)

        console.log("Loading PDF viewer...")
        await page.goto(`file://${tempHtmlPath}`, { 
          waitUntil: "networkidle0",
          timeout: 60000
        })

        // Read PDF file and convert to base64
        const pdfBuffer = fs.readFileSync(pdfPath)
        const pdfBase64 = pdfBuffer.toString("base64")

        // Load the PDF into the viewer
        console.log("Loading PDF into viewer...")
        await page.evaluate((base64PDF) => {
          window.loadPDF(base64PDF)
        }, pdfBase64)

        // Wait for all pages to be rendered or error
        console.log("Waiting for PDF to render...")
        await page.waitForFunction(() => {
          return window.pdfRendered === true || window.pdfError !== undefined
        }, {
          timeout: 60000,
        })

        // Check for errors
        const pdfError = await page.evaluate(() => window.pdfError)
        if (pdfError) {
          throw new Error(`PDF rendering error: ${pdfError}`)
        }

        // Get the page count
        const pageCount = await page.evaluate(() => window.pageCount)
        if (!pageCount || pageCount === 0) {
          throw new Error('No pages found in PDF')
        }
        
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
          if (!canvas) {
            console.warn(`Canvas for page ${i} not found, skipping...`)
            continue
          }
          
          const outputPath = path.join(outputDir, `page-${i}.png`)

          await canvas.screenshot({
            path: outputPath,
            type: "png",
            omitBackground: false,
          })

          console.log(`Saved page ${i} to ${outputPath}`)
        }

        console.log(`All ${pageCount} pages converted successfully to ${outputDir}`)
        return outputDir
      } catch (error) {
        console.error("Error converting PDF to images:", error)
        throw error
      } finally {
        // Cleanup
        try {
          if (browser) {
            await browser.close()
            console.log("Browser closed")
          }
        } catch (closeError) {
          console.error('Error closing browser:', closeError)
        }
        
        try {
          if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath)
          }
        } catch (unlinkError) {
          console.error('Error removing temp HTML file:', unlinkError)
        }
      }
    })()

    // Store the promise in the map
    previewGenerationMap.set(pdfPath, generationPromise)
    
    try {
      const result = await generationPromise
      return result
    } finally {
      // Remove from map when done
      previewGenerationMap.delete(pdfPath)
    }
  } catch (error) {
    // Remove from map on error as well
    previewGenerationMap.delete(pdfPath)
    console.error("Error in generatePreviewImages:", error)
    throw error
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
  try {
    const { exam } = event.context.params
    
    if (!exam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Exam parameter is required'
      })
    }

    const examPath = join(useRuntimeConfig().projectRoot, "/public/exams", exam)
    
    // Check if exam directory exists
    if (!fs.existsSync(examPath)) {
      throw createError({
        statusCode: 404,
        statusMessage: `Exam not found: ${exam}`
      })
    }

    const previewImagesPath = join(examPath, "preview")

    // Find exam PDF file
    const examFiles = fs
      .readdirSync(examPath)
      .filter((file) => !file.includes("zo") && file.endsWith(".pdf"))
    
    if (examFiles.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: `No exam PDF found in ${exam}`
      })
    }

    const examFile = join(examPath, examFiles[0])

    // Generate preview images if they don't exist
    if (!isPreviewImagesExist(previewImagesPath)) {
      console.log("Preview directory not found. Generating preview images...")
      try {
        await generatePreviewImages(examFile)
      } catch (previewError) {
        console.error('Error generating preview images:', previewError)
        // Continue without preview images rather than failing completely
      }
    }

    // Get preview images (may be empty if generation failed)
    let previewImages = []
    try {
      if (fs.existsSync(previewImagesPath)) {
        previewImages = fs.readdirSync(previewImagesPath)
          .filter(file => file.endsWith('.png'))
          .sort() // Sort to ensure consistent order
      }
    } catch (previewReadError) {
      console.error('Error reading preview images:', previewReadError)
    }

    const archiveExtensions = [".zip", ".7z", ".rar", ".tar", ".tar.gz"]

    // Find archive file
    let archive = null
    try {
      const archiveFiles = fs.readdirSync(examPath).filter((file) => {
        return archiveExtensions.some(ext => file.endsWith(ext))
      })
      archive = archiveFiles.length > 0 ? archiveFiles[0] : null
    } catch (archiveError) {
      console.error('Error finding archive file:', archiveError)
    }

    // Find solution PDF
    let solution = null
    try {
      const solutionFiles = fs
        .readdirSync(examPath)
        .filter((file) => file.includes("zo") && file.endsWith(".pdf"))
      solution = solutionFiles.length > 0 ? solutionFiles[0] : null
    } catch (solutionError) {
      console.error('Error finding solution file:', solutionError)
    }

    const examPdf = examFiles[0]

    // Get exam text
    let examText = ''
    try {
      examText = await getExamText(exam)
    } catch (textError) {
      console.error('Error getting exam text:', textError)
      // Continue without text rather than failing
    }

    const details = {
      name: exam,
      text: examText,
      url: {
        exam: `/exams/${exam}/${examPdf}`,
        gradingRules: solution ? `/exams/${exam}/${solution}` : null,
        archive: archive ? `/exams/${exam}/${archive}` : null,
      },
      previewImages: previewImages.map(
        (file) => `/exams/${exam}/preview/${file}`
      ),
    }

    return details
  } catch (error) {
    console.error('Error in exam details handler:', error)
    
    // If it's already an HTTP error, rethrow it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, create a generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while fetching exam details'
    })
  }
})
