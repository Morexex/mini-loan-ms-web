<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  title: string
  subtitle?: string
}>()

const auth = useAuthStore()
const router = useRouter()

async function onLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div>
        <p class="brand">Mini Loan MS</p>
        <p class="sub">{{ subtitle ?? title }}</p>
      </div>
      <nav class="nav">
        <RouterLink to="/reconciliation">Reconciliation</RouterLink>
        <RouterLink to="/reports">Reports</RouterLink>
      </nav>
      <div class="topbar-actions">
        <span class="operator">{{ auth.user?.email }}</span>
        <slot name="actions" />
        <button type="button" class="ghost" @click="onLogout">Sign out</button>
      </div>
    </header>
    <main class="content">
      <section class="intro">
        <h1>{{ title }}</h1>
        <slot name="intro" />
      </section>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 253, 248, 0.88);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 5;
}

.brand {
  margin: 0;
  font-size: 1.45rem;
  color: var(--accent-deep);
}

.sub,
.operator {
  color: var(--muted);
}

.sub {
  margin: 0.15rem 0 0;
  font-size: 0.92rem;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav a {
  text-decoration: none;
  font-weight: 700;
  color: var(--muted);
}

.nav a.router-link-active {
  color: var(--accent-deep);
  border-bottom: 2px solid var(--accent);
}

.topbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.content {
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.75rem 0 3rem;
}

.intro h1 {
  margin: 0;
  font-size: 2rem;
}

button.ghost {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  padding: 0.55rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
