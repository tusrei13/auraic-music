function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

// Semantic Tag and Keyword Vector Space
const SEMANTIC_INTENT_MAP: Record<string, { tags: string[]; boostWeight: number }> = {
  // Moods & Emotions
  'buon': { tags: ['sad', 'melancholic', 'acoustic', 'slow', 'emotional'], boostWeight: 1.5 },
  'sad': { tags: ['sad', 'melancholic', 'acoustic', 'slow', 'emotional'], boostWeight: 1.5 },
  'mua': { tags: ['rain', 'lofi', 'ambient', 'chillout', 'piano'], boostWeight: 1.4 },
  'rain': { tags: ['rain', 'lofi', 'ambient', 'chillout', 'piano'], boostWeight: 1.4 },
  'chill': { tags: ['chillout', 'relax', 'lofi', 'ambient'], boostWeight: 1.3 },
  'thu gian': { tags: ['relax', 'chillout', 'calm', 'peaceful'], boostWeight: 1.3 },
  'relax': { tags: ['relax', 'chillout', 'calm', 'peaceful'], boostWeight: 1.3 },
  'vui': { tags: ['happy', 'upbeat', 'dance', 'pop'], boostWeight: 1.4 },
  'happy': { tags: ['happy', 'upbeat', 'dance', 'pop'], boostWeight: 1.4 },
  
  // Activities & Contexts
  'hoc': { tags: ['study', 'focus', 'instrumental', 'piano', 'ambient'], boostWeight: 1.4 },
  'study': { tags: ['study', 'focus', 'instrumental', 'piano', 'ambient'], boostWeight: 1.4 },
  'coding': { tags: ['focus', 'synthwave', 'electronic', 'lofi', 'ambient'], boostWeight: 1.5 },
  'code': { tags: ['focus', 'synthwave', 'electronic', 'lofi', 'ambient'], boostWeight: 1.5 },
  'tap the duc': { tags: ['workout', 'fitness', 'cardio', 'edm', 'energetic'], boostWeight: 1.5 },
  'workout': { tags: ['workout', 'fitness', 'cardio', 'edm', 'energetic'], boostWeight: 1.5 },
  'gym': { tags: ['workout', 'fitness', 'cardio', 'edm', 'energetic'], boostWeight: 1.5 },
  'ngu': { tags: ['sleep', 'ambient', 'soft', 'calm', 'meditation'], boostWeight: 1.4 },
  'sleep': { tags: ['sleep', 'ambient', 'soft', 'calm', 'meditation'], boostWeight: 1.4 },
  'lai xe': { tags: ['roadtrip', 'rock', 'pop', 'driving', 'synthwave'], boostWeight: 1.3 },
  'drive': { tags: ['roadtrip', 'rock', 'pop', 'driving', 'synthwave'], boostWeight: 1.3 },
  'dem': { tags: ['night', 'synthwave', 'dark', 'lofi', 'deep'], boostWeight: 1.4 },
  'night': { tags: ['night', 'synthwave', 'dark', 'lofi', 'deep'], boostWeight: 1.4 },
  
  // Genres & Instruments
  'guitar': { tags: ['acoustic', 'guitar', 'fingerstyle', 'folk'], boostWeight: 1.4 },
  'piano': { tags: ['piano', 'classical', 'soundtrack', 'melodic'], boostWeight: 1.4 },
  'khong loi': { tags: ['instrumental', 'soundtrack', 'ambient'], boostWeight: 1.5 },
  'instrumental': { tags: ['instrumental', 'soundtrack', 'ambient'], boostWeight: 1.5 }
}

export function extractSemanticTags(naturalQuery: string): { expandedTags: string[]; semanticKeywords: string[] } {
  const rawNormalized = naturalQuery.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .trim()

  const asciiNormalized = removeVietnameseDiacritics(rawNormalized)

  const detectedTags = new Set<string>()
  const detectedKeywords = new Set<string>()

  for (const [intentKey, data] of Object.entries(SEMANTIC_INTENT_MAP)) {
    if (rawNormalized.includes(intentKey) || asciiNormalized.includes(intentKey)) {
      data.tags.forEach(t => detectedTags.add(t))
      detectedKeywords.add(intentKey)
    }
  }

  // Also include original words as keywords
  const words = rawNormalized.split(/\s+/).filter(w => w.length > 1)
  words.forEach(w => detectedKeywords.add(w))

  return {
    expandedTags: Array.from(detectedTags),
    semanticKeywords: Array.from(detectedKeywords)
  }
}

export function computeCosineSimilarity(queryTokens: string[], itemTokens: string[]): number {
  if (queryTokens.length === 0 || itemTokens.length === 0) return 0

  const querySet = new Set(queryTokens.map(t => t.toLowerCase()))
  const itemSet = new Set(itemTokens.map(t => t.toLowerCase()))

  let intersectionCount = 0
  for (const token of querySet) {
    if (itemSet.has(token)) {
      intersectionCount += 1
    }
  }

  // Cosine distance approximation using Jaccard/Overlap index
  const denominator = Math.sqrt(querySet.size) * Math.sqrt(itemSet.size)
  return denominator > 0 ? intersectionCount / denominator : 0
}
