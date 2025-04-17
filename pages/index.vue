<script setup lang="ts">
import type { Exam } from "~/types/Exam"
const { data: exams, status: examsStatus } = await useAsyncData("exams", () =>
  $fetch("/api/exams/all")
)
</script>
<template>
  <Hero />
  <ExamsTable :exams="exams as Exam[]" :status="examsStatus" />
</template>
