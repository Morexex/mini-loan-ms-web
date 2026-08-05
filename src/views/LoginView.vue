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
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/reconciliation'
    await router.replace(redirect)
  } catch {
    // error on store
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login-shell">
    <section class="login-panel">
      <p class="brand">Mini Loan MS</p>
      <h1>Ops console</h1>
      <p class="lede">Sign in to investigate unmatched evidence and recover late payments.</p>

      <form class="login-form" @submit.prevent="onSubmit">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="username" required />
        </label>
        <label>
          Password
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="auth.error" class="error" role="alert">{{ auth.error }}</p>
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}

.login-panel {
  width: min(420px, 100%);
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 2.25rem 2rem 2rem;
}

.brand {
  margin: 0;
  font-size: 1.65rem;
  color: var(--accent-deep);
}

h1 {
  margin: 0.35rem 0 0;
  font-size: 1.15rem;
  font-weight: 500;
  font-family: 'Source Sans 3', sans-serif;
  color: var(--muted);
}

.lede {
  margin: 1rem 0 1.5rem;
  color: var(--muted);
}

.login-form {
  display: grid;
  gap: 0.9rem;
}

label {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.92rem;
}

input {
  border: 1px solid var(--line);
  background: #fff;
  padding: 0.7rem 0.8rem;
  border-radius: 0;
}

button {
  margin-top: 0.4rem;
  border: 0;
  background: var(--accent);
  color: #f7fffc;
  padding: 0.8rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  color: var(--danger);
  font-weight: 600;
}
</style>
