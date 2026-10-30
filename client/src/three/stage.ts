import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// la scène commune au viewer et aux vignettes : un éclairage de studio neutre,
// une ombre portée au sol et un fond transparent (c'est le CSS qui met la couleur)
export function createStage(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.7
  pmrem.dispose()

  const key = new THREE.DirectionalLight('#fff7ec', 2.9)
  key.position.set(6, 18, 14)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = key.shadow.camera.bottom = -22
  key.shadow.camera.right = key.shadow.camera.top = 22
  key.shadow.camera.near = 1
  key.shadow.camera.far = 60
  key.shadow.radius = 4
  key.shadow.bias = -0.0005
  scene.add(key)

  const rim = new THREE.DirectionalLight('#dbe6ff', 1.1)
  rim.position.set(-14, 8, -10)
  scene.add(rim)

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.22 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  return scene
}

export function createRenderer(canvas: HTMLCanvasElement, options: THREE.WebGLRendererParameters = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', ...options })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  return renderer
}

export const TARGET = new THREE.Vector3(0, 5.5, 0)

export function createCamera(aspect: number) {
  const camera = new THREE.PerspectiveCamera(30, aspect, 1, 200)
  camera.position.set(30, 16, 40)
  camera.lookAt(TARGET)
  return camera
}

