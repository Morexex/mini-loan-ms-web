<script setup lang="ts">
defineProps<{ status: string | null | undefined }>()
</script>

<template>
  <span class="badge" :data-status="status ?? 'unknown'">{{ status ?? '—' }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.badge[data-status='active'],
.badge[data-status='completed'],
.badge[data-status='posted'],
.badge[data-status='paid'],
.badge[data-status='awaiting_callback'],
.badge[data-status='disbursed'] {
  border-color: #9fc9bf;
  color: var(--accent-deep);
  background: #eef8f4;
}

.badge[data-status='pending'],
.badge[data-status='approved'],
.badge[data-status='scheduled'],
.badge[data-status='submitted'] {
  border-color: #d6c89a;
  color: var(--warn);
  background: #fff8e8;
}

.badge[data-status='failed'],
.badge[data-status='expired'],
.badge[data-status='overdue'],
.badge[data-status='unmatched'] {
  border-color: #e0b4b4;
  color: var(--danger);
  background: #fff1f1;
}
</style>
