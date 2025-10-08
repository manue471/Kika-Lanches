import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Configuração de build
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar em produção
    minify: 'esbuild', // Usar esbuild (mais rápido que terser)
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'ui': ['vue-toastification'],
          'http': ['axios'],
        },
      },
    },
  },

  // Proxy para desenvolvimento local
  server: {
    proxy: {
      '/api': {
        target: 'http://kikapp.cloud',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
