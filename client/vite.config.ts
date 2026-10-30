import vue from '@vitejs/plugin-vue'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// en dev seulement : la page /lab envoie les vignettes rendues en WebGL,
// on les écrit dans public/models pour les servir en statique
function thumbnailWriter(): Plugin {
  const dir = fileURLToPath(new URL('./public/models', import.meta.url))
  return {
    name: 'kickstore-thumbnails',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__thumbs/', (req, res) => {
        const slug = (req.url ?? '').replace(/^\//, '')
        if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(slug)) {
          res.statusCode = 400
          return res.end()
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          mkdirSync(dir, { recursive: true })
          const png = Buffer.from(body.replace(/^data:image\/png;base64,/, ''), 'base64')
          // sharp vient de gltf-transform, installé à la racine du mono-repo : on l'importe
          // sans le typer pour que le build du client seul (image Docker) ne le cherche pas,
          // et on garde le png si jamais il manque
          const sharpModule = 'sharp'
          const sharp = await import(sharpModule).then((m) => m.default).catch(() => null)
          if (sharp) await sharp(png).resize(800).webp({ quality: 84 }).toFile(`${dir}/${slug}.webp`)
          else writeFileSync(`${dir}/${slug}.png`, png)
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), thumbnailWriter()],
  server: {
    // le ":" dans le nom du dossier parent fait échouer la vérification fs.allow
    fs: { strict: false },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
