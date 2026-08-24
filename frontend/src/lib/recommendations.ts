export interface RecommendationTrack {
  id: string | number;
  artist?: string | { id?: string; name?: string } | null;
  genres?: string[];
  playCount?: number;
}

const artistKey = (artist: RecommendationTrack['artist']) => {
  if (!artist) return '';
  return typeof artist === 'string' ? artist.toLowerCase() : String(artist.id || artist.name || '').toLowerCase();
};

const genreKeys = (track: RecommendationTrack) => new Set((track.genres || []).map((genre) => genre.trim().toLowerCase()).filter(Boolean));

export const rankRecommendations = <T extends RecommendationTrack>(tracks: T[], likedIds: Array<string | number>, limit = 8): T[] => {
  const liked = new Set(likedIds.map(String));
  const seeds = tracks.filter((track) => liked.has(String(track.id)));
  const seedArtists = new Set(seeds.map((track) => artistKey(track.artist)).filter(Boolean));
  const seedGenres = new Set(seeds.flatMap((track) => [...genreKeys(track)]));

  return tracks
    .filter((track) => !liked.has(String(track.id)))
    .map((track, index) => {
      const artistScore = seedArtists.has(artistKey(track.artist)) ? 4 : 0;
      const genreScore = [...genreKeys(track)].filter((genre) => seedGenres.has(genre)).length * 2;
      const popularityScore = Math.min(Math.max(track.playCount || 0, 0), 1000) / 1000;
      return { track, score: artistScore + genreScore + popularityScore, index };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ track }) => track);
};
