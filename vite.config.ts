import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleApi } from './server/api.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'local-ai-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void handleApi(request, response).then(handled => { if (!handled) next() }).catch(next)
      })
    },
  }],
})
