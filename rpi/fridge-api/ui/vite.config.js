import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Proxy API calls to the Pi server when running dev locally
  server: {
    proxy: {
      '/sessions': 'http://raspberrypi.local:8080',
    },
  },
})
