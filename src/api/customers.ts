import { api } from '@/api/client'
import type { Customer, Paginated } from '@/types'

export async function listCustomers(params?: {
  search?: string
  per_page?: number
}): Promise<Paginated<Customer>> {
  const { data } = await api.get<Paginated<Customer>>('/api/v1/customers', { params })
  return data
}

export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await api.get<{ data: Customer }>(`/api/v1/customers/${id}`)
  return data.data
}

export async function createCustomer(payload: {
  name: string
  phone: string
  id_number: string
  email?: string | null
}): Promise<Customer> {
  const { data } = await api.post<{ data: Customer }>('/api/v1/customers', payload)
  return data.data
}
