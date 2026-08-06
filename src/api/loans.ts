import { api } from '@/api/client'
import type { Loan, Paginated, PaymentIntentItem } from '@/types'

export async function listLoans(params?: {
  status?: string
  customer_id?: number
  per_page?: number
}): Promise<Paginated<Loan>> {
  const { data } = await api.get<Paginated<Loan>>('/api/v1/loans', { params })
  return data
}

export async function getLoan(id: number): Promise<Loan> {
  const { data } = await api.get<{ data: Loan }>(`/api/v1/loans/${id}`)
  return data.data
}

export async function createLoan(payload: {
  customer_id: number
  loan_product_id: number
  principal_amount: number | string
  currency?: string
}): Promise<Loan> {
  const { data } = await api.post<{ data: Loan }>('/api/v1/loans', payload)
  return data.data
}

export async function approveLoan(id: number): Promise<Loan> {
  const { data } = await api.post<{ data: Loan }>(`/api/v1/loans/${id}/approve`)
  return data.data
}

export async function disburseLoan(id: number): Promise<Loan> {
  const { data } = await api.post<{ data: Loan }>(`/api/v1/loans/${id}/disburse`)
  return data.data
}

export async function listPaymentIntents(loanId: number): Promise<PaymentIntentItem[]> {
  const { data } = await api.get<{ data: PaymentIntentItem[] }>(
    `/api/v1/loans/${loanId}/payment-intents`,
  )
  return data.data
}

export async function createPaymentIntent(
  loanId: number,
  payload: { amount: number | string },
): Promise<PaymentIntentItem> {
  const { data } = await api.post<{ data: PaymentIntentItem }>(
    `/api/v1/loans/${loanId}/payment-intents`,
    payload,
  )
  return data.data
}

export async function simulateStkSuccess(
  loanId: number,
  intentUuid: string,
): Promise<PaymentIntentItem> {
  const { data } = await api.post<{ data: PaymentIntentItem }>(
    `/api/v1/loans/${loanId}/payment-intents/${intentUuid}/simulate-stk-success`,
  )
  return data.data
}
