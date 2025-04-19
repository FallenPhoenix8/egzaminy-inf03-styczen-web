<script setup lang="ts">
import { useMagicKeys } from "@vueuse/core"
import type { ExamDetails } from "~/types/Exam"
import Skeleton from "./ui/skeleton/Skeleton.vue"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(["update:close", "update:open"])

const store = examsStore()

const examsDetails = ref([] as ExamDetails[])

useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === "f" && e.type === "keydown") {
      e.preventDefault()
      emit("update:open", true)
    }
  },
})

function handleCommandSelect(examName: string) {
  emit("update:close", false)
  navigateTo(`/exams/${examName}`)
}

const query = ref("")

const filteredExams = reactive({
  byName: [] as ExamDetails[],
  byContent: [] as ExamDetails[],
})

watch(
  () => store.isLoadingExamsDetails,
  () => {
    if (store.isLoadingExamsDetails) {
      examsDetails.value = []
    } else {
      examsDetails.value = store.examsDetails
      filteredExams.byName = [...examsDetails.value]
      filteredExams.byContent = [...examsDetails.value]
    }
  }
)

/**
 * This variable stores preference for filtering by exam's name.
 */
const isFilterByName = ref(true)

/**
 * This variable stores preference for filtering by exam's content.
 */
const isFilterByContent = ref(true)

function filterExams() {
  if (!query.value) {
    filteredExams.byName = [...examsDetails.value]
    filteredExams.byContent = [...examsDetails.value]
    return
  }

  if (isFilterByName.value) {
    filteredExams.byName = examsDetails.value.filter((exam) =>
      exam.name.toLowerCase().includes(query.value.toLowerCase())
    )
  }

  if (isFilterByContent.value) {
    filteredExams.byContent = examsDetails.value.filter((exam) =>
      exam.text.toLowerCase().includes(query.value.toLowerCase())
    )
  }
}

watch(query, filterExams)
</script>
<template>
  <UICommandDialog
    :open="props.open"
    @update:open="emit('update:close', false)"
  >
    <UIDialogHeader class="p-3">
      <UIDialogTitle>Wyszukaj egzaminu</UIDialogTitle>
      <UIDialogDescription>
        <div class="flex gap-2 items-center my-1">
          <UISwitch v-model="isFilterByName" id="filter-by-name" />
          <UILabel for="filter-by-name">Filtruj według nazwy</UILabel>
        </div>
        <div class="flex gap-2 items-center my-1">
          <UISwitch v-model="isFilterByContent" id="filter-by-content" />
          <UILabel for="filter-by-content">Filtruj według zawartości</UILabel>
        </div>
      </UIDialogDescription>
    </UIDialogHeader>

    <SearchInput :filter-callback="filterExams" v-model="query" />

    <UICommandList v-if="examsDetails.length > 0">
      <UICommandGroup heading="Wyniki według nazwy" v-if="isFilterByName">
        <UICommandItem
          v-if="filteredExams.byName.length > 0"
          v-for="exam in filteredExams.byName"
          :key="'name-search-' + exam.name"
          value="exam.name"
          @select="handleCommandSelect(exam.name)"
          >{{ exam.name }}</UICommandItem
        >
        <SearchNoResults v-else>Brak wyników</SearchNoResults>
      </UICommandGroup>

      <UICommandSeparator />

      <UICommandGroup
        heading="Te egzaminy zawierają podane słowa"
        v-if="isFilterByContent"
      >
        <UICommandItem
          v-if="filteredExams.byContent.length > 0"
          v-for="exam in filteredExams.byContent"
          :key="'content-search-' + exam.name"
          value="exam.text"
          @select="handleCommandSelect(exam.name)"
          >{{ exam.name }}</UICommandItem
        >
        <SearchNoResults v-else>Brak wyników</SearchNoResults>
      </UICommandGroup>

      <UICommandSeparator />
    </UICommandList>
    <Skeleton v-else class="h-10 w-full" />
  </UICommandDialog>
</template>

<style scoped>
.hide {
  visibility: hidden;
}
</style>
