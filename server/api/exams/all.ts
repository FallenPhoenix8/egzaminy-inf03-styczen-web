// prepare `__dirname`
import { fileURLToPath } from "url"
import { dirname } from "path"
import { join } from "path"
import { promises as fs } from "fs"
import type { Exam } from "~/types/Exam"
import getExamText from "~/utils/server/get-exam-text"

export async function getAllExams(isServerCall: boolean): Promise<Exam[]> {
  const examsPath = join(useRuntimeConfig().projectRoot, "/public/exams")

  const examDirectories = await fs.readdir(examsPath)

  let exams: Exam[] = []

  for (const examDirectory of examDirectories) {
    const examPath = join(examsPath, examDirectory)
    if ((await fs.lstat(examPath)).isDirectory() === false) {
      console.log(`${examPath} is not a directory. Skipping...`)
      continue
    }

    // Checking if the file is a PDF
    // and without answer key
    const examName = (await fs.readdir(examPath)).filter(
      (file) => !file.includes("zo") && file.endsWith(".pdf")
    )[0]

    const gradingRules = (await fs.readdir(examPath)).filter(
      (file) => file.includes("zo") && file.endsWith(".pdf")
    )[0]

    const archiveName = (await fs.readdir(examPath)).filter(
      (file) => !file.includes("zo") && !file.endsWith(".pdf")
    )[0]

    const exam: Exam = isServerCall
      ? {
          name: examDirectory,
          path: {
            directory: examPath,
            exam: join(examPath, examName),
            gradingRules: join(examPath, gradingRules),
            archive: join(examPath, archiveName),
          },
        }
      : {
          name: examDirectory,
        }
    exams.push(exam)
  }

  return exams
}

export default defineEventHandler(async (event) => {
  const isServerCall = Boolean(getQuery(event).server)

  return await getAllExams(isServerCall)
})
