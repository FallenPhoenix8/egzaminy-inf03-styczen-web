import { join } from "path"
import fs from "fs"
import extractTextFromPDF from "~/utils/server/extract-text-from-pdf"

export default async function getExamText(exam: string) {
  const examPath = join(useRuntimeConfig().projectRoot, "/public/exams", exam)

  const pdfPath = join(
    useRuntimeConfig().projectRoot,
    "/public/exams",
    exam,
    fs
      .readdirSync(examPath)
      .filter((file) => !file.includes("zo") && file.endsWith(".pdf"))[0]
  )

  let text = ""
  // Check if `text.txt` exists
  if (fs.existsSync(join(examPath, "text.exam.txt"))) {
    text = fs.readFileSync(join(examPath, "text.exam.txt"), "utf-8")
  } else {
    text = await extractTextFromPDF(pdfPath)
    fs.writeFileSync(join(examPath, "text.exam.txt"), text)
  }

  return text
}
