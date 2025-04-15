<script setup lang="ts">
const isSearchDialogOpen = ref(false)
</script>
<template>
  <NavBar @update:is-open-search-dialog="isSearchDialogOpen = $event" />
  <SearchDialog
    :open="isSearchDialogOpen"
    @update:close="isSearchDialogOpen = $event"
    @update:open="isSearchDialogOpen = $event"
  />
  <main class="min-h-screen px-2 py-1">
    <NuxtPage />
  </main>
  <footer></footer>
</template>
