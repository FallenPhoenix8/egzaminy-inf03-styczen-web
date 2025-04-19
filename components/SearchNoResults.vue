<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { Primitive } from "reka-ui"
import { computed, type HTMLAttributes } from "vue"

const props = defineProps<
  PrimitiveProps & {
    class?: HTMLAttributes["class"]
  }
>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <Primitive
    data-slot="command-empty"
    v-bind="delegatedProps"
    :class="cn('py-6 text-center text-sm', props.class)"
  >
    <slot />
  </Primitive>
</template>
