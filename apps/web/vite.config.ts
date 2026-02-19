import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    optimizeDeps: {
        include: ['react-is']
    },
    build: {
        outDir: 'dist',
        sourcemap: false
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true
            }
        }
    }
})
