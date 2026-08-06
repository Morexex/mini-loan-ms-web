<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  title: string
  subtitle?: string
}>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const links = [
  { to: '/loans', label: 'Loans', hint: 'Lifecycle' },
  { to: '/customers', label: 'Customers', hint: 'Onboard' },
  { to: '/products', label: 'Products', hint: 'Terms' },
  { to: '/reconciliation', label: 'Recon', hint: 'Evidence' },
  { to: '/reports', label: 'Reports', hint: 'Portfolio' },
]

const activeSection = computed(() => {
  const path = route.path
  if (path.startsWith('/loans')) return '/loans'
  if (path.startsWith('/customers')) return '/customers'
  if (path.startsWith('/products')) return '/products'
  if (path.startsWith('/reconciliation')) return '/reconciliation'
  if (path.startsWith('/reports')) return '/reports'
  return path
})

async function onLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-frame">
    <aside class="sidebar">
      <div class="brand-block">
        <p class="brand">Mini Loan</p>
        <p class="brand-sub">Ops console</p>
      </div>

      <nav class="side-nav">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-item"
          :class="{ active: activeSection === link.to }"
        >
          <span class="nav-label">{{ link.label }}</span>
          <span class="nav-hint">{{ link.hint }}</span>
        </RouterLink>
      </nav>

      <div class="side-foot">
        <p class="operator">{{ auth.user?.name ?? auth.user?.email }}</p>
        <button type="button" class="btn ghost sm" @click="onLogout">Sign out</button>
      </div>
    </aside>

    <div class="main">
      <header class="page-head">
        <div class="page-titles">
          <p v-if="subtitle" class="eyebrow">{{ subtitle }}</p>
          <h1>{{ title }}</h1>
        </div>
        <div class="page-actions">
          <slot name="actions" />
        </div>
      </header>

      <div v-if="$slots.intro" class="page-intro">
        <slot name="intro" />
      </div>

      <div class="page-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-frame {
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar) 1fr;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.4rem 1rem 1.2rem;
  background: linear-gradient(180deg, #0c1f1a 0%, #12352c 55%, #0f2a23 100%);
  color: #e8f2ee;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-block {
  padding: 0.35rem 0.65rem 0.5rem;
}

.brand {
  margin: 0;
  font-size: 1.55rem;
  color: #f4fffb;
}

.brand-sub {
  margin: 0.15rem 0 0;
  font-size: 0.82rem;
  color: rgba(232, 242, 238, 0.62);
  font-family: var(--font-sans);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.side-nav {
  display: grid;
  gap: 0.35rem;
  flex: 1;
}

.nav-item {
  display: grid;
  gap: 0.1rem;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: rgba(232, 242, 238, 0.78);
  border: 1px solid transparent;
  transition:
    background 0.2s var(--ease),
    color 0.2s var(--ease),
    transform 0.2s var(--ease);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.nav-item.active {
  background: rgba(13, 122, 104, 0.35);
  border-color: rgba(120, 210, 190, 0.25);
  color: #fff;
  box-shadow: inset 3px 0 0 #3dcfb4;
}

.nav-label {
  font-weight: 700;
  font-size: 0.98rem;
}

.nav-hint {
  font-size: 0.75rem;
  opacity: 0.65;
}

.side-foot {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.operator {
  margin: 0;
  font-size: 0.88rem;
  color: rgba(232, 242, 238, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-foot .btn.ghost {
  color: #e8f2ee;
  border-color: rgba(255, 255, 255, 0.2);
}

.side-foot .btn.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.main {
  min-width: 0;
  padding: 1.5rem 1.75rem 2.5rem;
  animation: rise-in 0.4s var(--ease) both;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.85rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.page-titles h1 {
  margin: 0;
  font-size: clamp(1.7rem, 2.4vw, 2.15rem);
}

.page-actions {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  align-items: center;
}

.page-intro {
  margin-bottom: 1rem;
  max-width: 46rem;
  color: var(--muted);
}

.page-body {
  animation: rise-in 0.5s var(--ease) 0.05s both;
}

@media (max-width: 900px) {
  .app-frame {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    height: auto;
    padding-bottom: 1rem;
  }

  .side-nav {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .side-foot {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
</style>
