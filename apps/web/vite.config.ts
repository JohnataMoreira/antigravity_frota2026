import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
<<<<<<< Updated upstream
            includeAssets: ['logo.png', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: 'Frota2026 - Logística Inteligente',
                short_name: 'Frota2026',
                description: 'Sistema de Gestão de Frota e Telemetria em Tempo Real',
                theme_color: '#2563EB',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                    {
                        src: 'logo.png',
=======
            injectRegister: 'auto',
            manifest: {
                name: 'Frota2026',
                short_name: 'Frota2026',
                description: 'Gestão de Frotas Avançada',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
>>>>>>> Stashed changes
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
<<<<<<< Updated upstream
                        src: 'logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
=======
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
>>>>>>> Stashed changes
                    }
                ]
            },
            workbox: {
<<<<<<< Updated upstream
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <year>
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/.*$/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            networkTimeoutSeconds: 10
                        }
                    }
                ]
=======
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
>>>>>>> Stashed changes
            }
        })
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
<<<<<<< Updated upstream
        sourcemap: false
=======
        sourcemap: false,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`,
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['lucide-react', 'recharts'],
                    'vendor-utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge']
                }
            }
        }
>>>>>>> Stashed changes
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
