export interface OpsUser {
  id: number
  name: string
  email: string
}

export interface WebhookLogItem {
  id: number
  provider: string
  idempotency_key: string | null
  processing_status: string
  error_message: string | null
  payload: Record<string, unknown>
  created_at: string | null
}

export interface PaymentIntentItem {
  id: number
  uuid: string
  customer_id: number
  loan_id: number
  amount: string
  phone: string
  status: string
  attempt_number: number
  expires_at: string | null
  submitted_at: string | null
  merchant_request_id: string | null
  checkout_request_id: string | null
  created_at: string | null
}

export interface UnmatchedQueueResponse {
  data: {
    unmatched_webhooks: WebhookLogItem[]
    expired_intents: PaymentIntentItem[]
  }
  meta: {
    unmatched_webhooks: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}
