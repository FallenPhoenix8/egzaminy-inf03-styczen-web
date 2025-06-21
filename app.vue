<script setup lang="ts">
import type { ExamDetails, Exam } from "./types/Exam"

const isSearchDialogOpen = ref(false)

const store = examsStore()

const { data: exams, status: examsStatus } = await useAsyncData("exams", () =>
  $fetch("/api/exams/all")
)

if (examsStatus.value === "success") {
  store.setExams(exams.value as Exam[])
}

watch(
  () => store.exams,
  async (newExams) => {
    store.isLoadingExamsDetails = true
    if (newExams.length > 0) {
      console.log("Updating exam details...")
      for (const exam of store.exams) {
        const details = (await $fetch(
          `/api/exams/${encodeURIComponent(exam.name)}/details`
        )) as unknown as ExamDetails

        store.addExamDetails(details)
      }
      console.log("Successfully finished updating exam details")
    }
    store.isLoadingExamsDetails = false
  },
  { immediate: true }
)
</script>
<template>
  <NavBar @update:is-open-search-dialog="isSearchDialogOpen = $event" />
  <SearchDialog
    :open="isSearchDialogOpen"
    @update:close="isSearchDialogOpen = $event"
    @update:open="isSearchDialogOpen = $event"
  />
  <main class="min-h-screen py-1">
    <NuxtPage />
  </main>
  <Footer />
</template>
