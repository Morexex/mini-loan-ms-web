<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import { apiErrorMessage } from '@/api/errors'
import { createCustomer, listCustomers } from '@/api/customers'
import type { Customer } from '@/types'

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const customers = ref<Customer[]>([])
const search = ref('')
const showForm = ref(false)

const form = ref({
  name: '',
  phone: '',
  id_number: '',
  email: '',
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const page = await listCustomers({
      search: search.value.trim() || undefined,
      per_page: 50,
    })
    customers.value = page.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'Unable to load customers.')
  } finally {
    loading.value = false
  }
}

async function onCreate(): Promise<void> {
  saving.value = true
  formError.value = null
  try {
    await createCustomer({
      name: form.value.name,
      phone: form.value.phone,
      id_number: form.value.id_number,
      email: form.value.email || null,
    })
    form.value = { name: '', phone: '', id_number: '', email: '' }
    showForm.value = false
    await load()
  } catch (e) {
    formError.value = apiErrorMessage(e, 'Could not create customer.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell title="Customers" subtitle="Onboarding">
    <template #actions>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
      <button type="button" class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Close form' : 'New customer' }}
      </button>
    </template>
    <template #intro>
      <p class="muted">Phone is normalized to 2547… and used as the default M-Pesa MSISDN.</p>
    </template>

    <section v-if="showForm" class="panel form-grid" style="margin-bottom: 1rem">
      <h2 style="margin: 0; font-size: 1.15rem">Create customer</h2>
      <label>Name <input v-model="form.name" required /></label>
      <div class="grid-2">
        <label>Phone <input v-model="form.phone" placeholder="07… or 2547…" required /></label>
        <label>ID number <input v-model="form.id_number" required /></label>
      </div>
      <label>Email (optional) <input v-model="form.email" type="email" /></label>
      <p v-if="formError" class="banner error">{{ formError }}</p>
      <button type="button" class="btn" :disabled="saving" @click="onCreate">
        {{ saving ? 'Saving…' : 'Save customer' }}
      </button>
    </section>

    <div class="row-between" style="margin-bottom: 0.75rem">
      <input
        v-model="search"
        placeholder="Search name, phone, ID…"
        style="max-width: 320px; border: 1px solid var(--line); padding: 0.55rem 0.7rem; width: 100%"
        @keyup.enter="load"
      />
      <button type="button" class="btn ghost" @click="load">Search</button>
    </div>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading customers…</p>

    <section v-else class="panel table-wrap">
      <p v-if="customers.length === 0" class="muted">No customers yet.</p>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Wallet</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.id">
            <td>
              <strong>{{ c.name }}</strong>
              <div class="muted mono" style="font-size: 0.85rem">#{{ c.id }} · {{ c.id_number }}</div>
            </td>
            <td class="mono">{{ c.phone }}</td>
            <td class="mono">
              {{ c.wallet?.balance ?? '0.00' }} {{ c.wallet?.currency ?? 'KES' }}
            </td>
            <td><RouterLink :to="`/customers/${c.id}`">Open</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </section>
  </OpsShell>
</template>
