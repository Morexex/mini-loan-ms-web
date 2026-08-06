<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('ops@miniloan.test')
const password = ref('password')
const submitting = ref(false)

async function onSubmit(): Promise<void> {
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/loans'
    await router.replace(redirect)
  } catch {
    // store holds error
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login">
    <section class="hero" aria-hidden="true">
      <p class="brand">Mini Loan MS</p>
      <h1>Lending ops,<br />built for clarity.</h1>
      <p class="lede">
        Originate, disburse, collect, and reconcile — with Payment Intents at the center, not Safaricom
        IDs.
      </p>
      <ul>
        <li>Intent-first repayment</li>
        <li>Auditable disbursement</li>
        <li>Manual recon when signals collide</li>
      </ul>
    </section>

    <section class="panel-wrap">
      <form class="login-panel" @submit.prevent="onSubmit">
        <p class="eyebrow">Operator sign-in</p>
        <h2>Welcome back</h2>
        <p class="muted">Use your seeded ops account to enter the console.</p>

        <label>
          Email
          <input v-model="email" type="email" autocomplete="username" required class="field" />
        </label>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="field"
          />
        </label>

        <p v-if="auth.error" class="banner error" role="alert">{{ auth.error }}</p>

        <button type="submit" class="btn" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Enter console' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
}

.hero {
  padding: clamp(2rem, 6vw, 4.5rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #eef7f3;
  background:
    linear-gradient(145deg, rgba(8, 86, 73, 0.55), rgba(12, 31, 26, 0.85)),
    radial-gradient(circle at 20% 20%, rgba(61, 207, 180, 0.35), transparent 40%),
    linear-gradient(160deg, #0c1f1a, #145043 55%, #0a2e27);
  animation: fade-in 0.6s var(--ease) both;
}

.brand {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.8rem);
  color: #f4fffb;
}

.hero h1 {
  margin: 1.2rem 0 0;
  font-size: clamp(2.1rem, 4.5vw, 3.4rem);
  line-height: 1.05;
  color: #f4fffb;
  max-width: 10ch;
}

.lede {
  margin: 1.1rem 0 0;
  max-width: 34rem;
  font-size: 1.05rem;
  color: rgba(238, 247, 243, 0.78);
  font-family: var(--font-sans);
}

ul {
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

li {
  font-weight: 600;
  padding-left: 1.1rem;
  position: relative;
  color: rgba(238, 247, 243, 0.9);
}

li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55rem;
  width: 0.45rem;
  height: 0.45rem;
  background: #3dcfb4;
}

.panel-wrap {
  display: grid;
  place-items: center;
  padding: 2rem;
  animation: rise-in 0.55s var(--ease) 0.08s both;
}

.login-panel {
  width: min(400px, 100%);
  display: grid;
  gap: 0.85rem;
  padding: 1.75rem;
  background: var(--panel-elevated);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.login-panel h2 {
  margin: 0;
  font-size: 1.7rem;
}

.login-panel .muted {
  margin: -0.25rem 0 0.35rem;
}

.login-panel label {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
}

@media (max-width: 880px) {
  .login {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: 42vh;
  }

  .hero h1 {
    max-width: none;
  }
}
</style>
