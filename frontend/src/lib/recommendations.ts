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

export const rankRecommendations = <T extends RecommendationTrack>(tracks: T[], likedIds: Array<string | number>, listenedIdsOrLimit: Array<string | number> | number = [], requestedLimit = 8): T[] => {
  const listenedIds = Array.isArray(listenedIdsOrLimit) ? listenedIdsOrLimit : [];
  const limit = typeof listenedIdsOrLimit === 'number' ? listenedIdsOrLimit : requestedLimit;
  const liked = new Set(likedIds.map(String));
  const listened = new Set(listenedIds.map(String));
  const seeds = tracks.filter((track) => liked.has(String(track.id)) || listened.has(String(track.id)));
  const likedArtists = new Set(tracks.filter((track) => liked.has(String(track.id))).map((track) => artistKey(track.artist)).filter(Boolean));
  const listenedArtists = new Set(tracks.filter((track) => listened.has(String(track.id))).map((track) => artistKey(track.artist)).filter(Boolean));
  const seedArtists = new Set(seeds.map((track) => artistKey(track.artist)).filter(Boolean));
  const seedGenres = new Set(seeds.flatMap((track) => [...genreKeys(track)]));

  return tracks
    .filter((track) => !liked.has(String(track.id)) && !listened.has(String(track.id)))
    .map((track, index) => {
      const artistScore = likedArtists.has(artistKey(track.artist)) ? 4 : listenedArtists.has(artistKey(track.artist)) ? 2 : seedArtists.has(artistKey(track.artist)) ? 2 : 0;
      const genreScore = [...genreKeys(track)].filter((genre) => seedGenres.has(genre)).length * 2;
      const popularityScore = Math.min(Math.max(track.playCount || 0, 0), 1000) / 1000;
      return { track, score: artistScore + genreScore + popularityScore, index };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ track }) => track);
};
