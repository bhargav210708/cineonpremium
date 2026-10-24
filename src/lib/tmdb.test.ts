import { describe, expect, it } from 'vitest';
import { movieTitle, movieYear } from '../types/tmdb';
import type { TmdbMovie } from '../types/tmdb';
const movie: TmdbMovie = { id: 1, title: 'Cinema Test', overview: '', poster_path: null, backdrop_path: null, release_date: '2024-04-12', vote_average: 7.8 };
describe('TMDB movie helpers', () => {
  it('reads a movie title', () => expect(movieTitle(movie)).toBe('Cinema Test'));
  it('reads the release year', () => expect(movieYear(movie)).toBe('2024'));
  it('handles missing dates', () => expect(movieYear({ ...movie, release_date: undefined })).toBe(''));
});
