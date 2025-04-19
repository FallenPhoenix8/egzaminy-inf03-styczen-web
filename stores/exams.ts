import { defineStore } from "pinia"
import type { Exam, ExamDetails } from "~/types/Exam"

export const examsStore = defineStore("exams", {
  state: () => ({
    exams: [] as Exam[],
    examsDetails: [] as ExamDetails[],
    isLoadingExamsDetails: true,
  }),

  actions: {
    setExams(exams: Exam[]) {
      this.exams = exams
    },

    addExamDetails(examDetails: ExamDetails) {
      if (this.examsDetails.some((exam) => exam.name === examDetails.name)) {
        return
      }
      this.examsDetails.push(examDetails)
    },
  },
})
