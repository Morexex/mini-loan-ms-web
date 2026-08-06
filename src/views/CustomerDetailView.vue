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
  <OpsShell title="Customer detail" subtitle="Wallet & loans">
    <template #actions>
      <RouterLink class="btn ghost" to="/customers">Back</RouterLink>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading…</p>

    <template v-else-if="customer">
      <section class="panel grid-2">
        <div>
          <h2 style="margin: 0">{{ customer.name }}</h2>
          <p class="muted mono">{{ customer.phone }} · ID {{ customer.id_number }}</p>
          <p v-if="customer.email" class="muted">{{ customer.email }}</p>
        </div>
        <div>
          <p class="muted" style="margin: 0; text-transform: uppercase; font-size: 0.8rem; font-weight: 700">
            Wallet balance
          </p>
          <p class="mono" style="margin: 0.35rem 0 0; font-size: 1.6rem; font-weight: 700">
            {{ customer.wallet?.balance ?? '0.00' }}
            {{ customer.wallet?.currency ?? 'KES' }}
          </p>
        </div>
      </section>

      <section class="panel" style="margin-top: 0.85rem">
        <div class="row-between">
          <h2 style="margin: 0; font-size: 1.15rem">Loans</h2>
          <RouterLink :to="{ path: '/loans', query: { customer_id: String(customer.id) } }">
            Originate loan
          </RouterLink>
        </div>
        <p v-if="loans.length === 0" class="muted">No loans for this customer.</p>
        <div v-else class="table-wrap" style="margin-top: 0.75rem">
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
                <td><RouterLink :to="`/loans/${loan.id}`">Open</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </OpsShell>
</template>
