<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LifecycleStepper from '@/components/LifecycleStepper.vue'
import { apiErrorMessage } from '@/api/errors'
import {
  approveLoan,
  createPaymentIntent,
  disburseLoan,
  getLoan,
  listPaymentIntents,
  simulateStkSuccess,
} from '@/api/loans'
import type { Loan, PaymentIntentItem } from '@/types'

const route = useRoute()
const loading = ref(true)
const busy = ref(false)
const error = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionOk = ref<string | null>(null)
const loan = ref<Loan | null>(null)
const intents = ref<PaymentIntentItem[]>([])
const collectAmount = ref('')
const showCollect = ref(false)
const confirmApprove = ref(false)
const confirmDisburse = ref(false)

const canApprove = computed(() => loan.value?.status === 'pending')
const canDisburse = computed(() =>
  ['approved', 'disbursement_requested'].includes(loan.value?.status ?? ''),
)
const canCollect = computed(() => loan.value?.status === 'active')

const latestDisbursement = computed(() => loan.value?.disbursements?.[0] ?? null)
const awaitingIntents = computed(() =>
  intents.value.filter((intent) => intent.status === 'awaiting_callback'),
)

const paidCount = computed(
  () => loan.value?.installments?.filter((i) => i.status === 'paid').length ?? 0,
)
const dueCount = computed(() => loan.value?.installments?.length ?? 0)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    loan.value = await getLoan(id)
    intents.value = await listPaymentIntents(id)
    if (!collectAmount.value && loan.value.installments?.length) {
      const next = loan.value.installments.find((i) => i.status !== 'paid')
      collectAmount.value = next?.amount_due ?? ''
    }
  } catch (e) {
    error.value = apiErrorMessage(e, 'Unable to load loan.')
  } finally {
    loading.value = false
  }
}

async function onApprove(): Promise<void> {
  if (!loan.value) return
  busy.value = true
  actionError.value = null
  actionOk.value = null
  try {
    loan.value = await approveLoan(loan.value.id)
    confirmApprove.value = false
    actionOk.value = 'Loan approved and installment schedule generated.'
    await load()
  } catch (e) {
    actionError.value = apiErrorMessage(e, 'Approve failed.')
  } finally {
    busy.value = false
  }
}

async function onDisburse(): Promise<void> {
  if (!loan.value) return
  busy.value = true
  actionError.value = null
  actionOk.value = null
  try {
    loan.value = await disburseLoan(loan.value.id)
    confirmDisburse.value = false
    actionOk.value = 'Disbursement submitted via Daraja.'
    await load()
  } catch (e) {
    actionError.value = apiErrorMessage(e, 'Disburse failed.')
  } finally {
    busy.value = false
  }
}

async function onCollect(): Promise<void> {
  if (!loan.value) return
  busy.value = true
  actionError.value = null
  actionOk.value = null
  try {
    const intent = await createPaymentIntent(loan.value.id, { amount: collectAmount.value })
    showCollect.value = false
    actionOk.value = `Payment intent ${intent.uuid.slice(0, 8)}… → ${intent.status}. Use Simulate STK success if sandbox does not call back.`
    await load()
  } catch (e) {
    actionError.value = apiErrorMessage(e, 'STK / payment intent failed.')
  } finally {
    busy.value = false
  }
}

async function onSimulateStk(intent: PaymentIntentItem): Promise<void> {
  if (!loan.value) return
  busy.value = true
  actionError.value = null
  actionOk.value = null
  try {
    const updated = await simulateStkSuccess(loan.value.id, intent.uuid)
    actionOk.value = `Simulated STK success for ${updated.uuid.slice(0, 8)}… → ${updated.status}`
    await load()
  } catch (e) {
    actionError.value = apiErrorMessage(e, 'STK simulation failed.')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell :title="loan ? `Loan #${loan.id}` : 'Loan workspace'" subtitle="Lifecycle hub">
    <template #actions>
      <RouterLink class="btn ghost" to="/loans">Back</RouterLink>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading loan…</p>

    <template v-else-if="loan">
      <section class="panel summary">
        <div class="summary-top">
          <div>
            <p class="eyebrow">
              <RouterLink v-if="loan.customer" :to="`/customers/${loan.customer.id}`">
                {{ loan.customer.name }}
              </RouterLink>
              <span v-else>Customer #{{ loan.customer_id }}</span>
              · {{ loan.loan_product?.name ?? `Product #${loan.loan_product_id}` }}
            </p>
            <div class="title-row">
              <h2>Loan #{{ loan.id }}</h2>
              <StatusBadge :status="loan.status" />
            </div>
          </div>
          <div class="money">
            <p class="stat-label">Principal</p>
            <p class="stat-value">{{ loan.principal_amount }} {{ loan.currency }}</p>
          </div>
        </div>

        <LifecycleStepper :status="loan.status" />

        <div class="grid-3 meta-strip">
          <div class="stat">
            <p class="stat-label">Approved</p>
            <p class="mono fine-val">{{ loan.approved_at ?? '—' }}</p>
          </div>
          <div class="stat">
            <p class="stat-label">Disbursed</p>
            <p class="mono fine-val">{{ loan.disbursed_at ?? '—' }}</p>
          </div>
          <div class="stat">
            <p class="stat-label">Installments</p>
            <p class="mono fine-val">{{ paidCount }}/{{ dueCount }} paid</p>
          </div>
        </div>
      </section>

      <section class="panel actions">
        <h2 class="panel-title">Next actions</h2>
        <div class="action-grid">
          <button
            type="button"
            class="action-card"
            :disabled="busy || !canApprove"
            @click="confirmApprove = true"
          >
            <span class="action-label">Approve</span>
            <span class="action-desc">Generate flat schedule</span>
          </button>
          <button
            type="button"
            class="action-card"
            :disabled="busy || !canDisburse"
            @click="confirmDisburse = true"
          >
            <span class="action-label">
              {{ loan.status === 'disbursement_requested' ? 'Retry B2C' : 'Disburse' }}
            </span>
            <span class="action-desc">Send principal via Daraja</span>
          </button>
          <button
            type="button"
            class="action-card accent"
            :disabled="busy || !canCollect"
            @click="showCollect = true"
          >
            <span class="action-label">Collect</span>
            <span class="action-desc">Payment Intent + STK</span>
          </button>
        </div>
        <p v-if="!canCollect" class="muted tip">
          Collection unlocks when the loan is <strong>active</strong> after successful disbursement.
        </p>
        <p v-if="actionError" class="banner error">{{ actionError }}</p>
        <p v-if="actionOk" class="banner ok">{{ actionOk }}</p>
      </section>

      <section class="panel">
        <h2 class="panel-title">Installments</h2>
        <p v-if="!loan.installments?.length" class="muted">No schedule yet — approve the loan first.</p>
        <div v-else class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Due</th>
                <th>Due amt</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in loan.installments" :key="row.id">
                <td class="mono">{{ row.sequence }}</td>
                <td class="mono">{{ row.due_date }}</td>
                <td class="mono">{{ row.amount_due }}</td>
                <td class="mono">{{ row.amount_paid }}</td>
                <td><StatusBadge :status="row.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid-2 twin">
        <section class="panel">
          <h2 class="panel-title">Disbursements</h2>
          <p v-if="!loan.disbursements?.length" class="muted">No disbursement attempts yet.</p>
          <template v-else>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>UUID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in loan.disbursements" :key="d.id">
                    <td class="mono">{{ d.uuid.slice(0, 8) }}…</td>
                    <td class="mono">{{ d.amount }}</td>
                    <td><StatusBadge :status="d.status" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="latestDisbursement?.status === 'failed'" class="banner error">
              Last disbursement failed — retry B2C above.
            </p>
          </template>
        </section>

        <section class="panel">
          <h2 class="panel-title">Payment intents</h2>
          <p v-if="intents.length === 0" class="muted">No collection attempts yet.</p>
          <div v-else class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>UUID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="intent in intents" :key="intent.uuid">
                  <td class="mono">{{ intent.uuid.slice(0, 8) }}…</td>
                  <td class="mono">{{ intent.amount }}</td>
                  <td><StatusBadge :status="intent.status" /></td>
                  <td>
                    <button
                      v-if="intent.status === 'awaiting_callback'"
                      type="button"
                      class="btn ghost sm"
                      :disabled="busy"
                      @click="onSimulateStk(intent)"
                    >
                      Simulate STK success
                    </button>
                    <span v-else class="muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="awaitingIntents.length" class="muted tip">
            Sandbox often will not prompt a personal phone. Use
            <strong>Simulate STK success</strong> to post a Daraja-shaped callback through the real
            allocation engine (assessment demo path).
          </p>
        </section>
      </div>

      <Modal
        :open="confirmApprove"
        title="Approve loan?"
        subtitle="Generates the flat installment schedule. This cannot be undone."
        @close="confirmApprove = false"
      >
        <p class="muted">
          Principal <span class="mono">{{ loan.principal_amount }} {{ loan.currency }}</span> will be
          scheduled against product terms.
        </p>
        <p v-if="actionError" class="banner error">{{ actionError }}</p>
        <template #footer>
          <button type="button" class="btn ghost" @click="confirmApprove = false">Cancel</button>
          <button type="button" class="btn" :disabled="busy" @click="onApprove">
            {{ busy ? 'Approving…' : 'Confirm approve' }}
          </button>
        </template>
      </Modal>

      <Modal
        :open="confirmDisburse"
        title="Disburse via B2C?"
        subtitle="Sends principal to the customer phone through Daraja."
        @close="confirmDisburse = false"
      >
        <p class="muted">
          Amount <span class="mono">{{ loan.principal_amount }} {{ loan.currency }}</span>
          → <span class="mono">{{ loan.customer?.phone ?? 'customer phone' }}</span>
        </p>
        <p v-if="actionError" class="banner error">{{ actionError }}</p>
        <template #footer>
          <button type="button" class="btn ghost" @click="confirmDisburse = false">Cancel</button>
          <button type="button" class="btn" :disabled="busy" @click="onDisburse">
            {{ busy ? 'Submitting…' : 'Confirm disburse' }}
          </button>
        </template>
      </Modal>

      <Modal
        :open="showCollect"
        title="Collect repayment"
        subtitle="Creates a Payment Intent and triggers STK Push."
        @close="showCollect = false"
      >
        <form class="form-grid" @submit.prevent="onCollect">
          <label>
            Amount
            <input
              v-model="collectAmount"
              type="number"
              min="1"
              step="0.01"
              class="field"
              required
            />
          </label>
          <p class="muted tip">
            Prefer sandbox test MSISDN <code>254708374149</code>. After STK is
            <code>awaiting_callback</code>, use <strong>Simulate STK success</strong> on the intent
            if Safaricom does not call back (same allocate path).
          </p>
          <p v-if="actionError" class="banner error">{{ actionError }}</p>
        </form>
        <template #footer>
          <button type="button" class="btn ghost" @click="showCollect = false">Cancel</button>
          <button type="button" class="btn" :disabled="busy || !collectAmount" @click="onCollect">
            {{ busy ? 'Creating…' : 'Create intent + STK' }}
          </button>
        </template>
      </Modal>
    </template>
  </OpsShell>
</template>

<style scoped>
.summary-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.15rem;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.88rem;
  color: var(--muted);
}

.title-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.title-row h2 {
  margin: 0;
  font-size: 1.65rem;
}

.money .stat-value {
  font-size: 1.55rem;
}

.meta-strip {
  margin-top: 1.1rem;
}

.fine-val {
  margin: 0.35rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.action-card {
  display: grid;
  gap: 0.25rem;
  text-align: left;
  padding: 1rem 1.05rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(160deg, #fff 0%, #f4f9f7 100%);
  cursor: pointer;
  transition:
    transform 0.2s var(--ease),
    border-color 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}

.action-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.action-card:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-card.accent {
  background: linear-gradient(145deg, #0d7a68, #085649);
  border-color: transparent;
  color: #f4fffb;
}

.action-card.accent .action-desc {
  color: rgba(244, 255, 251, 0.72);
}

.action-label {
  font-weight: 700;
  font-size: 1.05rem;
}

.action-desc {
  font-size: 0.85rem;
  color: var(--muted);
}

.tip {
  margin: 0.85rem 0 0;
  font-size: 0.92rem;
}

.actions .banner {
  margin-top: 0.85rem;
}

.twin {
  margin-top: 0.9rem;
}

.twin .panel {
  margin-top: 0;
}

.twin .banner {
  margin-top: 0.75rem;
}

@media (max-width: 800px) {
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
