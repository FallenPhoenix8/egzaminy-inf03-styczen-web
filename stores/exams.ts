import { defineStore } from "pinia"
import type { Exam, ExamDetails } from "~/types/Exam"

export const examsStore = defineStore("exams", {
  state: () => ({
    exams: [] as Exam[],
    examsDetails: [] as ExamDetails[],
    isLoadingDetails: false,
  }),

  actions: {
    setExams(exams: Exam[]) {
      this.exams = exams
    },

    addExamDetails(examDetails: ExamDetails) {
      this.examsDetails.push(examDetails)
    },
  },
})
