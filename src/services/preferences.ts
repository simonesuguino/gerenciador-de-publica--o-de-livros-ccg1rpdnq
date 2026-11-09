import pb from '@/lib/pocketbase/client'
import type { ThemeMode, AccentColor, UserPreferencesRecord } from '@/types/book'

export async function getPreferences(userId: string): Promise<UserPreferencesRecord | null> {
  try {
    const records = await pb.collection('user_preferences').getFullList<UserPreferencesRecord>({
      filter: `user_id = "${userId}"`,
      requestKey: null,
    })
    return records.length > 0 ? records[0] : null
  } catch (err) {
    console.error('Erro ao buscar preferências:', err)
    return null
  }
}

export async function savePreferences(
  userId: string,
  existingId: string | null,
  data: { theme_mode: ThemeMode; accent_color: AccentColor },
): Promise<UserPreferencesRecord | null> {
  try {
    if (existingId) {
      return await pb.collection('user_preferences').update<UserPreferencesRecord>(existingId, data)
    }
    return await pb.collection('user_preferences').create<UserPreferencesRecord>({
      user_id: userId,
      ...data,
    })
  } catch (err) {
    console.error('Erro ao salvar preferências:', err)
    return null
  }
}
