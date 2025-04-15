<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icon } from "@iconify/vue"

const colorMode = useColorMode()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline">
        <Icon
          icon="radix-icons:moon"
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Icon
          icon="radix-icons:sun"
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Zmień motyw</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="colorMode.preference = 'light'">
        <Icon
          v-if="colorMode.preference === 'light'"
          icon="radix-icons:dot-filled"
          class="mr-1 h-4 w-4"
        />
        Jasny
      </DropdownMenuItem>
      <DropdownMenuItem @click="colorMode.preference = 'dark'">
        <Icon
          v-if="colorMode.preference === 'dark'"
          icon="radix-icons:dot-filled"
          class="mr-1 h-4 w-4"
        />
        Ciemny
      </DropdownMenuItem>
      <DropdownMenuItem @click="colorMode.preference = 'system'">
        <Icon
          v-if="colorMode.preference === 'system'"
          icon="radix-icons:dot-filled"
          class="mr-1 h-4 w-4"
        />
        Systemowy
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
