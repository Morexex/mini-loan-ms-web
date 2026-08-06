<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { apiErrorMessage } from '@/api/errors'
import { listCustomers } from '@/api/customers'
import { listProducts } from '@/api/products'
import { createLoan, listLoans } from '@/api/loans'
import type { Customer, Loan, LoanProduct } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const loans = ref<Loan[]>([])
const customers = ref<Customer[]>([])
const products = ref<LoanProduct[]>([])
const showForm = ref(false)
const statusFilter = ref('')

const form = ref({
  customer_id: '',
  loan_product_id: '',
  principal_amount: '5000',
})

async function loadLookups(): Promise<void> {
  const [c, p] = await Promise.all([
    listCustomers({ per_page: 100 }),
    listProducts({ is_active: true, per_page: 100 }),
  ])
  customers.value = c.data
  products.value = p.data.filter((item) => item.is_active)
}

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const page = await listLoans({
      status: statusFilter.value || undefined,
      customer_id: route.query.customer_id ? Number(route.query.customer_id) : undefined,
      per_page: 50,
    })
    loans.value = page.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'Unable to load loans.')
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  formError.value = null
  if (route.query.customer_id) {
    form.value.customer_id = String(route.query.customer_id)
  }
  showForm.value = true
}

async function onCreate(): Promise<void> {
  saving.value = true
  formError.value = null
  try {
    const loan = await createLoan({
      customer_id: Number(form.value.customer_id),
      loan_product_id: Number(form.value.loan_product_id),
      principal_amount: form.value.principal_amount,
    })
    showForm.value = false
    await router.push(`/loans/${loan.id}`)
  } catch (e) {
    formError.value = apiErrorMessage(e, 'Could not create loan.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (route.query.customer_id) {
    form.value.customer_id = String(route.query.customer_id)
    showForm.value = true
  }
  await Promise.all([loadLookups(), load()])
})

watch(statusFilter, () => {
  void load()
})
</script>

<template>
  <OpsShell title="Loans" subtitle="Origination & lifecycle">
    <template #actions>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
      <button type="button" class="btn" @click="openCreate">New loan</button>
    </template>
    <template #intro>
      <p class="muted">
        Create pending applications, then open a loan to approve, disburse, and collect.
      </p>
    </template>

    <div class="toolbar">
      <label class="filter">
        Status
        <select v-model="statusFilter" class="field">
          <option value="">All</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="disbursement_requested">disbursement_requested</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
        </select>
      </label>
      <p v-if="route.query.customer_id" class="chip muted">
        Filtered to customer #{{ route.query.customer_id }}
      </p>
    </div>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading loans…</p>

    <section v-else class="panel table-wrap">
      <div v-if="loans.length === 0" class="empty">
        <strong>No loans yet</strong>
        Originate a pending application to start the pipeline.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Loan</th>
            <th>Customer</th>
            <th>Principal</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in loans" :key="loan.id">
            <td class="mono">#{{ loan.id }}</td>
            <td>
              {{ loan.customer?.name ?? loan.customer_id }}
              <div class="muted mono fine">{{ loan.customer?.phone }}</div>
            </td>
            <td class="mono">{{ loan.principal_amount }} {{ loan.currency }}</td>
            <td><StatusBadge :status="loan.status" /></td>
            <td>
              <RouterLink class="btn ghost sm" :to="`/loans/${loan.id}`">Open</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <Modal
      :open="showForm"
      title="Originate loan"
      subtitle="Creates a pending application — approve from the loan workspace."
      @close="showForm = false"
    >
      <form class="form-grid" @submit.prevent="onCreate">
        <label>
          Customer
          <select v-model="form.customer_id" required class="field">
            <option disabled value="">Select customer…</option>
            <option v-for="c in customers" :key="c.id" :value="String(c.id)">
              {{ c.name }} · {{ c.phone }}
            </option>
          </select>
        </label>
        <label>
          Product
          <select v-model="form.loan_product_id" required class="field">
            <option disabled value="">Select product…</option>
            <option v-for="p in products" :key="p.id" :value="String(p.id)">
              {{ p.name }} · {{ p.term_length }} {{ p.term_unit }} · {{ p.interest_rate }}%
            </option>
          </select>
        </label>
        <label>
          Principal
          <input v-model="form.principal_amount" type="number" min="1" step="0.01" class="field" />
        </label>
        <p v-if="formError" class="banner error">{{ formError }}</p>
      </form>
      <template #footer>
        <button type="button" class="btn ghost" @click="showForm = false">Cancel</button>
        <button type="button" class="btn" :disabled="saving" @click="onCreate">
          {{ saving ? 'Creating…' : 'Create pending loan' }}
        </button>
      </template>
    </Modal>
  </OpsShell>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.filter {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.92rem;
}

.filter .field {
  min-width: 200px;
}

.chip {
  margin: 0;
  padding: 0.45rem 0.7rem;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
}

.fine {
  font-size: 0.85rem;
  margin-top: 0.15rem;
}
</style>
