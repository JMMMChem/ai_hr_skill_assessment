import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import history from 'connect-history-api-fallback'

// https://vitejs.dev/config/

export default ({mode}) => {
  const config = {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use(
          history({
            disableDotRule: true,
            htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
          })
        )
      },
    build: {
      sourcemap: true
      
    },
    plugins: [
        react(),
    ],
  }

  if (mode === "production") {
    config["base"] = "/static"
  }

  return defineConfig(config)
}