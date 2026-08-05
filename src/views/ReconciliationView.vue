<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  extractEvidenceHints,
  fetchCandidateIntents,
  fetchUnmatchedQueue,
  matchEvidence,
  rejectEvidence,
} from '@/api/reconciliation'
import type { PaymentIntentItem, WebhookLogItem } from '@/types'

const auth = useAuthStore()
const router = useRouter()

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

async function onLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}

onMounted(loadQueue)
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div>
        <p class="brand">Mini Loan MS</p>
        <p class="sub">Manual reconciliation</p>
      </div>
      <div class="topbar-actions">
        <span class="operator">{{ auth.user?.email }}</span>
        <button type="button" class="ghost" @click="loadQueue">Refresh</button>
        <button type="button" class="ghost" @click="onLogout">Sign out</button>
      </div>
    </header>

    <main class="content">
      <section class="intro">
        <h1>Unmatched evidence</h1>
        <p>
          Review webhook payloads the automatic engine could not allocate. Matching always runs through
          the API allocation service — this UI never invents money math.
        </p>
      </section>

      <p v-if="error" class="banner error">{{ error }}</p>
      <p v-else-if="loading" class="banner">Loading queue…</p>

      <section v-else class="queue">
        <article v-if="webhooks.length === 0" class="empty">
          <h2>Queue clear</h2>
          <p>No unmatched webhook evidence right now.</p>
        </article>

        <article v-for="item in webhooks" :key="item.id" class="row">
          <div>
            <p class="provider">{{ item.provider }} · #{{ item.id }}</p>
            <p class="meta">
              <span class="mono">{{ extractEvidenceHints(item).phone ?? '—' }}</span>
              ·
              <span class="mono">{{ extractEvidenceHints(item).amount ?? '—' }}</span>
              ·
              <span class="mono">{{ extractEvidenceHints(item).receipt ?? 'no receipt' }}</span>
            </p>
            <p class="msg">{{ item.error_message }}</p>
          </div>
          <div class="row-actions">
            <button type="button" @click="openMatch(item)">Match</button>
            <button type="button" class="danger" @click="openReject(item)">Reject</button>
          </div>
        </article>
      </section>

      <section v-if="expiredIntents.length" class="expired">
        <h2>Recently expired intents</h2>
        <p class="hint">Useful candidates when a late callback arrives after TTL.</p>
        <ul>
          <li v-for="intent in expiredIntents" :key="intent.uuid">
            <span class="mono">{{ intent.uuid.slice(0, 8) }}</span>
            · loan {{ intent.loan_id }} ·
            <span class="mono">{{ intent.phone }}</span>
            ·
            <span class="mono">{{ intent.amount }}</span>
          </li>
        </ul>
      </section>
    </main>

    <aside v-if="selected && mode" class="drawer" aria-modal="true">
      <div class="drawer-panel">
        <header>
          <h2>{{ mode === 'match' ? 'Match evidence' : 'Reject evidence' }}</h2>
          <button type="button" class="ghost" @click="closePanel">Close</button>
        </header>

        <p class="drawer-meta">
          Webhook #{{ selected.id }} ·
          <span class="mono">{{ hints.phone ?? '—' }}</span>
          /
          <span class="mono">{{ hints.amount ?? '—' }}</span>
        </p>

        <template v-if="mode === 'match'">
          <label>
            Payment Intent
            <select v-model="selectedIntentUuid">
              <option disabled value="">Select candidate…</option>
              <option v-for="intent in candidates" :key="intent.uuid" :value="intent.uuid">
                {{ intent.status }} · loan {{ intent.loan_id }} · {{ intent.amount }} · {{ intent.phone }}
              </option>
            </select>
          </label>
        </template>

        <label>
          Reason
          <textarea v-model="reason" rows="4" placeholder="Required audit reason…" />
        </label>

        <p v-if="actionError" class="error">{{ actionError }}</p>

        <div class="drawer-actions">
          <button
            v-if="mode === 'match'"
            type="button"
            :disabled="busy"
            @click="submitMatch"
          >
            {{ busy ? 'Matching…' : 'Confirm match' }}
          </button>
          <button
            v-else
            type="button"
            class="danger"
            :disabled="busy"
            @click="submitReject"
          >
            {{ busy ? 'Rejecting…' : 'Confirm reject' }}
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 253, 248, 0.88);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
}

.brand {
  margin: 0;
  font-size: 1.45rem;
  color: var(--accent-deep);
}

.sub,
.operator,
.hint,
.msg,
.meta {
  color: var(--muted);
}

.sub {
  margin: 0.15rem 0 0;
  font-size: 0.92rem;
}

.topbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.content {
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.75rem 0 3rem;
}

.intro h1 {
  margin: 0;
  font-size: 2rem;
}

.intro p {
  max-width: 42rem;
  color: var(--muted);
}

.banner {
  padding: 0.85rem 1rem;
  background: var(--panel);
  border: 1px solid var(--line);
}

.banner.error,
.error {
  color: var(--danger);
  font-weight: 600;
}

.queue {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.row,
.empty,
.expired {
  background: var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  padding: 1rem 1.1rem;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.provider {
  margin: 0;
  font-weight: 700;
}

.meta,
.msg {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
}

.row-actions,
.drawer-actions,
.topbar-actions {
  display: flex;
  gap: 0.5rem;
}

button {
  border: 0;
  background: var(--accent);
  color: #f7fffc;
  padding: 0.55rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line);
}

button.danger {
  background: var(--danger);
}

.expired {
  margin-top: 1.5rem;
}

.expired h2,
.empty h2 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.expired ul {
  margin: 0.75rem 0 0;
  padding-left: 1.1rem;
}

.drawer {
  position: fixed;
  inset: 0;
  background: rgba(20, 32, 27, 0.35);
  display: grid;
  place-items: end;
}

.drawer-panel {
  width: min(440px, 100%);
  height: 100%;
  background: var(--panel);
  border-left: 1px solid var(--line);
  padding: 1.25rem;
  display: grid;
  align-content: start;
  gap: 0.9rem;
}

.drawer-panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-panel h2 {
  margin: 0;
  font-size: 1.35rem;
}

.drawer-meta {
  margin: 0;
  color: var(--muted);
}

label {
  display: grid;
  gap: 0.35rem;
  font-weight: 600;
}

select,
textarea {
  border: 1px solid var(--line);
  background: #fff;
  padding: 0.65rem 0.75rem;
  width: 100%;
}

@media (max-width: 720px) {
  .row {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
