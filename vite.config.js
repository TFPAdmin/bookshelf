import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src', // Set 'src' folder as the root
  plugins: [react()],
  build: {
    outDir: '../dist', // Output directory relative to 'src'
    emptyOutDir: true, // Clears output before build
  },
})
