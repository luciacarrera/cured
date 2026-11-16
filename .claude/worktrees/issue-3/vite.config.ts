import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Reference files dropped in the project root (images, Rhino files, temp
      // files mid-save) shouldn't be watched — a locked temp file crashes Vite on Windows.
      ignored: ['**/*.~tmp', '**/*.3dm', '**/*.3dmbak', '**/*_embedded_files/**', '*.{jpg,jpeg,png,webp}'],
    },
  },
})
