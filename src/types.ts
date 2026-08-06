export interface OpsUser {
  id: number
  name: string
  email: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  id_number: string
  email: string | null
  wallet?: { balance: string; currency: string } | null
  created_at: string | null
  updated_at: string | null
}

export interface LoanProduct {
  id: number
  name: string
  interest_model: string
  interest_rate: string
  term_unit: string
  term_length: number
  fee_amount: string
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

export interface Installment {
  id: number
  sequence: number
  due_date: string | null
  principal_due: string
  interest_due: string
  fee_due: string
  amount_due: string
  amount_paid: string
  status: string
}

export interface Disbursement {
  id: number
  uuid: string
  loan_id: number
  amount: string
  phone: string
  status: string
  requested_at: string | null
  completed_at: string | null
  daraja_conversation_id: string | null
  error_message: string | null
}

export interface Loan {
  id: number
  customer_id: number
  loan_product_id: number
  principal_amount: string
  currency: string
  status: string
  approved_at: string | null
  disbursed_at: string | null
  activated_at: string | null
  closed_at: string | null
  customer?: Customer
  loan_product?: LoanProduct
  installments?: Installment[]
  disbursements?: Disbursement[]
  created_at: string | null
  updated_at: string | null
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

export interface WebhookLogItem {
  id: number
  provider: string
  idempotency_key: string | null
  processing_status: string
  error_message: string | null
  payload: Record<string, unknown>
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

export interface Paginated<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links?: unknown
}
