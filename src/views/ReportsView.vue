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
  <OpsShell title="Reports" subtitle="Portfolio snapshot">
    <template #actions>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
    </template>
    <template #intro>
      <p class="muted">
        Active book, collections, and installment aging — figures come from the API, not local math.
      </p>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading reports…</p>

    <template v-else-if="overview && aging">
      <section class="hero-kpis">
        <article class="kpi featured">
          <p class="stat-label">Outstanding</p>
          <p class="stat-value">{{ overview.outstanding_balance }}</p>
          <p class="fine">{{ overview.loans.active }} active loans</p>
        </article>
        <article class="kpi">
          <p class="stat-label">Payments today</p>
          <p class="stat-value">{{ overview.payments.today.amount }}</p>
          <p class="fine">{{ overview.payments.today.count }} posts</p>
        </article>
        <article class="kpi">
          <p class="stat-label">Payments MTD</p>
          <p class="stat-value">{{ overview.payments.mtd.amount }}</p>
          <p class="fine">{{ overview.payments.mtd.count }} posts</p>
        </article>
        <article class="kpi warn">
          <p class="stat-label">Unmatched</p>
          <p class="stat-value">{{ overview.reconciliation.unmatched_webhooks }}</p>
          <p class="fine">Needs recon review</p>
        </article>
      </section>

      <div class="grid-2">
        <section class="panel">
          <h2 class="panel-title">Installment aging</h2>
          <p class="muted fine-top">As of {{ aging.as_of_date }} · total {{ aging.total_outstanding }}</p>
          <div class="table-wrap">
            <table class="data">
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
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">Book health</h2>
          <div class="stack meters">
            <div class="meter">
              <div class="row-between">
                <span>Wallet liability</span>
                <span class="mono">{{ overview.wallet_liability }}</span>
              </div>
            </div>
            <div class="meter">
              <div class="row-between">
                <span>Open intents</span>
                <span class="mono">{{ overview.reconciliation.open_intents }}</span>
              </div>
            </div>
            <div class="meter">
              <div class="row-between">
                <span>Expired intents</span>
                <span class="mono">{{ overview.reconciliation.expired_intents }}</span>
              </div>
            </div>
            <div class="meter">
              <div class="row-between">
                <span>Completed loans</span>
                <span class="mono">{{ overview.loans.completed }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </OpsShell>
</template>

<style scoped>
.hero-kpis {
  display: grid;
  grid-template-columns: 1.35fr repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.kpi {
  padding: 1.05rem 1.1rem;
  background: var(--panel-elevated);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  animation: rise-in 0.45s var(--ease) both;
}

.kpi.featured {
  background: linear-gradient(145deg, #0d7a68, #085649);
  border: none;
  color: #f4fffb;
}

.kpi.featured .stat-label,
.kpi.featured .fine {
  color: rgba(244, 255, 251, 0.72);
}

.kpi.featured .stat-value {
  color: #fff;
  font-size: 1.7rem;
}

.kpi.warn .stat-value {
  color: var(--warn);
}

.fine,
.fine-top {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.fine-top {
  margin: -0.4rem 0 0.85rem;
}

.meters {
  gap: 0.65rem;
}

.meter {
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: linear-gradient(160deg, #fff, #f6faf8);
  font-weight: 600;
}

@media (max-width: 960px) {
  .hero-kpis {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .hero-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
