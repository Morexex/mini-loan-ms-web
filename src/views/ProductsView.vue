<script setup lang="ts">
import { onMounted, ref } from 'vue'
import OpsShell from '@/components/OpsShell.vue'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { apiErrorMessage } from '@/api/errors'
import { createProduct, listProducts } from '@/api/products'
import type { LoanProduct } from '@/types'

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const products = ref<LoanProduct[]>([])
const showForm = ref(false)

const form = ref({
  name: '',
  interest_rate: '10',
  term_unit: 'months',
  term_length: 3,
  fee_amount: '0',
  is_active: true,
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const page = await listProducts({ per_page: 50 })
    products.value = page.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'Unable to load products.')
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  formError.value = null
  form.value = {
    name: '',
    interest_rate: '10',
    term_unit: 'months',
    term_length: 3,
    fee_amount: '0',
    is_active: true,
  }
  showForm.value = true
}

async function onCreate(): Promise<void> {
  saving.value = true
  formError.value = null
  try {
    await createProduct({
      name: form.value.name,
      interest_model: 'flat',
      interest_rate: form.value.interest_rate,
      term_unit: form.value.term_unit,
      term_length: Number(form.value.term_length),
      fee_amount: form.value.fee_amount,
      is_active: form.value.is_active,
    })
    showForm.value = false
    await load()
  } catch (e) {
    formError.value = apiErrorMessage(e, 'Could not create product.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell title="Loan products" subtitle="Flat interest only">
    <template #actions>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
      <button type="button" class="btn" @click="openCreate">New product</button>
    </template>
    <template #intro>
      <p class="muted">
        v1 supports flat interest only (ADR 0001). Reducing balance is rejected by the API.
      </p>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading products…</p>

    <section v-else class="panel table-wrap">
      <div v-if="products.length === 0" class="empty">
        <strong>No products yet</strong>
        Define terms before you originate loans.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rate</th>
            <th>Term</th>
            <th>Fee</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>
              <strong>{{ p.name }}</strong>
              <div class="muted mono fine">#{{ p.id }} · {{ p.interest_model }}</div>
            </td>
            <td class="mono">{{ p.interest_rate }}%</td>
            <td class="mono">{{ p.term_length }} {{ p.term_unit }}</td>
            <td class="mono">{{ p.fee_amount }}</td>
            <td>
              <StatusBadge :status="p.is_active ? 'active' : 'cancelled'" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <Modal
      :open="showForm"
      title="New product"
      subtitle="Flat interest model is locked for v1."
      @close="showForm = false"
    >
      <form class="form-grid" @submit.prevent="onCreate">
        <label>Name <input v-model="form.name" required class="field" /></label>
        <div class="grid-2">
          <label>
            Interest rate %
            <input v-model="form.interest_rate" type="number" min="0" step="0.01" class="field" />
          </label>
          <label>
            Fee amount
            <input v-model="form.fee_amount" type="number" min="0" step="0.01" class="field" />
          </label>
        </div>
        <div class="grid-2">
          <label>
            Term unit
            <select v-model="form.term_unit" class="field">
              <option value="months">months</option>
              <option value="weeks">weeks</option>
            </select>
          </label>
          <label>
            Term length
            <input v-model.number="form.term_length" type="number" min="1" class="field" />
          </label>
        </div>
        <label class="check">
          <input v-model="form.is_active" type="checkbox" />
          Active for origination
        </label>
        <p v-if="formError" class="banner error">{{ formError }}</p>
      </form>
      <template #footer>
        <button type="button" class="btn ghost" @click="showForm = false">Cancel</button>
        <button type="button" class="btn" :disabled="saving" @click="onCreate">
          {{ saving ? 'Saving…' : 'Save product' }}
        </button>
      </template>
    </Modal>
  </OpsShell>
</template>

<style scoped>
.fine {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}

.check {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}
</style>
