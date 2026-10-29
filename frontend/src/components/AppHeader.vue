<template>
  <header class="header">
    <div class="container bar">
      <RouterLink to="/" class="logo">KICK<span>STORE</span></RouterLink>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.logo span {
  color: var(--ok);
}
</style>
