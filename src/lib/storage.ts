import type { TmdbMovie } from '../types/tmdb';
const WATCHLIST_KEY = 'cinetribe.watchlist.v1';
const HISTORY_KEY = 'cinetribe.card-exports.v1';
export function readWatchlist(): TmdbMovie[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]'); return Array.isArray(value) ? value as TmdbMovie[] : []; }
  catch { return []; }
}
export function toggleWatchlist(movie: TmdbMovie): TmdbMovie[] {
  const current = readWatchlist();
  const next = current.some(item => item.id === movie.id) ? current.filter(item => item.id !== movie.id) : [movie, ...current];
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); return next;
}
export function recordCardExport(title: string, format: string) {
  try { const history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as { title: string; format: string; at: string }[]; history.unshift({ title, format, at: new Date().toISOString() }); localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500))); } catch { /* Stats history is best-effort. */ }
}
