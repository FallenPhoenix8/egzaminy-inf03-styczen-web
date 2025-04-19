<script setup lang="ts">
import type { Exam } from "~/types/Exam"

const store = examsStore()

const exams = store.exams
</script>
<template>
  <Hero />
  <ExamsTable
    :exams="exams"
    :status="exams.length > 0 ? 'success' : 'pending'"
  />
</template>
