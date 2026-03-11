import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://3.221.54.164/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
