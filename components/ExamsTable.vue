<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { Exam } from "~/types/Exam"
import { Skeleton } from "./ui/skeleton"

const props = defineProps<{ exams: Exam[]; status: AsyncDataRequestStatus }>()
</script>

<template>
  <UITable class="text-lg my-2">
    <UITableHeader>
      <UITableRow>
        <UITableHead>#</UITableHead>
        <UITableHead>Nazwa</UITableHead>
        <UITableHead>Szczegóły</UITableHead>
      </UITableRow>
    </UITableHeader>
    <UITableBody>
      <UITableRow
        v-for="(exam, index) in exams"
        :key="exam.name"
        v-if="status === 'success'"
      >
        <UITableCell>{{ index + 1 }}</UITableCell>
        <UITableCell>{{ exam.name }}</UITableCell>
        <UITableCell>TODO</UITableCell>
      </UITableRow>
      <UITableRow v-else>
        <UITableCell>
          <Skeleton class="h-6 w-full" />
        </UITableCell>
        <UITableCell>
          <Skeleton class="h-6 w-full" />
        </UITableCell>
        <UITableCell>
          <Skeleton class="h-6 w-full" />
        </UITableCell>
      </UITableRow>
    </UITableBody>
  </UITable>
</template>
