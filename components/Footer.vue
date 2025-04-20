<script setup lang="ts">
import { MailOpen, Github } from "lucide-vue-next"
</script>

<template>
  <hr />
  <footer class="text-muted-foreground p-2 mt-10">
    <h3 class="text-start">
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
    <h3 class="text-start">
      &copy;
      <a href="https://cke.gov.pl/egzamin-zawodowy/">CKE</a>
      - arkusze egzaminacyjne
    </h3>
  </footer>
</template>
