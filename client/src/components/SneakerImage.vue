<script setup lang="ts">
defineProps<{ color: string }>()
</script>

<template>
  <svg viewBox="0 0 320 190" role="img" aria-hidden="true">
    <ellipse cx="162" cy="174" rx="132" ry="8" fill="rgba(0,0,0,.12)" />
    <path
      d="M30 142 L34 96 Q36 88 46 86 L84 80 Q100 78 110 64 L120 46 Q126 36 140 38 L152 42 Q170 70 196 82 Q236 92 280 108 Q300 116 300 132 L300 142 Z"
      :fill="color"
      stroke="#111"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <path d="M236 94 Q282 106 300 124 L300 142 L246 142 Q250 116 236 94 Z" fill="rgba(255,255,255,.25)" />
    <path d="M46 86 L84 80 Q100 78 110 64 L120 46 Q118 62 108 76 Q92 92 46 96 Z" fill="rgba(0,0,0,.28)" />
    <path
      d="M146 54 L162 62 M158 66 L176 74 M170 78 L190 86"
      stroke="#fff"
      stroke-width="4"
      stroke-linecap="round"
      opacity=".85"
    />
    <path d="M62 126 Q130 120 196 100" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6" fill="none" />
    <path
      d="M22 142 H300 Q306 142 306 150 V156 Q306 166 294 166 H34 Q22 166 22 156 Z"
      fill="#f4f4f1"
      stroke="#111"
      stroke-width="3"
      stroke-linejoin="round"
    />
  </svg>
</template>
