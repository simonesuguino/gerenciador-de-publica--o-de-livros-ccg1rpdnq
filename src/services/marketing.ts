import pb from '@/lib/pocketbase/client'
import type { MarketingPostRecord, MarketingStatus } from '@/types/book'

export async function getMarketingPosts(bookId: string): Promise<MarketingPostRecord[]> {
  try {
    return await pb.collection('marketing_posts').getFullList<MarketingPostRecord>({
      filter: `book_id = "${bookId}"`,
      sort: '-created',
      requestKey: null,
    })
  } catch (err) {
    console.error('Erro ao buscar posts de marketing:', err)
    return []
  }
}

export async function createMarketingPost(
  bookId: string,
  data: {
    platform: string
    status: MarketingStatus
    scheduled_date?: string
    caption?: string
    notes?: string
  },
): Promise<MarketingPostRecord> {
  return await pb.collection('marketing_posts').create<MarketingPostRecord>({
    book_id: bookId,
    ...data,
  })
}

export async function updateMarketingPost(
  id: string,
  data: Partial<MarketingPostRecord>,
): Promise<MarketingPostRecord> {
  return await pb.collection('marketing_posts').update<MarketingPostRecord>(id, data)
}

export async function deleteMarketingPost(id: string): Promise<boolean> {
  try {
    await pb.collection('marketing_posts').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao deletar post de marketing:', err)
    return false
  }
}
