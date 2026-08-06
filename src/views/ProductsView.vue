<script setup lang="ts">
import { onMounted, ref } from 'vue'
import OpsShell from '@/components/OpsShell.vue'
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
    form.value = {
      name: '',
      interest_rate: '10',
      term_unit: 'months',
      term_length: 3,
      fee_amount: '0',
      is_active: true,
    }
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
      <button type="button" class="btn" @click="showForm = !showForm">
        {{ showForm ? 'Close form' : 'New product' }}
      </button>
    </template>
    <template #intro>
      <p class="muted">v1 supports flat interest only (ADR 0001). Reducing balance is rejected by the API.</p>
    </template>

    <section v-if="showForm" class="panel form-grid" style="margin-bottom: 1rem">
      <h2 style="margin: 0; font-size: 1.15rem">Create product</h2>
      <label>Name <input v-model="form.name" required /></label>
      <div class="grid-2">
        <label>Interest rate % <input v-model="form.interest_rate" type="number" min="0" step="0.01" /></label>
        <label>Fee amount <input v-model="form.fee_amount" type="number" min="0" step="0.01" /></label>
      </div>
      <div class="grid-2">
        <label>
          Term unit
          <select v-model="form.term_unit">
            <option value="months">months</option>
            <option value="weeks">weeks</option>
          </select>
        </label>
        <label>Term length <input v-model.number="form.term_length" type="number" min="1" /></label>
      </div>
      <label>
        <span style="display: flex; gap: 0.5rem; align-items: center">
          <input v-model="form.is_active" type="checkbox" /> Active
        </span>
      </label>
      <p v-if="formError" class="banner error">{{ formError }}</p>
      <button type="button" class="btn" :disabled="saving" @click="onCreate">
        {{ saving ? 'Saving…' : 'Save product' }}
      </button>
    </section>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading products…</p>

    <section v-else class="panel table-wrap">
      <p v-if="products.length === 0" class="muted">No products yet.</p>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rate</th>
            <th>Term</th>
            <th>Fee</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>
              <strong>{{ p.name }}</strong>
              <div class="muted mono" style="font-size: 0.85rem">#{{ p.id }} · {{ p.interest_model }}</div>
            </td>
            <td class="mono">{{ p.interest_rate }}%</td>
            <td class="mono">{{ p.term_length }} {{ p.term_unit }}</td>
            <td class="mono">{{ p.fee_amount }}</td>
            <td><StatusBadge :status="p.is_active ? 'active' : 'failed'" /></td>
          </tr>
        </tbody>
      </table>
    </section>
  </OpsShell>
</template>
