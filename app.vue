<script setup lang="ts">
import type { ExamDetails } from "./types/Exam"

const isSearchDialogOpen = ref(false)

const store = examsStore()
watch(
  () => store.exams,
  async (newExams) => {
    if (newExams.length > 0) {
      console.log("Updating exam details...")
      for (const exam of store.exams) {
        const details = (await $fetch(
          `/api/exams/${exam.name}/details`
        )) as unknown as ExamDetails

        store.addExamDetails(details)
      }
    }

    console.log(store.examsDetails)
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
  <footer></footer>
</template>
