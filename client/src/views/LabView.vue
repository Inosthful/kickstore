<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SneakerViewer from '@/components/SneakerViewer.vue'
import { renderSnapshot } from '@/three/snapshot'

// page de mise au point des modèles (dev) : /lab?model=<slug> pour un modèle,
// bouton « vignettes » pour rendre toutes les paires et écrire les PNG dans public/models
const route = useRoute()
const src = computed(() => `/models/${route.query.model ?? 'jordan-4-university-blue'}.glb`)
const viewer = ref<InstanceType<typeof SneakerViewer>>()
const rotate = ref(false)
const views = ['quarter', 'side', 'front', 'heel', 'top'] as const

const sheet = ref<{ slug: string; image: string }[]>([])
const busy = ref(false)

async function makeThumbnails() {
  busy.value = true
  sheet.value = []
  const credits = await fetch('/models/credits.json').then((r) => r.json())
  const only = route.query.only ? String(route.query.only).split(',') : null
  for (const slug of Object.keys(credits)) {
    if (only && !only.includes(slug)) continue
    const image = await renderSnapshot(`/models/${slug}.glb`)
    sheet.value.push({ slug, image })
    await fetch(`/__thumbs/${slug}`, { method: 'POST', body: image })
  }
  busy.value = false
}

// /lab?thumbs=1 lance le rendu des vignettes dès l'ouverture
onMounted(() => route.query.thumbs && makeThumbnails())
</script>

<template>
  <div class="lab">
    <div class="stage">
      <SneakerViewer ref="viewer" :src="src" :auto-rotate="rotate" />
    </div>
    <div class="tools">
      <button v-for="v in views" :key="v" class="btn secondary" type="button" @click="viewer?.view(v)">{{ v }}</button>
      <button class="btn secondary" type="button" @click="rotate = !rotate">{{ rotate ? 'stop' : 'rotate' }}</button>
      <button class="btn" type="button" :disabled="busy" @click="makeThumbnails">
        {{ busy ? `vignettes… ${sheet.length}` : 'vignettes' }}
      </button>
      <code>{{ src }}</code>
    </div>
    <div v-if="sheet.length" class="sheet">
      <figure v-for="item in sheet" :key="item.slug">
        <img :src="item.image" :alt="item.slug" />
        <figcaption>{{ item.slug }}</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.stage {
  height: 620px;
  background: radial-gradient(ellipse at 50% 60%, #ffffff 0%, #ebe8e0 60%, #dcd8ce 100%);
  border-radius: var(--radius);
  overflow: hidden;
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.sheet {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
}

.sheet figure {
  margin: 0;
  background: #e9e6de;
  border-radius: 10px;
  overflow: hidden;
}

.sheet img {
  display: block;
  width: 100%;
}

.sheet figcaption {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--muted);
}
</style>
