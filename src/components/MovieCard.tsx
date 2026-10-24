import { Bookmark, Star, ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { TmdbMovie } from '../types/tmdb';
import { movieTitle, movieYear } from '../types/tmdb';
import { tmdbImage } from '../lib/tmdb';
import { useAppStore } from '../store';
import { filmIdentity } from '../lib/filmIdentity';

function cardMood(movie: TmdbMovie): string {
  const title = movieTitle(movie).toLowerCase();
  const genres = movie.genre_ids ?? [];
  if (title.includes('dune') || title.includes('sandworm') || title.includes('arrakis')) return 'film-skin-dune';
  if (title.includes('doomsday') || title.includes('doom') || title.includes('apocalypse')) return 'film-skin-doom';
  if (genres.includes(878) || genres.includes(14)) return 'film-skin-cosmos';
  if (genres.includes(27) || genres.includes(53)) return 'film-skin-shadow';
  if (genres.includes(10749) || genres.includes(18)) return 'film-skin-heart';
  if (genres.includes(28) || genres.includes(12)) return 'film-skin-impact';
  return 'film-skin-classic';
}

export function MovieCard({ movie }: { movie: TmdbMovie }) {
  const saved = useAppStore(state => state.watchlist.some(item => item.id === movie.id));
  const toggle = useAppStore(state => state.toggleWatchlist);
  const poster = tmdbImage(movie.poster_path, 'w342');
  const title = movieTitle(movie);
  const moodClass = cardMood(movie);
  const identity = filmIdentity(movie);
  const moodLabel = moodClass === 'film-skin-dune' ? 'DESERT MYTH' : moodClass === 'film-skin-doom' ? 'END OF DAYS' : moodClass === 'film-skin-cosmos' ? 'OTHER WORLDS' : moodClass === 'film-skin-shadow' ? 'DARK MATTER' : moodClass === 'film-skin-heart' ? 'HUMAN STORIES' : moodClass === 'film-skin-impact' ? 'FULL THROTTLE' : 'THE CLASSICS';
  return <article className={`movie-card ${moodClass}`} style={{ '--film-accent': identity.accent } as CSSProperties} onMouseEnter={() => window.dispatchEvent(new CustomEvent('cinetribe:ambient-poster', { detail: poster }))} onMouseLeave={() => window.dispatchEvent(new CustomEvent('cinetribe:ambient-poster', { detail: '' }))} onFocus={() => window.dispatchEvent(new CustomEvent('cinetribe:ambient-poster', { detail: poster }))} onBlur={() => window.dispatchEvent(new CustomEvent('cinetribe:ambient-poster', { detail: '' }))}>
    <Link to={`/movie/${movie.id}`} className="poster-link" aria-label={`View ${title}`} onClick={() => { try { sessionStorage.setItem('cinetribe.discover-scroll', String(window.scrollY)); } catch { /* optional */ } }}>
      {poster ? <img src={poster} alt={`${title} poster`} loading="lazy" decoding="async" width="342" height="513" /> : <div className="poster-missing">Poster unavailable</div>}
      <span className="poster-mood-stamp">{moodLabel}</span>
      <span className="poster-open" aria-hidden="true"><ArrowUpRight size={17}/></span>
    </Link>
    <div className="movie-card-info">
      <Link to={`/movie/${movie.id}`} className="movie-title" onClick={() => { try { sessionStorage.setItem('cinetribe.discover-scroll', String(window.scrollY)); } catch { /* optional */ } }}>{title}</Link>
      <div className="movie-card-meta">
        <span className="movie-year">{movieYear(movie) || 'Release date unknown'}</span>
        <span className="movie-rating-inline" aria-label={`Rating ${movie.vote_average ? movie.vote_average.toFixed(1) : 'not rated'}`}><Star size={12} fill="currentColor" /> {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}</span>
        <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={() => toggle(movie)} aria-label={saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`} title={saved ? 'Remove from watchlist' : 'Add to watchlist'}><Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
    </div>
  </article>;
}
