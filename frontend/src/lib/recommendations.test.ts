import { describe, expect, it } from 'vitest';
import { rankRecommendations } from './recommendations';

const track = (id: number, artist: string, genres: string[], playCount = 0) => ({ id, artist, genres, playCount });

describe('rankRecommendations', () => {
  it('prioritizes related artists and genres without repeating liked tracks', () => {
    const tracks = [
      track(1, 'Seed Artist', ['ambient']),
      track(2, 'Seed Artist', ['rock']),
      track(3, 'Other Artist', ['ambient']),
      track(4, 'Unrelated Artist', ['pop'], 1000),
    ];

    expect(rankRecommendations(tracks, [1], 3).map((item) => item.id)).toEqual([2, 3, 4]);
  });

  it('keeps stable catalog order when there are no seeds', () => {
    const tracks = [track(1, 'A', ['ambient']), track(2, 'B', ['rock'])];

    expect(rankRecommendations(tracks, [], 2).map((item) => item.id)).toEqual([1, 2]);
  });

  it('uses listening history as a lower-priority preference signal', () => {
    const tracks = [
      track(1, 'History Artist', ['ambient']),
      track(2, 'Other Artist', ['ambient']),
      track(3, 'Unrelated Artist', ['pop']),
    ];

    expect(rankRecommendations(tracks, [], [1], 2).map((item) => item.id)).toEqual([2, 3]);
  });
});
