import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change this to your repo name for GitHub Pages
  base: '/team-hub/',
})
