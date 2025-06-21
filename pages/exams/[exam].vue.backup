<script setup lang="ts">
import type { ExamDetails } from "~/types/Exam"
const exam = ref<ExamDetails | null>(null)
if (!examsStore().isLoadingExamsDetails) {
  exam.value =
    examsStore().examsDetails.find(
      (exam) => exam.name === useRoute().params.exam
    ) || null
} else {
  watch(
    () => examsStore().isLoadingExamsDetails,
    () => {
      if (!examsStore().isLoadingExamsDetails) {
        exam.value =
          examsStore().examsDetails.find(
            (exam) => exam.name === useRoute().params.exam
          ) || null
      }
    }
  )
}

useHead({
  title: `Egzamin INF.03 - ${exam.value?.name}`,
})
</script>

<template>
  <ExamDetails :exam="exam" />
</template>
