import { Bookmark, Clapperboard, Compass, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MovieCard } from '../../components/MovieCard';
import { useAppStore } from '../../store';
export default function Watchlist() {
  const watchlist = useAppStore(state => state.watchlist); const clear = useAppStore(state => state.toggleWatchlist);
  return <div className="page watchlist-page"><div className="eyebrow"><Bookmark size={14}/> YOUR PRIVATE COLLECTION</div><div className="section-heading watchlist-heading"><div><h1>Your watchlist<span>.</span></h1><p>A little list of stories waiting for your big screen.</p></div><span className="result-count">{watchlist.length} SAVED</span></div>{watchlist.length ? <div className="movie-grid">{watchlist.map(movie => <div className="watchlist-item" key={movie.id}><MovieCard movie={movie}/><button className="remove-watchlist" onClick={() => clear(movie)}><Trash2 size={14}/> Remove</button></div>)}</div> : <div className="empty-state watchlist-empty"><div className="empty-ticket"><Clapperboard size={32}/></div><h3>Your next favourite is out there.</h3><p>Bookmark films as you explore and they’ll be waiting here.</p><Link className="primary-button" to="/"><Compass size={17}/> Explore movies</Link></div>}</div>;
}
