<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import Modal from '@/components/Modal.vue'
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

function openCreate(): void {
  formError.value = null
  form.value = { name: '', phone: '', id_number: '', email: '' }
  showForm.value = true
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
      <button type="button" class="btn" @click="openCreate">New customer</button>
    </template>
    <template #intro>
      <p class="muted">Phone is normalized to 2547… and used as the default M-Pesa MSISDN.</p>
    </template>

    <div class="toolbar">
      <input
        v-model="search"
        class="field search"
        placeholder="Search name, phone, ID…"
        @keyup.enter="load"
      />
      <button type="button" class="btn ghost" @click="load">Search</button>
    </div>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading customers…</p>

    <section v-else class="panel table-wrap">
      <div v-if="customers.length === 0" class="empty">
        <strong>No customers yet</strong>
        Onboard the first borrower to start originating.
      </div>
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
              <div class="muted mono fine">#{{ c.id }} · {{ c.id_number }}</div>
            </td>
            <td class="mono">{{ c.phone }}</td>
            <td class="mono">
              {{ c.wallet?.balance ?? '0.00' }} {{ c.wallet?.currency ?? 'KES' }}
            </td>
            <td>
              <RouterLink class="btn ghost sm" :to="`/customers/${c.id}`">Open</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <Modal
      :open="showForm"
      title="New customer"
      subtitle="Phone becomes the default MSISDN for STK and B2C."
      @close="showForm = false"
    >
      <form class="form-grid" @submit.prevent="onCreate">
        <label>Name <input v-model="form.name" required class="field" /></label>
        <div class="grid-2">
          <label>
            Phone
            <input v-model="form.phone" placeholder="07… or 2547…" required class="field" />
          </label>
          <label>ID number <input v-model="form.id_number" required class="field" /></label>
        </div>
        <label>Email (optional) <input v-model="form.email" type="email" class="field" /></label>
        <p v-if="formError" class="banner error">{{ formError }}</p>
      </form>
      <template #footer>
        <button type="button" class="btn ghost" @click="showForm = false">Cancel</button>
        <button type="button" class="btn" :disabled="saving" @click="onCreate">
          {{ saving ? 'Saving…' : 'Save customer' }}
        </button>
      </template>
    </Modal>
  </OpsShell>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.search {
  max-width: 320px;
}

.fine {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}
</style>
