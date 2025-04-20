<script setup lang="ts">
import type { ExamDetails, Exam } from "./types/Exam"
import { MailOpen, Github } from "lucide-vue-next"

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
          `/api/exams/${exam.name}/details`
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
  <footer class="text-muted-foreground p-2">
    <h3>
      &copy; {{ new Date().getFullYear() }} Łukasz Kwiecień - wygląd i działanie
      strony
    </h3>

    <h4 class="text-lg text-semibold">Skontaktuj się ze mną:</h4>

    <ul class="space-y-2">
      <li>
        <a href="mailto:lukw8@proton.me">
          <UIButton><MailOpen /> Email</UIButton>
        </a>
      </li>
      <li>
        <a href="https://github.com/FallenPhoenix8" target="_blank">
          <UIButton
            class="bg-[#151b23] hover:bg-[#151b23]/50 focus:bg-[#151b23]/50 text-white"
            ><Github /> GitHub</UIButton
          >
        </a>
      </li>
    </ul>
    <hr />
    <div>
      &copy;
      <a href="https://cke.gov.pl/egzamin-zawodowy/">CKE</a>
      - arkusze egzaminacyjne
    </div>
  </footer>
</template>
