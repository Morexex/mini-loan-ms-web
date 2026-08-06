import { api } from '@/api/client'
import type { LoanProduct, Paginated } from '@/types'

export async function listProducts(params?: {
  is_active?: boolean
  per_page?: number
}): Promise<Paginated<LoanProduct>> {
  const { data } = await api.get<Paginated<LoanProduct>>('/api/v1/loan-products', { params })
  return data
}

export async function createProduct(payload: {
  name: string
  interest_model: string
  interest_rate: number | string
  term_unit: string
  term_length: number
  fee_amount?: number | string
  is_active?: boolean
}): Promise<LoanProduct> {
  const { data } = await api.post<{ data: LoanProduct }>('/api/v1/loan-products', payload)
  return data.data
}
