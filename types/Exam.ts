interface Exam {
  name: string
  path?: {
    directory: string
    exam: string
    gradingRules: string
    archive: string
  }
}

interface ExamDetails extends Exam {
  url: {
    exam: string
    gradingRules: string
    archive: string
  }
  previewImages: string[]
  text: string
}

export type { Exam, ExamDetails }
