import pb from '@/lib/pocketbase/client'
import type { ChecklistItemRecord } from '@/types/book'

export async function getChecklistItems(bookId: string): Promise<ChecklistItemRecord[]> {
  try {
    return await pb.collection('checklist_items').getFullList<ChecklistItemRecord>({
      filter: `book_id = "${bookId}"`,
      sort: 'position',
      requestKey: null,
    })
  } catch (err) {
    console.error('Erro ao buscar checklist:', err)
    return []
  }
}

export async function createChecklistItem(
  bookId: string,
  platform: string,
  link = '',
  notes = '',
): Promise<ChecklistItemRecord> {
  const current = await getChecklistItems(bookId)
  const position = current.length + 1

  return await pb.collection('checklist_items').create<ChecklistItemRecord>({
    book_id: bookId,
    platform,
    link,
    notes,
    completed: false,
    position,
  })
}

export async function updateChecklistItem(
  id: string,
  data: Partial<ChecklistItemRecord>,
): Promise<ChecklistItemRecord> {
  return await pb.collection('checklist_items').update<ChecklistItemRecord>(id, data)
}

export async function deleteChecklistItem(id: string): Promise<boolean> {
  try {
    await pb.collection('checklist_items').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao deletar item do checklist:', err)
    return false
  }
}
