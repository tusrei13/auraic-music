import { getJamendoTracks, JamendoSong } from './jamendo.service'

export interface MoodDefinition {
  id: string
  title: string
  description: string
  tags: string
  color: string
  gradient: string
  icon: string
}

export const MOOD_DEFINITIONS: Record<string, MoodDefinition> = {
  chill: {
    id: 'chill',
    title: 'Chill & Relax',
    description: 'Âm thanh êm dịu, nhịp điệu nhẹ nhàng giúp giải tỏa căng thẳng',
    tags: 'chillout+relax+lofi+ambient',
    color: '#10b981',
    gradient: 'from-teal-500 to-emerald-700',
    icon: 'Coffee'
  },
  focus: {
    id: 'focus',
    title: 'Deep Focus & Study',
    description: 'Nhạc không lời, ambient và piano tối ưu hóa sự tập trung cao độ',
    tags: 'instrumental+ambient+classical',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-700',
    icon: 'Brain'
  },
  energetic: {
    id: 'energetic',
    title: 'High Energy Boost',
    description: 'Tiết tấu sôi động, giai điệu bùng nổ tiếp thêm năng lượng tích cực',
    tags: 'rock+dance+upbeat+electronic',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    icon: 'Zap'
  },
  melancholic: {
    id: 'melancholic',
    title: 'Melancholy & Nostalgia',
    description: 'Những giai điệu sâu lắng, chất chứa cảm xúc và hoài niệm',
    tags: 'sad+acoustic+piano+slow',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-slate-800',
    icon: 'CloudRain'
  },
  night: {
    id: 'night',
    title: 'Late Night Vibe',
    description: 'Không gian âm nhạc huyền ảo, synthwave và lofi cho màn đêm tĩnh lặng',
    tags: 'synthwave+night+dark+lofi',
    color: '#6366f1',
    gradient: 'from-indigo-600 to-purple-900',
    icon: 'Moon'
  },
  workout: {
    id: 'workout',
    title: 'Workout & Fitness',
    description: 'Nhịp bass dồn dập, tiết tấu mạnh mẽ thúc đẩy buổi tập luyện hăng say',
    tags: 'fitness+cardio+house+edm',
    color: '#f43f5e',
    gradient: 'from-rose-500 to-red-700',
    icon: 'Flame'
  }
}

export function getAllMoods(): MoodDefinition[] {
  return Object.values(MOOD_DEFINITIONS)
}

export async function getTracksForMood(
  moodId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ mood: MoodDefinition; tracks: JamendoSong[] }> {
  const mood = MOOD_DEFINITIONS[moodId.toLowerCase()]
  if (!mood) {
    throw new Error(`Mood '${moodId}' is not recognized`)
  }

  const limit = options.limit || 24
  const offset = options.offset || 0

  const tracks = await getJamendoTracks({
    tags: mood.tags,
    limit,
    offset,
    order: 'popularity_total'
  })

  return { mood, tracks }
}
