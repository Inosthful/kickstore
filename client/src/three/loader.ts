import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// longueur cible d'une paire dans la scène, pour que la caméra cadre pareil quel que soit le modèle
export const SHOE_LENGTH = 29

const draco = new DRACOLoader().setDecoderPath('/draco/')
const loader = new GLTFLoader().setDRACOLoader(draco)
const cache = new Map<string, Promise<THREE.Group>>()

// charge un GLB et le normalise : centré, posé au sol, axe long sur X, longueur SHOE_LENGTH
export function loadSneaker(url: string): Promise<THREE.Group> {
  let pending = cache.get(url)
  if (!pending) {
    pending = loader.loadAsync(url).then((gltf) => normalize(gltf.scene))
    cache.set(url, pending)
  }
  // chaque viewer reçoit sa copie, les géométries et textures restent partagées
  return pending.then((scene) => scene.clone(true))
}

function normalize(scene: THREE.Group): THREE.Group {
  scene.updateMatrixWorld(true)
  const points = samplePoints(scene, 20000)

  // les modèles Sketchfab arrivent orientés n'importe comment, parfois avec les deux
  // chaussures de la paire : on cherche l'angle qui donne le rectangle au sol le plus
  // petit (c'est l'axe des chaussures, même pour une paire) et on met la longueur sur X
  const angle = tightestAngle(points)
  const rotated = points.map((p) => rotateY(p, angle))
  const pct = (arr: number[], q: number) => arr[Math.min(arr.length - 1, Math.floor(q * arr.length))]
  const rx = rotated.map((p) => p.x).sort((a, b) => a - b)
  const ry = rotated.map((p) => p.y).sort((a, b) => a - b)
  const yLow = pct(ry, 0.005)
  const yHigh = pct(ry, 0.995)
  // le col est la partie la plus haute d'une sneaker et il est à l'arrière : si les
  // points les plus hauts sont du côté +X, le talon est devant, on retourne la paire.
  // Percentiles plutôt que min/max, certains modèles ont des sommets isolés.
  const top = rotated.filter((p) => p.y > yHigh - (yHigh - yLow) * 0.15 && p.y <= yHigh)
  const topX = top.reduce((sum, p) => sum + p.x, 0) / (top.length || 1)
  scene.rotation.y = topX > (pct(rx, 0.005) + pct(rx, 0.995)) / 2 ? angle + Math.PI : angle
  scene.updateMatrixWorld(true)

  // longueur et sol calculés sur des percentiles plutôt que sur la boîte englobante :
  // certains modèles ont quelques sommets isolés loin de la chaussure
  const final = points.map((p) => rotateY(p, scene.rotation.y))
  const xs = final.map((p) => p.x).sort((a, b) => a - b)
  const ys = final.map((p) => p.y).sort((a, b) => a - b)
  const zs = final.map((p) => p.z).sort((a, b) => a - b)
  const length = pct(xs, 0.995) - pct(xs, 0.005)
  const scale = SHOE_LENGTH / length
  scene.scale.setScalar(scale)
  scene.position.set(
    -((pct(xs, 0.995) + pct(xs, 0.005)) / 2) * scale,
    -pct(ys, 0.005) * scale,
    -((pct(zs, 0.995) + pct(zs, 0.005)) / 2) * scale,
  )
  scene.updateMatrixWorld(true)

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })

  const wrapper = new THREE.Group()
  wrapper.add(scene)
  return wrapper
}

// échantillon de sommets en coordonnées monde
function samplePoints(root: THREE.Object3D, max: number): THREE.Vector3[] {
  const meshes: THREE.Mesh[] = []
  root.traverse((obj) => obj instanceof THREE.Mesh && meshes.push(obj))
  const total = meshes.reduce((n, m) => n + m.geometry.attributes.position.count, 0)
  const step = Math.max(1, Math.floor(total / max))
  const points: THREE.Vector3[] = []
  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position
    for (let i = 0; i < pos.count; i += step) {
      points.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld))
    }
  }
  return points
}

// rotation autour de Y, même convention que Object3D.rotation.y
function rotateY(p: THREE.Vector3, angle: number): THREE.Vector3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return new THREE.Vector3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c)
}

// angle (autour de Y) pour lequel l'empreinte au sol tient dans le plus petit rectangle,
// la grande dimension étant sur X
function tightestAngle(points: THREE.Vector3[]): number {
  let best = 0
  let bestArea = Infinity
  for (let deg = 0; deg < 180; deg += 1) {
    const angle = (deg * Math.PI) / 180
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const p of points) {
      const x = p.x * c + p.z * s
      const z = -p.x * s + p.z * c
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    const area = (maxX - minX) * (maxZ - minZ)
    if (area < bestArea) {
      bestArea = area
      best = maxX - minX >= maxZ - minZ ? angle : angle + Math.PI / 2
    }
  }
  return best
}

export function disposeSneaker(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of materials) m.dispose()
    }
  })
}
