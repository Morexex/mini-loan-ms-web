<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import OpsShell from '@/components/OpsShell.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { apiErrorMessage } from '@/api/errors'
import {
  approveLoan,
  createPaymentIntent,
  disburseLoan,
  getLoan,
  listPaymentIntents,
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

const canApprove = computed(() => loan.value?.status === 'pending')
const canDisburse = computed(() =>
  ['approved', 'disbursement_requested'].includes(loan.value?.status ?? ''),
)
const canCollect = computed(() => loan.value?.status === 'active')

const latestDisbursement = computed(() => loan.value?.disbursements?.[0] ?? null)

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
    actionOk.value = 'Disbursement submitted (fake/sandbox Daraja).'
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
    actionOk.value = `Payment intent ${intent.uuid.slice(0, 8)}… → ${intent.status}`
    await load()
  } catch (e) {
    actionError.value = apiErrorMessage(e, 'STK / payment intent failed.')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <OpsShell title="Loan workspace" subtitle="Lifecycle hub">
    <template #actions>
      <RouterLink class="btn ghost" to="/loans">Back</RouterLink>
      <button type="button" class="btn ghost" @click="load">Refresh</button>
    </template>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading loan…</p>

    <template v-else-if="loan">
      <section class="panel">
        <div class="row-between">
          <div>
            <h2 style="margin: 0">Loan #{{ loan.id }}</h2>
            <p class="muted">
              <RouterLink v-if="loan.customer" :to="`/customers/${loan.customer.id}`">
                {{ loan.customer.name }}
              </RouterLink>
              <span v-else>Customer #{{ loan.customer_id }}</span>
              · {{ loan.loan_product?.name ?? `Product #${loan.loan_product_id}` }}
            </p>
          </div>
          <StatusBadge :status="loan.status" />
        </div>
        <div class="grid-2" style="margin-top: 0.85rem">
          <div>
            <p class="muted" style="margin: 0; font-size: 0.8rem; font-weight: 700; text-transform: uppercase">
              Principal
            </p>
            <p class="mono" style="margin: 0.25rem 0 0; font-size: 1.35rem; font-weight: 700">
              {{ loan.principal_amount }} {{ loan.currency }}
            </p>
          </div>
          <div>
            <p class="muted" style="margin: 0; font-size: 0.8rem; font-weight: 700; text-transform: uppercase">
              Timeline
            </p>
            <p class="muted" style="margin: 0.25rem 0 0; font-size: 0.92rem">
              Approved {{ loan.approved_at ?? '—' }} · Disbursed {{ loan.disbursed_at ?? '—' }} ·
              Closed {{ loan.closed_at ?? '—' }}
            </p>
          </div>
        </div>
      </section>

      <section class="panel" style="margin-top: 0.85rem">
        <h2 style="margin: 0 0 0.65rem; font-size: 1.15rem">Actions</h2>
        <div class="row-between">
          <button type="button" class="btn" :disabled="busy || !canApprove" @click="onApprove">
            Approve + schedule
          </button>
          <button type="button" class="btn" :disabled="busy || !canDisburse" @click="onDisburse">
            {{ loan.status === 'disbursement_requested' ? 'Retry disburse' : 'Disburse B2C' }}
          </button>
        </div>
        <div v-if="canCollect" class="form-grid" style="margin-top: 0.85rem">
          <label>
            Collect amount (STK / Payment Intent)
            <input v-model="collectAmount" type="number" min="1" step="0.01" />
          </label>
          <button type="button" class="btn" :disabled="busy || !collectAmount" @click="onCollect">
            Create intent + STK
          </button>
        </div>
        <p v-else class="muted" style="margin-top: 0.75rem">
          Collection unlocks when the loan is <strong>active</strong> (after successful disbursement).
        </p>
        <p v-if="actionError" class="banner error" style="margin-top: 0.75rem">{{ actionError }}</p>
        <p v-if="actionOk" class="banner" style="margin-top: 0.75rem">{{ actionOk }}</p>
      </section>

      <section class="panel" style="margin-top: 0.85rem">
        <h2 style="margin: 0 0 0.65rem; font-size: 1.15rem">Installments</h2>
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

      <section class="panel" style="margin-top: 0.85rem">
        <h2 style="margin: 0 0 0.65rem; font-size: 1.15rem">Disbursements</h2>
        <p v-if="!loan.disbursements?.length" class="muted">No disbursement attempts yet.</p>
        <template v-else>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>UUID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in loan.disbursements" :key="d.id">
                  <td class="mono">{{ d.uuid.slice(0, 8) }}…</td>
                  <td class="mono">{{ d.amount }}</td>
                  <td><StatusBadge :status="d.status" /></td>
                  <td class="muted">{{ d.error_message ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="latestDisbursement?.status === 'failed'" class="banner error" style="margin-top: 0.75rem">
            Last disbursement failed — use Retry disburse above.
          </p>
        </template>
      </section>

      <section class="panel" style="margin-top: 0.85rem">
        <h2 style="margin: 0 0 0.65rem; font-size: 1.15rem">Payment intents</h2>
        <p v-if="intents.length === 0" class="muted">No collection attempts yet.</p>
        <div v-else class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>UUID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Checkout (meta)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="intent in intents" :key="intent.uuid">
                <td class="mono">{{ intent.uuid.slice(0, 8) }}…</td>
                <td class="mono">{{ intent.amount }}</td>
                <td><StatusBadge :status="intent.status" /></td>
                <td class="mono muted">{{ intent.checkout_request_id ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="muted" style="margin-top: 0.75rem; font-size: 0.92rem">
          With <code>DARAJA_FAKE=true</code>, STK is simulated. Simulate a callback with
          <code>POST /webhooks/daraja/stk</code> using the checkout id, or use Recon for unmatched cases.
        </p>
      </section>
    </template>
  </OpsShell>
</template>
