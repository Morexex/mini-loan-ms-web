<script setup lang="ts">
defineProps<{ status: string | null | undefined }>()

const tone = (status?: string | null): string => {
  const s = status ?? ''
  if (['active', 'completed', 'posted', 'paid', 'disbursed', 'processed'].includes(s)) return 'ok'
  if (
    [
      'pending',
      'approved',
      'scheduled',
      'submitted',
      'awaiting_callback',
      'matched',
      'disbursement_requested',
    ].includes(s)
  )
    return 'warn'
  if (['failed', 'expired', 'overdue', 'unmatched', 'cancelled'].includes(s)) return 'danger'
  if (['partially_paid'].includes(s)) return 'info'
  return 'neutral'
}
</script>

<template>
  <span class="badge" :data-tone="tone(status)">{{ status ?? '—' }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.badge[data-tone='ok'] {
  color: var(--ok);
  background: var(--ok-soft);
  border-color: rgba(6, 118, 71, 0.2);
}

.badge[data-tone='warn'] {
  color: var(--warn);
  background: var(--warn-soft);
  border-color: rgba(154, 103, 0, 0.22);
}

.badge[data-tone='danger'] {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: rgba(180, 35, 24, 0.22);
}

.badge[data-tone='info'] {
  color: var(--info);
  background: var(--info-soft);
  border-color: rgba(23, 92, 211, 0.2);
}

.badge[data-tone='neutral'] {
  color: var(--muted);
  background: #eef1ef;
  border-color: var(--line);
}
</style>
