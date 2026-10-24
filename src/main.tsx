import React, { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import './styles/global.css';

const Discover = lazy(() => import('./features/discover/Discover'));
const MovieDetails = lazy(() => import('./features/movie/MovieDetails'));
const CardStudio = lazy(() => import('./features/card-studio/CardStudio'));
const Watchlist = lazy(() => import('./features/watchlist/Watchlist'));
const DiaryPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.DiaryPage})));
const StylusDiary = lazy(() => import('./features/workspace/StylusDiary'));
const SocialPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.SocialPage})));
const TribesPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.TribesPage})));
const CinemasPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.CinemasPage})));
const NearbyCinemas = lazy(() => import('./features/cinemas/NearbyCinemas'));
const ExperiencePage = lazy(() => import('./features/workspace/ExperiencePage'));
const CinemaLabPage = lazy(() => import('./features/workspace/CinemaLabPage'));
const CinemaGalaxyPage = lazy(() => import('./features/workspace/CinemaGalaxyPage'));
const PartiesPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.PartiesPage})));
const StatsPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.StatsPage})));
const ProfilePage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.ProfilePage})));
const SettingsPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.SettingsPage})));
const NotificationsPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.NotificationsPage})));
const AiPage = lazy(() => import('./features/workspace/Workspace').then(m => ({default:m.AiPage})));
const AccountsPage = lazy(() => import('./features/workspace/AccountsPage'));
const PremiereRadar = lazy(() => import('./features/workspace/PremiereRadar'));
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });
const Loading = () => <div className="route-loading"><span className="loading-orb"/> Entering Cinéon…</div>;
function FirstFrame({ onFinish, mode }: { onFinish: () => void; mode: 'instant'|'cinematic'|'minimal' }) {
  useEffect(() => { const timer = window.setTimeout(onFinish, mode === 'instant' ? 700 : mode === 'minimal' ? 3000 : 8000); return () => window.clearTimeout(timer); }, [onFinish, mode]);
  return <div className={`first-frame first-frame-${mode}`} role="status" aria-label="Welcome to Cinéon"><div className="first-frame-mark">C<span>✦</span>ÉON</div><div className="first-frame-projector" aria-hidden="true"><span/></div><div className="first-frame-rule"/><p>EVERY FILM LEAVES A TRACE</p><button type="button" onClick={onFinish}>Skip intro <span aria-hidden="true">↗</span></button></div>;
}
function App() {
  const [showIntro, setShowIntro] = useState(() => { try { const mode=localStorage.getItem('cinetribe.introMode')||'cinematic'; return mode!=='instant' && localStorage.getItem('cinetribe.introEnabled') !== 'false' && !localStorage.getItem('cinetribe.firstFrameSeen') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } });
  const finishIntro = React.useCallback(() => { try { localStorage.setItem('cinetribe.firstFrameSeen', '1'); } catch { /* storage can be disabled */ } setShowIntro(false); }, []);
  const introMode = (localStorage.getItem('cinetribe.introMode') || 'cinematic') as 'instant'|'cinematic'|'minimal';
  const theme = localStorage.getItem('cinetribe.theme') || 'dark';
  const lowPower = localStorage.getItem('cinetribe.lowPower') || 'false';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.lowPower = lowPower;
  const glassIntensity = Number(localStorage.getItem('cinetribe.glassIntensity') ?? 45);
  document.documentElement.style.setProperty('--glass-intensity', String(Math.max(0, Math.min(100, glassIntensity)) / 100));
  document.documentElement.style.setProperty('--glass-blur', `${Math.round(Math.max(0, Math.min(100, glassIntensity)) / 10)}px`);
  document.documentElement.style.setProperty('--glass-border-alpha', String(Number(localStorage.getItem('cinetribe.glassEdge') ?? 22) / 100));
  document.documentElement.style.setProperty('--glass-shadow-strength', String(Number(localStorage.getItem('cinetribe.glassShadow') ?? 24) / 100));
  const savedGlassBlur = Number(localStorage.getItem('cinetribe.glassBlur') ?? 18);
  document.documentElement.style.setProperty('--glass-blur', `${Math.max(0, Math.min(36, savedGlassBlur))}px`);
  return <QueryClientProvider client={queryClient}>{showIntro && <FirstFrame mode={introMode} onFinish={finishIntro}/>}<BrowserRouter><Suspense fallback={<Loading/>}><Routes><Route element={<Layout/>}><Route index element={<Discover/>}/><Route path="movie/:id" element={<MovieDetails/>}/><Route path="studio/:id" element={<CardStudio/>}/><Route path="watchlist" element={<Watchlist/>}/><Route path="premiere-radar" element={<PremiereRadar/>}/><Route path="diary" element={<DiaryPage/>}/><Route path="stylus-diary" element={<StylusDiary/>}/><Route path="community" element={<SocialPage/>}/><Route path="tribes" element={<TribesPage/>}/><Route path="cinemas" element={<CinemasPage/>}/><Route path="cinemas-nearby" element={<NearbyCinemas/>}/><Route path="experience" element={<ExperiencePage/>}/><Route path="cinema-lab" element={<CinemaLabPage/>}/><Route path="galaxy" element={<CinemaGalaxyPage/>}/><Route path="parties" element={<PartiesPage/>}/><Route path="stats" element={<StatsPage/>}/><Route path="profile" element={<ProfilePage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="notifications" element={<NotificationsPage/>}/><Route path="ai" element={<AiPage/>}/><Route path="account" element={<AccountsPage/>}/><Route path="*" element={<Discover/>}/></Route></Routes></Suspense></BrowserRouter></QueryClientProvider>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Cinéon offline shell registration failed', error)); });
}
