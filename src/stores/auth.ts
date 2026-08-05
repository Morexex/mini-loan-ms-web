import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, ensureCsrfCookie } from '@/api/client'
import type { OpsUser } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<OpsUser | null>(null)
  const bootstrapped = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  async function bootstrap(): Promise<void> {
    try {
      await ensureCsrfCookie()
      const { data } = await api.get<{ data: OpsUser }>('/api/v1/me')
      user.value = data.data
    } catch {
      user.value = null
    } finally {
      bootstrapped.value = true
    }
  }

  async function login(email: string, password: string): Promise<void> {
    error.value = null
    await ensureCsrfCookie()
    try {
      const { data } = await api.post<{ user: OpsUser }>('/api/v1/login', { email, password })
      user.value = data.user
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string; errors?: { email?: string[] } } } })?.response
          ?.data?.errors?.email?.[0] ??
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Login failed.'
      error.value = message
      throw e
    }
  }

  async function logout(): Promise<void> {
    await api.post('/api/v1/logout')
    user.value = null
  }

  return { user, bootstrapped, error, isAuthenticated, bootstrap, login, logout }
})
