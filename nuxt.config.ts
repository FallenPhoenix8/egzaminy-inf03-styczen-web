import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],

  runtimeConfig: {
    projectRoot: __dirname,
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "pl",
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["shadcn-nuxt", "@nuxtjs/color-mode", "@pinia/nuxt"],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "UI",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
})