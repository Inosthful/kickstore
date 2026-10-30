<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Product } from '@/api/client'

// la licence CC-BY des modèles demande de citer l'auteur et la source
const products = ref<Product[]>([])
onMounted(async () => {
  products.value = await api.listProducts().catch(() => [])
})
</script>

<template>
  <section class="credits">
    <p class="eyebrow">Crédits</p>
    <h1>Les modèles 3D</h1>
    <p class="intro">
      Les paires sont des modèles 3D publiés sur Sketchfab par leurs auteurs en licence Creative Commons Attribution
      (CC-BY 4.0). Ils ont été convertis et compressés pour le web (Draco, textures WebP), sans autre modification.
      KickStore est un projet de cours, sans lien avec les marques citées.
    </p>

    <ul>
      <li v-for="p in products" :key="p.id">
        <RouterLink :to="{ name: 'product', params: { id: p.id } }" class="name">{{ p.brand }} {{ p.name }} {{ p.colorway }}</RouterLink>
        <span>
          par <a :href="p.model.authorUrl" target="_blank" rel="noopener">{{ p.model.author }}</a>,
          <a :href="p.model.source" target="_blank" rel="noopener">modèle d'origine</a>, {{ p.model.license }}
        </span>
      </li>
    </ul>

    <p class="intro">
      Rendu avec <a href="https://threejs.org" target="_blank" rel="noopener">three.js</a>. Prix, coloris et dates de
      sortie relevés sur <a href="https://stockx.com" target="_blank" rel="noopener">StockX</a>.
    </p>
  </section>
</template>

<style scoped>
.credits {
  max-width: 760px;
}

h1 {
  margin: 6px 0 16px;
  font-size: 36px;
}

.intro {
  color: var(--muted);
}

ul {
  display: grid;
  gap: 14px;
  margin: 28px 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  gap: 2px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
}

.name {
  font-weight: 600;
}

li span {
  color: var(--muted);
}

a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
