export function apiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    ?.response?.data

  if (response?.errors) {
    const messages = Object.values(response.errors).flat()
    if (messages.length) {
      return messages.join(' ')
    }
  }

  return response?.message ?? fallback
}
