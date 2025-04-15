<script setup lang="ts">
import { useTitle, useWindowScroll } from "@vueuse/core"
import { Icon } from "@iconify/vue"

function setDocumentTheme(theme: string) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

const modifierKey = ref<string | null>(null)

onMounted(() => {
  setDocumentTheme(useColorMode().value)
  modifierKey.value = navigator.userAgent.toLowerCase().includes("mac")
    ? "⌘"
    : "CTRL"
})

watch(
  () => useColorMode().preference,
  () => {
    const colorMode = useColorMode().value
    setDocumentTheme(colorMode)
  }
)

const navBarStyleProperties = reactive({
  top: "0",
  margin: "0",
  borderRadius: "0",
})

/**
 * Changing navbar style on scroll
 */
watch(useWindowScroll().y, () => {
  /**
   * This variable stores max possible indent in `rem`
   */
  const maxIndent = 0.5
  /**
   * This variable stores max possible border radius in `rem`
   */
  const maxBorderRadius = 0.25

  const { y } = useWindowScroll()

  const indent = Math.min(maxIndent, y.value / 100)
  const borderRadius = Math.min(maxBorderRadius, y.value / 100)

  navBarStyleProperties.top = `${indent}rem`
  navBarStyleProperties.margin = `${indent}rem`
  navBarStyleProperties.borderRadius = `${borderRadius}rem`
})

const emit = defineEmits(["update:isOpenSearchDialog"])
</script>

<template>
  <nav
    class="navbar flex sticky bg-background/90 backdrop-blur-sm items-center justify-between space-y-2 sm:space-y-0 flex-wrap border-1 border-secondary-subtle p-2"
    :style="navBarStyleProperties"
  >
    <UINavigationMenu>
      <UINavigationMenuList>
        <UINavigationMenuItem class="min-w-max">
          <UINavigationMenuLink href="/" class="text-base">
            Egzaminy INF.03
          </UINavigationMenuLink>
        </UINavigationMenuItem>
      </UINavigationMenuList>
    </UINavigationMenu>

    <div class="search-button flex-1 max-w-md">
      <UIButton
        variant="secondary"
        class="group bg-muted/80 text-muted-foreground hover:text-accent-foreground focus:text-accent-foreground w-full justify-between"
        @click="emit('update:isOpenSearchDialog', true)"
      >
        <span>Wyszukaj egzaminu</span>
        <div
          class="bg-muted group-hover:bg-muted/80 group-focus:bg-muted/80 group-hover:text-accent-foreground/90 group-focus:text-accent-foreground/90 rounded-md shadow-md p-1"
        >
          {{ modifierKey }} + F
        </div>
      </UIButton>
    </div>

    <UINavigationMenu>
      <UINavigationMenuList>
        <UINavigationMenuItem>
          <ColorModeDropdown />
        </UINavigationMenuItem>
      </UINavigationMenuList>
    </UINavigationMenu>
  </nav>
</template>

<style scoped>
@media (max-width: 480px) {
  .search-button {
    order: 1;
  }
}
</style>
