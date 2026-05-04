import { apiClient } from './client'
import type { CashOutflow } from '@/types/api'

export class CashOutflowsService {
  async list(params: { date: string }): Promise<CashOutflow[]> {
    const q = new URLSearchParams()
    q.append('date', params.date)
    const res = await apiClient.get<CashOutflow[] | { data?: CashOutflow[] }>(
      `/cash-outflows?${q.toString()}`
    )
    if (Array.isArray(res)) return res
    return res?.data ?? []
  }

  async create(body: {
    amount: number
    note?: string | null
    spent_at?: string | null
  }): Promise<CashOutflow> {
    return await apiClient.post<CashOutflow>('/cash-outflows', body)
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/cash-outflows/${id}`)
  }
}

export const cashOutflowsService = new CashOutflowsService()
export default cashOutflowsService
