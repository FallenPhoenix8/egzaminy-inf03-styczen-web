import { join } from "path"
import fs from "fs"
import extractTextFromPDF from "~/utils/server/extract-text-from-pdf"

export default async function getExamText(exam: string) {
  try {
    const examPath = join(useRuntimeConfig().projectRoot, "/public/exams", exam)

    // Check if exam directory exists
    if (!fs.existsSync(examPath)) {
      console.error(`Exam directory not found: ${examPath}`)
      return ''
    }

    // Find PDF file with better error handling
    const pdfFiles = fs
      .readdirSync(examPath)
      .filter((file) => !file.includes("zo") && file.endsWith(".pdf"))
    
    if (pdfFiles.length === 0) {
      console.error(`No PDF file found in exam directory: ${examPath}`)
      return ''
    }

    const pdfPath = join(
      useRuntimeConfig().projectRoot,
      "/public/exams",
      exam,
      pdfFiles[0]
    )

    let text = ""
    const textFilePath = join(examPath, "text.exam.txt")
    
    // Check if cached text file exists
    if (fs.existsSync(textFilePath)) {
      try {
        text = fs.readFileSync(textFilePath, "utf-8")
      } catch (readError) {
        console.error('Error reading cached text file:', readError)
        // Fall back to extracting from PDF
        text = await extractTextFromPDF(pdfPath)
      }
    } else {
      // Extract text from PDF
      text = await extractTextFromPDF(pdfPath)
      
      // Only write to file if we have valid text
      if (text && typeof text === 'string' && text.trim().length > 0) {
        try {
          fs.writeFileSync(textFilePath, text)
        } catch (writeError) {
          console.error('Error writing text cache file:', writeError)
          // Don't throw - we still have the text
        }
      }
    }

    return text || ''
  } catch (error) {
    console.error('Error in getExamText:', error)
    return ''
  }
}
