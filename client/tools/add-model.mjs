// Ajoute un modèle Sketchfab au catalogue 3D :
//   node client/tools/add-model.mjs <fichier.glb ou dossier dézippé> <slug>
// Le GLB est optimisé (Draco, textures WebP 2048px) dans client/public/models/<slug>.glb
// et ses métadonnées (auteur, licence, source, embarquées par Sketchfab) sont
// ajoutées à client/public/models/credits.json pour la page de crédits.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const modelsDir = resolve(here, '../public/models')
const creditsPath = join(modelsDir, 'credits.json')

const [input, slug] = process.argv.slice(2)
if (!input || !slug) {
  console.error('usage: node client/tools/add-model.mjs <fichier.glb|dossier> <slug>')
  process.exit(1)
}

// Sketchfab livre soit un .glb, soit un zip avec scene.gltf + textures
function findSource(path) {
  if (statSync(path).isFile()) return path
  const files = readdirSync(path)
  const direct = files.find((f) => /\.(glb|gltf)$/i.test(f))
  if (direct) return join(path, direct)
  for (const f of files) {
    const sub = join(path, f)
    if (statSync(sub).isDirectory()) {
      const found = findSource(sub)
      if (found) return found
    }
  }
  return null
}

const source = findSource(resolve(input))
if (!source) {
  console.error(`aucun .glb ou .gltf dans ${input}`)
  process.exit(1)
}

const output = join(modelsDir, `${slug}.glb`)
const cli = join(root, 'node_modules/.bin/gltf-transform')

// Sketchfab exporte les matériaux en specular/glossiness, que three.js ne lit plus :
// on convertit d'abord en metal/roughness, puis on optimise
const converted = join(tmpdir(), `${slug}-metalrough.glb`)
execFileSync(cli, ['metalrough', source, converted], { stdio: 'inherit' })
execFileSync(cli, ['optimize', converted, output, '--compress', 'draco', '--texture-compress', 'webp', '--texture-size', '2048'], {
  stdio: 'inherit',
})
rmSync(converted, { force: true })

// lecture des métadonnées dans le chunk JSON du glb produit
const buffer = readFileSync(output)
const jsonLength = buffer.readUInt32LE(12)
const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'))
const extras = json.asset?.extras ?? {}

const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {}
credits[slug] = {
  title: extras.title ?? slug,
  author: extras.author ?? '',
  license: extras.license ?? '',
  source: extras.source ?? '',
}
writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n')

const mb = (statSync(output).size / 1e6).toFixed(2)
console.log(`\n${slug}.glb : ${mb} Mo, ${json.meshes?.length ?? 0} meshes, ${json.images?.length ?? 0} textures`)
console.log(`crédit : ${credits[slug].author} — ${credits[slug].license}`)
