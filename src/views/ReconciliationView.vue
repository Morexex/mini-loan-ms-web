<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import OpsShell from '@/components/OpsShell.vue'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import {
  extractEvidenceHints,
  fetchCandidateIntents,
  fetchUnmatchedQueue,
  matchEvidence,
  rejectEvidence,
} from '@/api/reconciliation'
import type { PaymentIntentItem, WebhookLogItem } from '@/types'

const loading = ref(true)
const error = ref<string | null>(null)
const webhooks = ref<WebhookLogItem[]>([])
const expiredIntents = ref<PaymentIntentItem[]>([])
const candidates = ref<PaymentIntentItem[]>([])

const selected = ref<WebhookLogItem | null>(null)
const selectedIntentUuid = ref('')
const reason = ref('')
const actionError = ref<string | null>(null)
const busy = ref(false)
const mode = ref<'match' | 'reject' | null>(null)

const hints = computed(() => (selected.value ? extractEvidenceHints(selected.value) : {}))
const modalOpen = computed(() => Boolean(selected.value && mode.value))

async function loadQueue(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const queue = await fetchUnmatchedQueue()
    webhooks.value = queue.data.unmatched_webhooks
    expiredIntents.value = queue.data.expired_intents
  } catch (e: unknown) {
    error.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Unable to load reconciliation queue.'
  } finally {
    loading.value = false
  }
}

async function openMatch(item: WebhookLogItem): Promise<void> {
  selected.value = item
  mode.value = 'match'
  reason.value = ''
  actionError.value = null
  selectedIntentUuid.value = ''
  const phone = extractEvidenceHints(item).phone
  candidates.value = await fetchCandidateIntents(phone)
}

function openReject(item: WebhookLogItem): void {
  selected.value = item
  mode.value = 'reject'
  reason.value = ''
  actionError.value = null
}

function closePanel(): void {
  selected.value = null
  mode.value = null
  actionError.value = null
}

async function submitMatch(): Promise<void> {
  if (!selected.value || !selectedIntentUuid.value || reason.value.trim().length < 5) {
    actionError.value = 'Select an intent and provide a reason (min 5 characters).'
    return
  }
  busy.value = true
  actionError.value = null
  try {
    await matchEvidence({
      webhook_log_id: selected.value.id,
      payment_intent_uuid: selectedIntentUuid.value,
      reason: reason.value.trim(),
    })
    closePanel()
    await loadQueue()
  } catch (e: unknown) {
    actionError.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Match failed.'
  } finally {
    busy.value = false
  }
}

async function submitReject(): Promise<void> {
  if (!selected.value || reason.value.trim().length < 5) {
    actionError.value = 'Provide a rejection reason (min 5 characters).'
    return
  }
  busy.value = true
  actionError.value = null
  try {
    await rejectEvidence({
      webhook_log_id: selected.value.id,
      reason: reason.value.trim(),
    })
    closePanel()
    await loadQueue()
  } catch (e: unknown) {
    actionError.value =
      (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      'Reject failed.'
  } finally {
    busy.value = false
  }
}

onMounted(loadQueue)
</script>

<template>
  <OpsShell title="Reconciliation" subtitle="Unmatched evidence">
    <template #actions>
      <button type="button" class="btn ghost" @click="loadQueue">Refresh</button>
    </template>
    <template #intro>
      <p class="muted">
        Review webhook payloads the automatic engine could not allocate. Matching always runs through
        the API — this UI never invents money math.
      </p>
    </template>

    <div class="grid-3 stats-row">
      <div class="stat">
        <p class="stat-label">Unmatched</p>
        <p class="stat-value">{{ loading ? '—' : webhooks.length }}</p>
      </div>
      <div class="stat">
        <p class="stat-label">Expired intents</p>
        <p class="stat-value">{{ loading ? '—' : expiredIntents.length }}</p>
      </div>
      <div class="stat accent-stat">
        <p class="stat-label">Queue</p>
        <p class="stat-value">{{ loading ? '…' : webhooks.length === 0 ? 'Clear' : 'Needs review' }}</p>
      </div>
    </div>

    <p v-if="error" class="banner error">{{ error }}</p>
    <p v-else-if="loading" class="banner">Loading queue…</p>

    <section v-else class="panel">
      <h2 class="panel-title">Unmatched webhooks</h2>
      <div v-if="webhooks.length === 0" class="empty">
        <strong>Queue clear</strong>
        No unmatched webhook evidence right now.
      </div>
      <div v-else class="queue">
        <article v-for="item in webhooks" :key="item.id" class="queue-row">
          <div>
            <div class="row-head">
              <strong>{{ item.provider }} · #{{ item.id }}</strong>
              <StatusBadge :status="item.processing_status" />
            </div>
            <p class="meta mono">
              {{ extractEvidenceHints(item).phone ?? '—' }}
              ·
              {{ extractEvidenceHints(item).amount ?? '—' }}
              ·
              {{ extractEvidenceHints(item).receipt ?? 'no receipt' }}
            </p>
            <p class="msg">{{ item.error_message }}</p>
          </div>
          <div class="row-actions">
            <button type="button" class="btn sm" @click="openMatch(item)">Match</button>
            <button type="button" class="btn danger sm" @click="openReject(item)">Reject</button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="expiredIntents.length" class="panel">
      <h2 class="panel-title">Recently expired intents</h2>
      <p class="muted tip">Useful candidates when a late callback arrives after TTL.</p>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>UUID</th>
              <th>Loan</th>
              <th>Phone</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="intent in expiredIntents" :key="intent.uuid">
              <td class="mono">{{ intent.uuid.slice(0, 8) }}…</td>
              <td class="mono">{{ intent.loan_id }}</td>
              <td class="mono">{{ intent.phone }}</td>
              <td class="mono">{{ intent.amount }}</td>
              <td><StatusBadge :status="intent.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Modal
      :open="modalOpen"
      :title="mode === 'match' ? 'Match evidence' : 'Reject evidence'"
      :subtitle="selected ? `Webhook #${selected.id} · ${hints.phone ?? '—'} / ${hints.amount ?? '—'}` : undefined"
      @close="closePanel"
    >
      <div class="form-grid">
        <template v-if="mode === 'match'">
          <label>
            Payment Intent
            <select v-model="selectedIntentUuid" class="field">
              <option disabled value="">Select candidate…</option>
              <option v-for="intent in candidates" :key="intent.uuid" :value="intent.uuid">
                {{ intent.status }} · loan {{ intent.loan_id }} · {{ intent.amount }} · {{ intent.phone }}
              </option>
            </select>
          </label>
        </template>
        <label>
          Reason
          <textarea v-model="reason" rows="4" class="field" placeholder="Required audit reason…" />
        </label>
        <p v-if="actionError" class="banner error">{{ actionError }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn ghost" @click="closePanel">Cancel</button>
        <button
          v-if="mode === 'match'"
          type="button"
          class="btn"
          :disabled="busy"
          @click="submitMatch"
        >
          {{ busy ? 'Matching…' : 'Confirm match' }}
        </button>
        <button
          v-else
          type="button"
          class="btn danger"
          :disabled="busy"
          @click="submitReject"
        >
          {{ busy ? 'Rejecting…' : 'Confirm reject' }}
        </button>
      </template>
    </Modal>
  </OpsShell>
</template>

<style scoped>
.stats-row {
  margin-bottom: 0.9rem;
}

.accent-stat {
  background: linear-gradient(145deg, #0d7a68, #085649);
  border: none;
}

.accent-stat .stat-label {
  color: rgba(244, 255, 251, 0.7);
}

.accent-stat .stat-value {
  color: #fff;
  font-size: 1.2rem;
}

.queue {
  display: grid;
  gap: 0.75rem;
}

.queue-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: linear-gradient(160deg, #fff, #f7faf8);
  transition: border-color 0.2s var(--ease), transform 0.2s var(--ease);
}

.queue-row:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.row-head {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.meta,
.msg,
.tip {
  margin: 0.3rem 0 0;
  font-size: 0.92rem;
  color: var(--muted);
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .queue-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
