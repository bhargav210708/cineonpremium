import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, CheckCircle2, CircleAlert, Clock3, ExternalLink, MapPin, Plus, Radio, Search, ShieldCheck, Ticket, Trash2, Volume2, Zap, LocateFixed, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tmdb, tmdbImage } from '../../lib/tmdb';
import type { TmdbMovie } from '../../types/tmdb';
import { movieTitle, movieYear } from '../../types/tmdb';

type Mission = { id: string; movieId?: number; title: string; poster?: string | null; year?: string; city: string; platform: string; theatre: string; format: string; target: string; mode: 'normal' | 'emergency'; createdAt: string };
const KEY = 'cinetribe.premiere-missions.v1';
const MONITOR_ENDPOINT = (import.meta.env.VITE_RADAR_MONITOR_URL as string | undefined)?.trim();
const mapsSearch = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const bookingSearch = (provider: 'BookMyShow' | 'District', title: string, city: string) => provider === 'BookMyShow'
  ? `https://www.google.com/search?q=${encodeURIComponent(`site:in.bookmyshow.com ${title} ${city} tickets`)}`
  : `https://www.google.com/search?q=${encodeURIComponent(`site:district.in ${title} ${city} movie tickets`)}`;
function readMissions(): Mission[] { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function persistMissions(value: Mission[]) { localStorage.setItem(KEY, JSON.stringify(value)); }
export default function PremiereRadar() {
  const [missions, setMissions] = useState<Mission[]>(readMissions);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TmdbMovie | null>(null);
  const [city, setCity] = useState(() => { try { return localStorage.getItem('reelora.radar.city') || localStorage.getItem('cinetribe.radar.city') || 'Chennai'; } catch { return 'Chennai'; } });
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('City can be entered manually or filled from your device location.');
  const [platform, setPlatform] = useState('Any supported platform');
  const [theatre, setTheatre] = useState('Any theatre in my city');
  const [format, setFormat] = useState('Any format');
  const [target, setTarget] = useState('Opening day');
  const [mode, setMode] = useState<'normal' | 'emergency'>('normal');
  const [status, setStatus] = useState('');
  const [permission, setPermission] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const [lastMonitorCheck, setLastMonitorCheck] = useState('');
  const search = useQuery({ queryKey: ['radar-search', query], queryFn: () => tmdb.search(query.trim()), enabled: query.trim().length > 1, staleTime: 60_000 });
  const results = useMemo(() => (search.data?.results ?? []).filter(m => m.poster_path).slice(0, 6), [search.data]);
  const save = (next: Mission[]) => { setMissions(next); persistMissions(next); };
  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Location is not available in this browser. Enter your city manually.'); return; }
    setLocating(true); setLocationStatus('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
        if (!response.ok) throw new Error('Reverse geocoding unavailable');
        const result = await response.json() as { address?: Record<string,string> };
        const a = result.address ?? {}; const inferred = a.city || a.town || a.suburb || a.county || a.state || '';
        if (inferred) { setCity(inferred); try { localStorage.setItem('reelora.radar.city', inferred); } catch {} setLocationStatus(`Using ${inferred} from your device location. Exact coordinates are not saved.`); }
        else setLocationStatus('Location found. Could not infer a city name; please enter it manually.');
      } catch { setLocationStatus('Location was received, but city lookup failed. Enter your city manually.'); }
      finally { setLocating(false); }
    }, error => { setLocating(false); setLocationStatus(error.code === 1 ? 'Location permission was denied. Enter your city manually or enable permission in browser settings.' : 'Could not read location. Enter your city manually.'); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };
  useEffect(() => { try { localStorage.setItem('reelora.radar.city', city); } catch {} }, [city]);
  useEffect(() => {
    if (!MONITOR_ENDPOINT || missions.length === 0) return;
    let stopped = false;
    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      for (const mission of missions) {
        if (stopped) return;
        try {
          const response = await fetch(MONITOR_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId: mission.id, movieId: mission.movieId, title: mission.title, city: mission.city, platform: mission.platform, theatre: mission.theatre, format: mission.format, target: mission.target }), signal: AbortSignal.timeout(12000) });
          if (!response.ok) continue;
          const result = await response.json() as { available?: boolean; bookingUrl?: string; message?: string; checkedAt?: string; eventId?: string };
          if (!result.available) continue;
          const dedupeKey = `Cinéon.radar.alert.${mission.id}.${result.eventId || result.bookingUrl || 'available'}`;
          if (localStorage.getItem(dedupeKey)) continue;
          localStorage.setItem(dedupeKey, '1');
          const body = result.message || `Tickets may be available for ${mission.title} in ${mission.city}. Open the booking source to verify.`;
          if ('Notification' in window && Notification.permission === 'granted') { const notification = new Notification(`Cinéon · ${mission.title}`, { body, tag: `Cinéon-${mission.id}`, requireInteraction: mission.mode === 'emergency', ...(result.bookingUrl ? { data: { url: result.bookingUrl } } : {}) }); notification.onclick = () => { window.focus(); if (result.bookingUrl) window.open(result.bookingUrl, '_blank', 'noopener,noreferrer'); notification.close(); }; }
          setStatus(`Availability signal received for ${mission.title}. Please verify the provider's booking page.${result.bookingUrl ? ` ${result.bookingUrl}` : ''}`);
        } catch { /* A temporary monitor outage must not be presented as availability. */ }
      }
      setLastMonitorCheck(new Date().toLocaleTimeString());
    };
    void check(); const timer = window.setInterval(() => { void check(); }, 60_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [missions]);
  const addMission = () => {
    const title = selected ? movieTitle(selected) : query.trim();
    if (!title) { setStatus('Search for a film or enter its title first.'); return; }
    if (missions.some(m => m.title.toLowerCase() === title.toLowerCase() && m.city.toLowerCase() === city.trim().toLowerCase())) { setStatus('You are already tracking this film in that city.'); return; }
    const mission: Mission = { id: crypto.randomUUID?.() ?? `${Date.now()}`, movieId: selected?.id, title, poster: selected?.poster_path, year: selected ? movieYear(selected) : '', city: city.trim() || 'India', platform, theatre, format, target, mode, createdAt: new Date().toISOString() };
    save([mission, ...missions]); setSelected(null); setQuery(''); setStatus(`Mission created for ${title}. This device has saved your preferences.`);
  };
  const enableNotifications = async () => {
    if (!('Notification' in window)) { setStatus('This browser does not support web notifications.'); return; }
    try { const result = await Notification.requestPermission(); setPermission(result); setStatus(result === 'granted' ? 'Browser notifications are enabled on this device.' : 'Notifications were not enabled. You can change this in your browser settings.'); }
    catch { setStatus('Notification permission could not be requested in this browser context.'); }
  };
  const testAlert = () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') { setStatus('Enable browser notifications first.'); return; }
    new Notification('Cinéon · Premiere Radar test', { body: 'This is a notification-permission test, not a ticket-availability alert.', icon: '/icon-192.png', tag: 'Cinéon-radar-test' });
    setStatus('Test notification sent. This confirms notification permission only—not ticket detection.');
  };
  const removeMission = (id: string) => save(missions.filter(m => m.id !== id));
  return <div className="page radar-page">
    <div className="topline"><span className="eyebrow"><span className="live-dot"/> Cinéon PREMIERE NETWORK</span><span className="radar-device-status"><Radio size={14}/> Personal tracker</span></div>
    <section className="radar-hero"><div className="radar-hero-copy"><span className="radar-kicker"><Zap size={14}/> YOUR NEXT BIG SCREEN MOMENT</span><h1>Premiere <em>Radar.</em></h1><p>Track a film by city, jump straight to Google Maps and booking searches, and receive device alerts if a configured, authorised monitoring service verifies availability.</p><div className="radar-hero-actions"><a href="#create-mission" className="primary-button"><Plus size={16}/> Create a mission</a><button className="secondary-button" onClick={enableNotifications}><BellRing size={15}/> {permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}</button></div></div><div className="radar-orbit-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Ticket size={39}/></div><span className="orbit-label label-top">RELEASE WATCH</span><span className="orbit-label label-bottom">REGION-AWARE</span></div></section>
    <div className="radar-notice"><CircleAlert size={18}/><div><strong>{MONITOR_ENDPOINT ? 'Configured monitor: foreground checks enabled.' : 'Booking-site monitoring needs an authorised provider connection.'}</strong><p>{MONITOR_ENDPOINT ? `Cinéon checks the configured monitor while this page is open, approximately every 60 seconds. Last check: ${lastMonitorCheck || 'starting'}. Background checks after closing the app require a deployed server and push delivery.` : 'BookMyShow and District do not expose a universal public browser API for live ticket status. This app will not scrape their pages or pretend that a search result means tickets are available. Use the quick booking and map searches below; connect a permitted monitor endpoint to enable verified automatic alerts.'}</p></div></div>
    <section className="radar-create glass-panel" id="create-mission"><div className="radar-section-head"><div><span className="eyebrow">01 / SET YOUR TARGET</span><h2>Create a ticket mission</h2><p>Set the exact film, region and screening preferences you want alerts for.</p></div><span className="radar-step-mark">CT / 01</span></div>
      <div className="radar-form-grid"><label className="radar-film-search">Film title<div className="radar-searchbox"><Search size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setSelected(null)}} placeholder="Search a movie title…"/><span>TMDB</span></div>{results.length>0&&<div className="radar-results">{results.map(movie=><button type="button" key={movie.id} className={`radar-result ${selected?.id===movie.id?'selected':''}`} onClick={()=>{setSelected(movie);setQuery(movieTitle(movie))}}><img src={tmdbImage(movie.poster_path,'w185')} alt=""/><span><strong>{movieTitle(movie)}</strong><small>{movieYear(movie)||'Release year unknown'}</small></span>{selected?.id===movie.id&&<CheckCircle2 size={17}/>}</button>)}</div>}{search.isError&&<small className="radar-help">Movie search unavailable. Check your TMDB token in .env.local.</small>}</label>
        <label>City or region<div className="radar-location-field"><input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Chennai" maxLength={80}/><button type="button" className="secondary-button" onClick={useMyLocation} disabled={locating}><LocateFixed size={14}/>{locating?'Locating…':'Use my location'}</button></div><small className="radar-help">{locationStatus}</small></label>
        <label>Booking source<select value={platform} onChange={e=>setPlatform(e.target.value)}><option>Any supported platform</option><option>BookMyShow</option><option>District</option><option>Official cinema website</option></select></label>
        <label>Preferred theatre<input value={theatre} onChange={e=>setTheatre(e.target.value)} maxLength={100}/></label>
        <label>Format<select value={format} onChange={e=>setFormat(e.target.value)}><option>Any format</option><option>IMAX</option><option>Dolby Atmos</option><option>4DX</option><option>ScreenX</option><option>Standard</option></select></label>
        <label>Target screening<select value={target} onChange={e=>setTarget(e.target.value)}><option>Opening day</option><option>Opening weekend</option><option>Any date</option><option>Specific release window</option></select></label>
      </div>
      <div className="radar-mode-picker"><button type="button" className={mode==='normal'?'chosen':''} onClick={()=>setMode('normal')}><span className="mode-icon normal"><Clock3 size={18}/></span><span><strong>Normal mode</strong><small>Calm notification when a qualifying release is verified.</small></span><span className="mode-radio"/></button><button type="button" className={mode==='emergency'?'chosen emergency-chosen':''} onClick={()=>setMode('emergency')}><span className="mode-icon emergency"><BellRing size={18}/></span><span><strong>Emergency mode</strong><small>Request high-priority alert treatment where the device supports it.</small></span><span className="mode-radio"/></button></div>
      <div className="radar-form-footer"><span><ShieldCheck size={15}/> City preference is stored locally; precise coordinates are not retained.</span><button className="primary-button" onClick={addMission}><Plus size={16}/> Save mission</button></div>{status&&<p className="radar-status" role="status">{status}</p>}
    </section>
    <section className="radar-missions"><div className="radar-section-head"><div><span className="eyebrow">02 / YOUR WATCHLIST</span><h2>Active missions <span>{missions.length.toString().padStart(2,'0')}</span></h2><p>Your saved targets, ready for a future connected monitoring service.</p></div><button className="secondary-button" onClick={testAlert}><Volume2 size={15}/> Test alert</button></div>
      {missions.length===0?<div className="radar-empty"><div><CalendarClock size={26}/></div><h3>Your next premiere starts here.</h3><p>Create a mission above. Your selected films and region preferences will appear here.</p><a href="#create-mission">Create your first mission <ExternalLink size={14}/></a></div>:<div className="radar-mission-grid">{missions.map(m=><article className="radar-mission-card" key={m.id}>{m.poster?<img className="radar-mission-poster" src={tmdbImage(m.poster,'w342')} alt={`${m.title} poster`}/>:<div className="radar-mission-poster radar-no-poster"><Ticket size={26}/></div>}<div className="radar-mission-content"><div className="radar-mission-top"><span className={`radar-mode-pill ${m.mode}`}>{m.mode==='emergency'?<BellRing size={11}/>:<Clock3 size={11}/>} {m.mode}</span><button className="radar-delete" aria-label={`Remove ${m.title} mission`} onClick={()=>removeMission(m.id)}><Trash2 size={15}/></button></div><h3>{m.title}</h3><p className="radar-year">{m.year||'Film'} · {m.target}</p><div className="radar-mission-meta"><span><MapPin size={13}/>{m.city}</span><span><Ticket size={13}/>{m.format}</span></div><div className="radar-booking-actions"><a className="secondary-button" target="_blank" rel="noreferrer" href={bookingSearch('BookMyShow',m.title,m.city)}><ExternalLink size={13}/> Search BookMyShow</a><a className="secondary-button" target="_blank" rel="noreferrer" href={bookingSearch('District',m.title,m.city)}><ExternalLink size={13}/> Search District</a><a className="secondary-button" target="_blank" rel="noreferrer" href={mapsSearch(`${m.theatre === 'Any theatre in my city' ? 'cinemas' : m.theatre} ${m.city}`)}><Navigation size={13}/> Find theatres</a></div><div className="radar-source-status"><span className="source-status-dot"/>{MONITOR_ENDPOINT ? 'Monitor endpoint configured' : 'Manual provider search ready'}</div><small>{m.platform} · {m.theatre}</small></div></article>)}</div>}
    </section>
    <section className="radar-bottom-note"><CheckCircle2 size={18}/><div><strong>Designed for reliable alerts, not false promises.</strong><p>Manual links open current provider search results and Google Maps. If VITE_RADAR_MONITOR_URL is configured to an authorised service that returns a verified availability signal, this page checks it every minute while open and deduplicates notifications. Background monitoring still requires a deployed scheduler and push service; the app never reports a search result as confirmed availability.</p></div></section>
  </div>;
}
