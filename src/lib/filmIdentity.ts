import type { TmdbMovie } from '../types/tmdb';
import { movieTitle } from '../types/tmdb';

/** Restrained, reusable film-specific accents. These are presentation hints, not genre claims. */
export function filmIdentity(movie: TmdbMovie) {
  const genreIds = new Set(movie.genre_ids ?? (movie.genres ?? []).map((genre) => genre.id));
  const identity = `${movieTitle(movie).toLowerCase()} ${(movie.genres ?? []).map((genre) => genre.name.toLowerCase()).join(' ')}`;
  if (identity.includes('dune') || identity.includes('desert') || identity.includes('western')) return { accent: '#e6b66b', glow: '#8c542b', base: '#17100b', label: 'DESERT RELIC' };
  if (genreIds.has(27) || genreIds.has(53) || /horror|thriller|terror|nightmare|conjuring|scream|it:/.test(identity)) return { accent: '#d65b58', glow: '#4b171e', base: '#09090d', label: 'MIDNIGHT PASS' };
  if (genreIds.has(10749) || /romance|romantic|love|pride and prejudice|notebook/.test(identity)) return { accent: '#d99aab', glow: '#642b43', base: '#160b12', label: 'LOVE LETTER' };
  if (genreIds.has(80) || /batman|joker|dark knight|noir|crime/.test(identity)) return { accent: '#b7c4d6', glow: '#263449', base: '#080c13', label: 'NOIR ARCHIVE' };
  if (genreIds.has(878) || genreIds.has(14) || /science fiction|fantasy/.test(identity)) return { accent: '#9eabff', glow: '#303b7b', base: '#090c1a', label: 'OTHER WORLDS' };
  return { accent: '#f2a33a', glow: '#8b4c1d', base: '#0b0a10', label: 'CINEMA MEMORY' };
}
