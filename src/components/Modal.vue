<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  subtitle?: string
  wide?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="emit('close')"
      >
        <div class="dialog" :class="{ wide }">
          <header class="dialog-head">
            <div>
              <h2>{{ title }}</h2>
              <p v-if="subtitle" class="muted">{{ subtitle }}</p>
            </div>
            <button type="button" class="btn ghost sm" aria-label="Close" @click="emit('close')">
              Close
            </button>
          </header>
          <div class="dialog-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="dialog-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(12, 31, 26, 0.45);
  backdrop-filter: blur(6px);
}

.dialog {
  width: min(480px, 100%);
  max-height: min(88vh, 820px);
  overflow: auto;
  background: var(--panel-elevated);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow-modal);
}

.dialog.wide {
  width: min(640px, 100%);
}

.dialog-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.2rem 1.25rem 0.85rem;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  background: var(--panel-elevated);
  z-index: 1;
}

.dialog-head h2 {
  margin: 0;
  font-size: 1.35rem;
}

.dialog-head .muted {
  margin: 0.25rem 0 0;
  font-size: 0.92rem;
}

.dialog-body {
  padding: 1.15rem 1.25rem 1.35rem;
}

.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.9rem 1.25rem 1.15rem;
  border-top: 1px solid var(--line);
  position: sticky;
  bottom: 0;
  background: var(--panel-elevated);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.28s var(--ease);
}

.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.32s var(--ease), opacity 0.32s var(--ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .dialog,
.modal-leave-to .dialog {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
</style>
