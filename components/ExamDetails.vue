<script setup lang="ts">
import type { ExamDetails } from "~/types/Exam"
import type { CarouselApi } from "@/components/ui/carousel"
const props = defineProps<{ exam: ExamDetails | null }>()
import { watchOnce } from "@vueuse/core"

const emblaMainApi = ref<CarouselApi>()
const emblaThumbnailApi = ref<CarouselApi>()
const selectedIndex = ref(0)

function onSelect() {
  if (!emblaMainApi.value || !emblaThumbnailApi.value) return
  selectedIndex.value = emblaMainApi.value.selectedScrollSnap()
  emblaThumbnailApi.value.scrollTo(emblaMainApi.value.selectedScrollSnap())
}

function onThumbClick(index: number) {
  if (!emblaMainApi.value || !emblaThumbnailApi.value) return
  emblaMainApi.value.scrollTo(index)
  console.log(index)
}

watchOnce(emblaMainApi, (emblaMainApi) => {
  if (!emblaMainApi) return

  onSelect()
  emblaMainApi.on("select", onSelect)
  emblaMainApi.on("reInit", onSelect)

  emblaMainApi.scrollTo(2)
  emblaThumbnailApi.value?.scrollTo(2)
})
</script>
<template>
  <div v-if="props.exam">
    <h2>Egzamin {{ props.exam.name }}</h2>
    <h3>Podgląd arkusza</h3>
    <UICarousel
      class="relative mx-auto max-w-lg"
      @init-api="(val) => (emblaMainApi = val)"
    >
      <UICarouselContent>
        <UICarouselItem
          v-for="(image, index) in props.exam.previewImages"
          :key="index"
        >
          <UICard>
            <UICardContent
              class="flex aspect-square items-center justify-center p-6"
            >
              <img
                :src="image"
                :alt="`Podgląd ${index + 1} strony arkusza egzaminacyjnego`"
                class="h-full w-full object-contain"
              />
            </UICardContent>
          </UICard>
        </UICarouselItem>
      </UICarouselContent>

      <UICarouselNext class="hidden lg:block" />
      <UICarouselPrevious class="hidden lg:block" />
    </UICarousel>

    <UICarousel
      class="relative mx-auto max-w-lg"
      @init-api="(val) => (emblaThumbnailApi = val)"
    >
      <UICarouselContent class="flex gap-1 ml-0">
        <UICarouselItem
          v-for="(image, index) in props.exam.previewImages"
          :key="index"
          class="pl-0 basis-1/4 cursor-pointer"
          @click="onThumbClick(index)"
        >
          <div class="p-1" :class="index === selectedIndex ? '' : 'opacity-50'">
            <UICard>
              <UICardContent
                class="flex aspect-square items-center justify-center"
              >
                <img
                  :src="image"
                  :alt="`Podgląd ${index + 1} strony arkusza egzaminacyjnego`"
                  class="h-full w-full object-contain"
                />
              </UICardContent>
            </UICard>
          </div>
        </UICarouselItem>
      </UICarouselContent>
    </UICarousel>

    <div
      class="flex lg:max-w-xl items-center justify-center lg:justify-evenly my-10 flex-wrap gap-2"
    >
      <NuxtLink :to="props.exam.url.exam" target="_blank" download>
        <UIButton tabindex="-1">Pobierz arkusz</UIButton>
      </NuxtLink>

      <NuxtLink :to="props.exam.url.archive" target="_blank" download>
        <UIButton tabindex="-1">Pobierz materiały</UIButton>
      </NuxtLink>

      <NuxtLink :to="props.exam.url.gradingRules" target="_blank" download>
        <UIButton tabindex="-1">Pobierz zasady oceniania</UIButton>
      </NuxtLink>
    </div>
  </div>
</template>
