import { CASHBOOK_METHOD_ORDER, PAYMENT_LABELS, type PaymentMethodKey } from '@/config/paymentMethods'
import type { CashbookEntries } from '@/types/api'

export interface PaymentMethodRow {
  key: PaymentMethodKey
  label: string
  orders: number
  debtPayments: number
  total: number
}

export function cashbookNum(v: unknown): number {
  if (v == null || v === '') return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function buildPaymentMethodRows(entries?: CashbookEntries | null): PaymentMethodRow[] {
  return CASHBOOK_METHOD_ORDER.map((key) => ({
    key,
    label: PAYMENT_LABELS[key],
    orders: cashbookNum(entries?.orders_by_method?.[key]),
    debtPayments:
      key === 'a_prazo'
        ? 0
        : cashbookNum(entries?.debt_payments_by_method?.[key]),
    total: cashbookNum(entries?.totals_by_method?.[key])
  }))
}

export function paymentMethodFooterTotals(rows: PaymentMethodRow[]) {
  return rows.reduce(
    (acc, row) => ({
      orders: acc.orders + row.orders,
      debtPayments: acc.debtPayments + row.debtPayments,
      total: acc.total + row.total
    }),
    { orders: 0, debtPayments: 0, total: 0 }
  )
}
