import axios from 'axios'

// Must use the same hostname as the browser SPA (localhost vs 127.0.0.1 are different hosts).
// Mismatch prevents Axios from reading the XSRF-TOKEN cookie → "CSRF token mismatch".
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  // Cross-origin (different port) still needs this so Axios sends X-XSRF-TOKEN.
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export async function ensureCsrfCookie(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}
