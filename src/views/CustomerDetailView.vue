<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import { apiErrorMessage } from '@/api/errors'
import { getCustomer } from '@/api/customers'
import { listLoans } from '@/api/loans'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Customer, Loan } from '@/types'

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const customer = ref<Customer | null>(null)
const loans = ref<Loan[]>([])

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    customer.value = await getCustomer(id)
    const page = await listLoans({ customer_id: id, per_page: 50 })
    loans.value = page.data
  } catch (e) {
    error.value = apiErrorMessage(e, 'Unable to load customer.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell :title="customer?.name ?? 'Customer'" subtitle="Wallet & loans">
    <template #actions>
      <RouterLink class="btn ghost" to="/customers">Back</RouterLink>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
      <RouterLink
        v-if="customer"
        class="btn"
        :to="{ path: '/loans', query: { customer_id: String(customer.id) } }"
      >
        Originate loan
      </RouterLink>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading…</p>

    <template v-else-if="customer">
      <section class="panel hero-card">
        <div>
          <p class="eyebrow">Borrower #{{ customer.id }}</p>
          <h2>{{ customer.name }}</h2>
          <p class="muted mono">{{ customer.phone }} · ID {{ customer.id_number }}</p>
          <p v-if="customer.email" class="muted">{{ customer.email }}</p>
        </div>
        <div class="stat wallet">
          <p class="stat-label">Wallet balance</p>
          <p class="stat-value">
            {{ customer.wallet?.balance ?? '0.00' }}
            <span class="currency">{{ customer.wallet?.currency ?? 'KES' }}</span>
          </p>
          <p class="muted fine">Credit from overpayments (ADR 0003)</p>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Loans</h2>
        <div v-if="loans.length === 0" class="empty">
          <strong>No loans yet</strong>
          Originate from the actions bar to start the lifecycle.
        </div>
        <div v-else class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Principal</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="loan in loans" :key="loan.id">
                <td class="mono">#{{ loan.id }}</td>
                <td class="mono">{{ loan.principal_amount }}</td>
                <td><StatusBadge :status="loan.status" /></td>
                <td>
                  <RouterLink class="btn ghost sm" :to="`/loans/${loan.id}`">Open</RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </OpsShell>
</template>

<style scoped>
.hero-card {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 1.25rem;
  align-items: center;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero-card h2 {
  margin: 0;
  font-size: 1.75rem;
}

.wallet {
  background: linear-gradient(145deg, #0d7a68 0%, #085649 100%);
  border: none;
  color: #eef7f3;
}

.wallet .stat-label,
.wallet .muted {
  color: rgba(238, 247, 243, 0.72);
}

.wallet .stat-value {
  color: #fff;
  font-size: 1.7rem;
}

.currency {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.8;
}

.fine {
  font-size: 0.82rem;
  margin: 0.4rem 0 0;
}

@media (max-width: 720px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}
</style>
