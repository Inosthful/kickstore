<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { disposeSneaker, loadSneaker } from '@/three/loader'
import { TARGET, createCamera, createRenderer, createStage } from '@/three/stage'

const props = withDefaults(defineProps<{ src: string; autoRotate?: boolean; interactive?: boolean; zoom?: boolean }>(), {
  autoRotate: true,
  interactive: true,
  // sans zoom, la molette fait défiler la page au lieu d'être capturée par la scène
  zoom: true,
})
const emit = defineEmits<{ loaded: []; error: [] }>()

const canvas = ref<HTMLCanvasElement>()
const host = ref<HTMLDivElement>()
const unsupported = ref(false)
const loading = ref(true)
const failed = ref(false)

let renderer: THREE.WebGLRenderer | undefined
let controls: OrbitControls | undefined
let sneaker: THREE.Group | undefined
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let frame = 0
let current = 0

async function show(src: string) {
  const request = ++current
  loading.value = true
  failed.value = false
  try {
    const group = await loadSneaker(src)
    if (request !== current) return
    if (sneaker) {
      scene.remove(sneaker)
      disposeSneaker(sneaker)
    }
    sneaker = group
    scene.add(group)
    emit('loaded')
  } catch {
    if (request === current) {
      failed.value = true
      emit('error')
    }
  } finally {
    if (request === current) loading.value = false
  }
}

onMounted(() => {
  if (!canvas.value || !host.value) return
  try {
    renderer = createRenderer(canvas.value)
  } catch {
    unsupported.value = true
    return
  }
  scene = createStage(renderer)
  camera = createCamera(1)
  controls = new OrbitControls(camera, canvas.value)
  controls.target.copy(TARGET)
  controls.enableDamping = true
  controls.enablePan = false
  controls.enabled = props.interactive
  controls.enableZoom = props.zoom
  controls.minDistance = 28
  controls.maxDistance = 90
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.autoRotate = props.autoRotate && !matchMedia('(prefers-reduced-motion: reduce)').matches
  controls.autoRotateSpeed = 1.2
  show(props.src)

  // la paire est cadrée pour un ratio 4/3 : plus le cadre est étroit, plus on recule
  const baseDistance = camera.position.distanceTo(TARGET)
  const resize = () => {
    const { width, height } = host.value!.getBoundingClientRect()
    renderer!.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    const fit = Math.max(1, 1.3 / camera.aspect)
    camera.position.sub(TARGET).setLength(baseDistance * fit).add(TARGET)
    controls!.maxDistance = Math.max(90, baseDistance * fit)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host.value)
  resize()

  const loop = () => {
    frame = requestAnimationFrame(loop)
    controls!.update()
    renderer!.render(scene, camera)
  }
  loop()

  onUnmounted(() => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    controls?.dispose()
    if (sneaker) disposeSneaker(sneaker)
    renderer?.dispose()
  })
})

watch(() => props.src, (src) => renderer && show(src))
watch(() => props.autoRotate, (on) => controls && (controls.autoRotate = on))

defineExpose({
  view(preset: 'side' | 'front' | 'top' | 'heel' | 'quarter') {
    if (!camera || !controls) return
    const positions = {
      quarter: [30, 16, 40],
      side: [0, 8, 50],
      front: [48, 12, 10],
      heel: [-48, 14, 8],
      top: [4, 50, 6],
    } as const
    const [x, y, z] = positions[preset]
    camera.position.set(x, y, z)
    controls.update()
  },
})
</script>

<template>
  <div ref="host" class="viewer" :class="{ loading }">
    <canvas v-if="!unsupported" ref="canvas" />
    <p v-if="unsupported" class="state">Ton navigateur ne supporte pas l'affichage 3D.</p>
    <p v-else-if="failed" class="state">Impossible de charger le modèle 3D.</p>
    <span v-else-if="loading" class="spinner dark" aria-label="Chargement du modèle" />
  </div>
</template>

<style scoped>
.viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
  transition: opacity 0.4s;
}

.loading canvas {
  opacity: 0;
}

canvas:active {
  cursor: grabbing;
}

.state,
.spinner {
  position: absolute;
  inset: 0;
  margin: auto;
}

.state {
  display: grid;
  place-items: center;
  color: var(--muted);
}

.spinner.dark {
  width: 28px;
  height: 28px;
  border-color: rgb(0 0 0 / 15%);
  border-top-color: var(--ink);
}
</style>
