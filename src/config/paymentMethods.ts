export type PaymentMethodKey = 'cartao_credito' | 'pix' | 'dinheiro' | 'a_prazo'

export type DebtPaymentMethodKey = 'cartao_credito' | 'pix' | 'dinheiro' | 'desconto_funcionario'

export const PAYMENT_LABELS: Record<PaymentMethodKey, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  a_prazo: 'À Prazo'
}

export const DEBT_PAYMENT_LABELS: Record<DebtPaymentMethodKey, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  desconto_funcionario: 'Descontar (Funcionário)'
}

/** Ordem de exibição no livro-caixa (mais líquido → mais a receber). */
export const CASHBOOK_METHOD_ORDER: PaymentMethodKey[] = [
  'pix',
  'dinheiro',
  'cartao_credito',
  'a_prazo'
]
