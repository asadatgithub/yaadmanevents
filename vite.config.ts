import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createCheckoutDevMiddleware } from './createCheckoutDevMiddleware'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v
  }
  return {
    plugins: [
      {
        name: 'create-checkout-api',
        configureServer(server) {
          server.middlewares.use(createCheckoutDevMiddleware())
        },
        configurePreviewServer(server) {
          server.middlewares.use(createCheckoutDevMiddleware())
        },
      },
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
    ],
  }
})
