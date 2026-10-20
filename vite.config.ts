import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import darkTheme from './tools/dark-theme/postcss-dark-theme.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  css: {
    // Adds a dark twin of every coloured CSS rule (applies under :root[data-theme="dark"]). See tools/dark-theme/.
    postcss: { plugins: [darkTheme()] },
  },
})
