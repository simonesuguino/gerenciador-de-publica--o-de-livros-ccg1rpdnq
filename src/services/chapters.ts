import pb from '@/lib/pocketbase/client'
import type { ChapterRecord, RecordingStatus } from '@/types/book'

export async function getChapters(bookId: string): Promise<ChapterRecord[]> {
  try {
    return await pb.collection('chapters').getFullList<ChapterRecord>({
      filter: `book_id = "${bookId}"`,
      sort: 'position',
      requestKey: null,
    })
  } catch (err) {
    console.error('Erro ao buscar capítulos:', err)
    return []
  }
}

export async function getChapterById(id: string): Promise<ChapterRecord | null> {
  try {
    return await pb.collection('chapters').getOne<ChapterRecord>(id, {
      requestKey: null,
    })
  } catch (err) {
    console.error('Erro ao buscar capítulo por id:', err)
    return null
  }
}

export async function createChapter(
  bookId: string,
  title: string,
  position: number,
): Promise<ChapterRecord> {
  return await pb.collection('chapters').create<ChapterRecord>({
    book_id: bookId,
    title,
    position,
    content: '',
    narration_script: '',
    recording_status: 'pendente' as RecordingStatus,
  })
}

export async function updateChapter(
  id: string,
  data: Partial<ChapterRecord>,
): Promise<ChapterRecord> {
  return await pb.collection('chapters').update<ChapterRecord>(id, data)
}

export async function deleteChapter(id: string): Promise<boolean> {
  try {
    await pb.collection('chapters').delete(id)
    return true
  } catch (err) {
    console.error('Erro ao deletar capítulo:', err)
    return false
  }
}

export async function reorderChapters(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]
    await pb.collection('chapters').update(id, { position: i + 1 })
  }
}
