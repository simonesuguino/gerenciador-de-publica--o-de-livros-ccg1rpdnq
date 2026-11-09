import pb from '@/lib/pocketbase/client'
import type { SaleRecord, SalesPlatform } from '@/types/book'

export async function getSales(bookId: string): Promise<SaleRecord[]> {
  try {
    return await pb.collection('sales').getFullList<SaleRecord>({
      filter: `book_id = "${bookId}"`,
      sort: '-sale_date',
      requestKey: null,
    })
  } catch (err) {
    console.error('Erro ao buscar vendas:', err)
    return []
  }
}

export async function createSale(
  bookId: string,
  data: {
    sale_date: string
    platform: SalesPlatform
    units: number
    revenue: number
    currency?: string
    notes?: string
  },
): Promise<SaleRecord> {
  return await pb.collection('sales').create<SaleRecord>({
    book_id: bookId,
    currency: 'BRL',
    ...data,
  })
}

export async function updateSale(id: string, data: Partial<SaleRecord>): Promise<SaleRecord> {
  return await pb.collection('sales').update<SaleRecord>(id, data)
}

export async function deleteSale(id: string): Promise<boolean> {
  try {
    await pb.collection('sales').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao deletar venda:', err)
    return false
  }
}
