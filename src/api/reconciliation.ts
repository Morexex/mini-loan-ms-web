import { api } from '@/api/client'
import type { PaymentIntentItem, UnmatchedQueueResponse, WebhookLogItem } from '@/types'

export async function fetchUnmatchedQueue(): Promise<UnmatchedQueueResponse> {
  const { data } = await api.get<UnmatchedQueueResponse>('/api/v1/reconciliation/unmatched')
  return data
}

export async function fetchCandidateIntents(phone?: string): Promise<PaymentIntentItem[]> {
  const { data } = await api.get<{ data: PaymentIntentItem[] }>(
    '/api/v1/reconciliation/candidate-intents',
    { params: phone ? { phone } : undefined },
  )
  return data.data
}

export async function matchEvidence(payload: {
  webhook_log_id: number
  payment_intent_uuid: string
  reason: string
}): Promise<void> {
  await api.post('/api/v1/reconciliation/matches', payload)
}

export async function rejectEvidence(payload: {
  webhook_log_id: number
  reason: string
}): Promise<void> {
  await api.post('/api/v1/reconciliation/rejects', payload)
}

export function extractEvidenceHints(item: WebhookLogItem): { phone?: string; amount?: string; receipt?: string } {
  const payload = item.payload ?? {}
  if (item.provider === 'daraja_stk') {
    const items = (payload as { Body?: { stkCallback?: { CallbackMetadata?: { Item?: Array<{ Name: string; Value: unknown }> } } } })
      ?.Body?.stkCallback?.CallbackMetadata?.Item ?? []
    const map = Object.fromEntries(items.map((i) => [i.Name, i.Value]))
    return {
      phone: map.PhoneNumber != null ? String(map.PhoneNumber) : undefined,
      amount: map.Amount != null ? String(map.Amount) : undefined,
      receipt: map.MpesaReceiptNumber != null ? String(map.MpesaReceiptNumber) : undefined,
    }
  }

  return {
    phone: (payload as { phone?: string }).phone,
    amount: (payload as { amount?: string | number }).amount != null
      ? String((payload as { amount: string | number }).amount)
      : undefined,
    receipt: (payload as { receipt?: string }).receipt,
  }
}
