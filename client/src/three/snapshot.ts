import * as THREE from 'three'
import { disposeSneaker, loadSneaker } from './loader'
import { TARGET, createCamera, createRenderer, createStage } from './stage'

// rend une paire en image fixe (vue de trois quarts) : sert à fabriquer les
// vignettes du catalogue en dev, avec un seul contexte WebGL partagé
let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera

export async function renderSnapshot(url: string, width = 960, height = 720): Promise<string> {
  if (!renderer) {
    renderer = createRenderer(document.createElement('canvas'), { preserveDrawingBuffer: true })
    scene = createStage(renderer)
    camera = createCamera(width / height)
    camera.position.set(30, 16, 40)
    camera.lookAt(TARGET)
  }
  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()

  const sneaker = await loadSneaker(url)
  scene.add(sneaker)
  renderer.render(scene, camera)
  const dataUrl = renderer.domElement.toDataURL('image/png')
  scene.remove(sneaker)
  disposeSneaker(sneaker)
  return dataUrl
}
