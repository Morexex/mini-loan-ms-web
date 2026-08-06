<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const steps = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursement_requested', label: 'Disbursing' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
]

const activeIndex = computed(() => {
  const map: Record<string, number> = {
    pending: 0,
    approved: 1,
    disbursement_requested: 2,
    disbursed: 3,
    active: 3,
    completed: 4,
    closed: 4,
  }
  return map[props.status] ?? 0
})
</script>

<template>
  <ol class="stepper" aria-label="Loan lifecycle">
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      :class="{
        done: index < activeIndex,
        current: index === activeIndex,
      }"
    >
      <span class="dot" />
      <span class="label">{{ step.label }}</span>
    </li>
  </ol>
</template>

<style scoped>
.stepper {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.35rem;
}

li {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
  position: relative;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

li:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 7px;
  left: calc(50% + 10px);
  width: calc(100% - 20px);
  height: 2px;
  background: var(--line);
}

li.done:not(:last-child)::after,
li.current:not(:last-child)::after {
  background: var(--accent);
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--line-strong);
  background: #fff;
  z-index: 1;
  transition:
    background 0.3s var(--ease),
    border-color 0.3s var(--ease),
    transform 0.3s var(--ease);
}

li.done .dot {
  background: var(--accent);
  border-color: var(--accent);
}

li.current .dot {
  border-color: var(--accent);
  background: #fff;
  box-shadow: 0 0 0 4px var(--accent-soft);
  transform: scale(1.1);
}

li.done,
li.current {
  color: var(--accent-deep);
}

@media (max-width: 720px) {
  .label {
    display: none;
  }
}
</style>
