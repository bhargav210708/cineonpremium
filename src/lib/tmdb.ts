import type { TmdbMovie, TmdbResponse } from '../types/tmdb';

const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;
const USE_SERVER_PROXY = import.meta.env.PROD;

export class TmdbError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); this.name = 'TmdbError'; }
}

async function request<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  if (!USE_SERVER_PROXY && (!TOKEN?.trim() || TOKEN.includes('your_tmdb'))) {
    throw new TmdbError('TMDB is not configured for local development. Add VITE_TMDB_TOKEN to .env.local. For Vercel production, set the server-only TMDB_READ_ACCESS_TOKEN environment variable.');
  }
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  // Production browsers talk to Cinéon's same-origin Vercel function, avoiding
  // direct browser-to-TMDB connectivity problems on some carrier networks.
  // Local Vite development keeps the direct request so no serverless runtime is needed.
  const proxyParams = new URLSearchParams(url.searchParams);
  proxyParams.set('path', path);
  const response = USE_SERVER_PROXY
    ? await fetch(`/api/tmdb?${proxyParams.toString()}`, { headers: { accept: 'application/json' } })
    : await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' } });
  if (!response.ok) {
    let message = `TMDB request failed (${response.status}).`;
    try { const body = await response.json() as { status_message?: string }; message = body.status_message ?? message; } catch { /* Keep the HTTP error message. */ }
    throw new TmdbError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const tmdb = {
  trending: (page = 1) => request<TmdbResponse<TmdbMovie>>('/trending/movie/week', { page }),
  nowPlayingIndia: (page = 1) => request<TmdbResponse<TmdbMovie>>('/movie/now_playing', { page, region: 'IN' }),
  upcomingIndia: (page = 1) => request<TmdbResponse<TmdbMovie>>('/movie/upcoming', { page, region: 'IN' }),
  topRated: (page = 1) => request<TmdbResponse<TmdbMovie>>('/movie/top_rated', { page }),
  search: (query: string, page = 1) => request<TmdbResponse<TmdbMovie>>('/search/movie', { query, page, include_adult: false, region: 'IN' }),
  details: (id: number) => request<TmdbMovie>(`/movie/${id}`, { append_to_response: 'videos,credits,images,watch/providers', include_image_language: 'en,null' }),
  discover: (params: { with_genres?: number; with_original_language?: string; primary_release_year?: number; certification_country?: string; certification?: string; 'vote_count.gte'?: number; 'vote_average.gte'?: number; 'with_runtime.lte'?: number; 'with_runtime.gte'?: number; page?: number; sort_by?: string }) => request<TmdbResponse<TmdbMovie>>('/discover/movie', { ...params, region: 'IN', sort_by: params.sort_by || 'popularity.desc' }),
  searchPeople: (query: string) => request<TmdbResponse<{ id: number; name: string; known_for_department?: string; profile_path: string | null; known_for?: TmdbMovie[] }>>('/search/person', { query, include_adult: false, page: 1 }),
  personMovies: (id: number) => request<{ cast: TmdbMovie[]; crew: (TmdbMovie & { job?: string; department?: string })[] }>(`/person/${id}/movie_credits`),
};

export const tmdbImage = (path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
