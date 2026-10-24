export interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  original_language?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  adult?: boolean;
  media_type?: 'movie' | 'tv' | 'person';
  runtime?: number;
  genres?: { id: number; name: string }[];
  tagline?: string;
  status?: string;
  videos?: { results: { id: string; key: string; name: string; site: string; type: string; official?: boolean }[] };
  credits?: { cast: { id: number; name: string; character: string; profile_path: string | null }[]; crew: { id: number; name: string; job: string; department: string }[] };
  images?: { posters: { file_path: string; width: number; height: number; iso_639_1: string | null }[]; backdrops: { file_path: string; width: number; height: number; iso_639_1: string | null }[] };
  'watch/providers'?: { results: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string }[]; rent?: { provider_id: number; provider_name: string; logo_path: string }[]; buy?: { provider_id: number; provider_name: string; logo_path: string }[] }> };
}
export interface TmdbResponse<T> { page: number; results: T[]; total_pages: number; total_results: number }
export const movieTitle = (movie: TmdbMovie) => movie.title ?? movie.name ?? 'Untitled';
export const movieYear = (movie: TmdbMovie) => (movie.release_date ?? movie.first_air_date ?? '').slice(0, 4);
