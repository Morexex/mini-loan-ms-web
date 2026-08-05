import { api } from '@/api/client'

export interface ReportOverview {
  as_of: string
  loans: { active: number; completed: number; pending: number }
  outstanding_balance: string
  payments: {
    today: { count: number; amount: string }
    mtd: { count: number; amount: string }
  }
  reconciliation: {
    unmatched_webhooks: number
    expired_intents: number
    open_intents: number
  }
  wallet_liability: string
}

export interface AgingBucket {
  key: string
  label: string
  count: number
  amount: string
}

export interface ReportAging {
  as_of: string
  as_of_date: string
  buckets: AgingBucket[]
  total_outstanding: string
}

export async function fetchOverview(): Promise<ReportOverview> {
  const { data } = await api.get<{ data: ReportOverview }>('/api/v1/reports/overview')
  return data.data
}

export async function fetchAging(): Promise<ReportAging> {
  const { data } = await api.get<{ data: ReportAging }>('/api/v1/reports/aging')
  return data.data
}
