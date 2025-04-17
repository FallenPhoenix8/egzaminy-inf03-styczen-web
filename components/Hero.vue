<template>
  <header class="hero min-h-screen grid place-items-center">
    <div class="p-2 space-y-2">
      <h1
        class="text-5xl md:text-7xl lg:text-9xl bg-gradient-to-bl from-background-foreground to-accent-foreground bg-clip-text text-transparent"
      >
        Egzaminy INF.03
      </h1>
      <p class="text-lg lg:text-2xl">
        Na tej stronie znajdziesz wszystkie arkusze egzaminacyjne ze stycznia
        2025 roku.
      </p>
    </div>
  </header>
</template>
<style scoped>
/* Animated expanding radial gradient */
.hero {
  background: radial-gradient(
    circle,
    var(--color-muted),
    var(--color-background)
  );
  background-size: 200% 200%;
  animation: gradient 10s ease-in-out infinite;
}

@keyframes gradient {
  0% {
    background-position: -10% -10%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: -10% -10%;
  }
}
</style>
