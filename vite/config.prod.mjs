import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);
            
            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}   

export default defineConfig({
    base: './',
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    },
    server: {
        port: 8080
    },
    plugins: [
        phasermsg(),
        // PWA: web app manifest + Workbox service worker that precaches the
        // whole build (JS, CSS, HTML, and every Phaser image/audio file in
        // public/assets) so the game is installable and playable offline
        // once it has been opened online one time.
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            // The glob below already precaches the icons; don't list them twice.
            includeManifestIcons: false,
            manifest: {
                id: '/',
                name: 'BIS Letter Adventure',
                short_name: 'Letter Adventure',
                description: 'A playful educational game for learning the letter B through mini-games.',
                lang: 'en',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'landscape',
                background_color: '#0b2545',
                theme_color: '#0b2545',
                categories: ['education', 'games', 'kids'],
                icons: [
                    { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                    { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,webp,jpg,jpeg,svg,ico,mp3,ogg,wav,m4a,json,woff,woff2,ttf}'],
                // The Phaser vendor chunk is larger than Workbox's 2 MiB default.
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigateFallback: 'index.html',
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true
            }
        })
    ]
});
