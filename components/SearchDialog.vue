<script setup lang="ts">
import { useMagicKeys } from "@vueuse/core"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(["update:close", "update:open"])

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === "f" && e.type === "keydown") {
      e.preventDefault()
      emit("update:open", true)
    }
  },
})
</script>
<template>
  <UICommandDialog
    :open="props.open"
    @update:open="emit('update:close', false)"
  >
    <UIDialogHeader class="p-3">
      <UIDialogTitle>Wyszukaj egzaminu</UIDialogTitle>
      <UIDialogDescription
        >Wyszukaj egzaminu po nazwie lub słowach kluczowych w
        egzaminie</UIDialogDescription
      >
    </UIDialogHeader>
    <UICommandInput placeholder="Wyszukaj egzaminu..." />

    <UICommandList>
      <UICommandEmpty>Brak wyników</UICommandEmpty>
      <!-- TODO: Add search results -->
    </UICommandList>
  </UICommandDialog>
</template>
