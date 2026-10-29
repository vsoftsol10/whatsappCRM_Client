// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   server: {
//     proxy: {
//       '/api': {
//         // target: 'http://localhost:5000',
//         target: 'https://whatsappcrm-f1qj.onrender.com',
//         changeOrigin: true,
//         secure: false,
//       }
//     }
//   }
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// ------------------------------------------------------------
// OLD BUILD FILE NAMES that browsers / CDN servers may still ask for.
// Each one is written into dist/assets/ as a small "self-healing" file
// that loads the CURRENT app instead of the old one.
// Add the name of any older build you find here (names look like
// index-XXXXXXXX.js). Never list the CURRENT build.
// ------------------------------------------------------------
const LEGACY_BUNDLES = [
  'index-mATg_HL2.js',
  'index-CYLOcYN3.js',
]

function legacyBundleHealer() {
  const stub = readFileSync(
    new URL('./scripts/legacy-stub.js', import.meta.url),
    'utf8'
  )
  return {
    name: 'legacy-bundle-healer',
    generateBundle() {
      for (const name of LEGACY_BUNDLES) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/${name}`,
          source: stub,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacyBundleHealer(),
  ],
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:5000',
        target: 'https://whatsappcrm-client.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
