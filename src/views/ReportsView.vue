<script setup lang="ts">
import { onMounted, ref } from 'vue'
import OpsShell from '@/components/OpsShell.vue'
import { fetchAging, fetchOverview, type ReportAging, type ReportOverview } from '@/api/reports'

const loading = ref(true)
const error = ref<string | null>(null)
const overview = ref<ReportOverview | null>(null)
const aging = ref<ReportAging | null>(null)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const [o, a] = await Promise.all([fetchOverview(), fetchAging()])
    overview.value = o
    aging.value = a
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Unable to load reports.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell title="Portfolio reports" subtitle="Ops analytics">
    <template #actions>
      <button type="button" class="ghost" @click="load">Refresh</button>
    </template>
    <template #intro>
      <p>
        Snapshot of active book, collections, and installment aging. Figures come from the API —
        this page does not compute balances locally.
      </p>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading reports…</p>

    <template v-else-if="overview && aging">
      <section class="kpis">
        <article>
          <p class="label">Active loans</p>
          <p class="value mono">{{ overview.loans.active }}</p>
        </article>
        <article>
          <p class="label">Outstanding</p>
          <p class="value mono">{{ overview.outstanding_balance }}</p>
        </article>
        <article>
          <p class="label">Payments today</p>
          <p class="value mono">{{ overview.payments.today.amount }}</p>
          <p class="fine">{{ overview.payments.today.count }} posts</p>
        </article>
        <article>
          <p class="label">Payments MTD</p>
          <p class="value mono">{{ overview.payments.mtd.amount }}</p>
          <p class="fine">{{ overview.payments.mtd.count }} posts</p>
        </article>
        <article>
          <p class="label">Unmatched</p>
          <p class="value mono">{{ overview.reconciliation.unmatched_webhooks }}</p>
        </article>
        <article>
          <p class="label">Wallet liability</p>
          <p class="value mono">{{ overview.wallet_liability }}</p>
        </article>
      </section>

      <section class="aging">
        <header>
          <h2>Installment aging</h2>
          <p class="fine">As of {{ aging.as_of_date }} · total {{ aging.total_outstanding }}</p>
        </header>
        <table>
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Installments</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bucket in aging.buckets" :key="bucket.key">
              <td>{{ bucket.label }}</td>
              <td class="mono">{{ bucket.count }}</td>
              <td class="mono">{{ bucket.amount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="side">
        <p>
          Open intents: <span class="mono">{{ overview.reconciliation.open_intents }}</span>
          · Expired:
          <span class="mono">{{ overview.reconciliation.expired_intents }}</span>
          · Completed loans:
          <span class="mono">{{ overview.loans.completed }}</span>
        </p>
      </section>
    </template>
  </OpsShell>
</template>

<style scoped>
.banner {
  padding: 0.85rem 1rem;
  background: var(--panel);
  border: 1px solid var(--line);
}

.banner.error {
  color: var(--danger);
  font-weight: 600;
}

.intro :deep(p),
:deep(.intro) p,
p {
  color: var(--muted);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.kpis article,
.aging {
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 1rem 1.1rem;
}

.label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  margin: 0.35rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--ink);
}

.fine {
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.aging header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  flex-wrap: wrap;
}

.aging h2 {
  margin: 0;
  font-size: 1.25rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.85rem;
}

th,
td {
  text-align: left;
  padding: 0.55rem 0.25rem;
  border-bottom: 1px solid var(--line);
}

th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.side {
  margin-top: 1rem;
}

button.ghost {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  padding: 0.55rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
