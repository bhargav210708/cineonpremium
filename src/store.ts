import { create } from 'zustand';
import type { TmdbMovie } from './types/tmdb';
import { readWatchlist, toggleWatchlist } from './lib/storage';
interface AppState { watchlist: TmdbMovie[]; theme: 'dark' | 'oled' | 'light'; lowPower: boolean; toggleWatchlist: (movie: TmdbMovie) => void; setTheme: (theme: AppState['theme']) => void; setLowPower: (value: boolean) => void; }
export const useAppStore = create<AppState>((set) => ({
  watchlist: readWatchlist(), theme: (localStorage.getItem('cinetribe.theme') as AppState['theme']) || 'dark', lowPower: localStorage.getItem('cinetribe.lowPower') === 'true',
  toggleWatchlist: (movie) => { const watchlist = toggleWatchlist(movie); set({ watchlist }); window.dispatchEvent(new CustomEvent('cinetribe:workspace')); },
  setTheme: (theme) => { localStorage.setItem('cinetribe.theme', theme); document.documentElement.dataset.theme = theme; set({ theme }); },
  setLowPower: (lowPower) => { localStorage.setItem('cinetribe.lowPower', String(lowPower)); document.documentElement.dataset.lowPower = String(lowPower); set({ lowPower }); },
}));
