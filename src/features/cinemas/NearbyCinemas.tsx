import { useMemo, useState, type FormEvent } from 'react';
import { MapPin, Plus, Search, Building2, Monitor, LocateFixed, ExternalLink } from 'lucide-react';

type Screen = { id: string; name: string; formats: string[] };
type Cinema = {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  screens: Screen[];
  verification: 'community-submitted' | 'OpenStreetMap';
  createdAt: string;
};
type Point = { latitude: number; longitude: number };
const STORAGE_KEY = 'cinetribe.cinema-directory.v1';
const FORMATS = ['2D', '3D', 'IMAX', 'IMAX 70MM', 'IMAX 3D', '4DX', 'Dolby Cinema', 'Dolby Atmos', 'ScreenX', '70MM', 'PXL', 'ICE', 'EPIQ'];

function readDirectory(): Cinema[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Cinema => {
      if (!item || typeof item !== 'object') return false;
      const c = item as Partial<Cinema>;
      return typeof c.id === 'string' && typeof c.name === 'string' && typeof c.city === 'string' &&
        typeof c.address === 'string' && Number.isFinite(c.latitude) && Number.isFinite(c.longitude) && Array.isArray(c.screens);
    });
  } catch { return []; }
}
function distanceKm(a: Point, b: Point): number {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
function newId(): string { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export default function NearbyCinemas() {
  const [cinemas, setCinemas] = useState<Cinema[]>(readDirectory);
  const [liveCinemas, setLiveCinemas] = useState<Cinema[]>([]);
  const [searching, setSearching] = useState(false);
  const [location, setLocation] = useState<Point | null>(null);
  const [status, setStatus] = useState('Location is optional. Search by city or add a cinema manually.');
  const [query, setQuery] = useState('');
  const radius = 25;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cinemaForm, setCinemaForm] = useState(false);
  const [screenForm, setScreenForm] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [screenName, setScreenName] = useState('');
  const [formats, setFormats] = useState<string[]>(['2D']);

  const allCinemas = useMemo(() => [...liveCinemas, ...cinemas.filter(saved => !liveCinemas.some(live => live.name.toLowerCase() === saved.name.toLowerCase() && distanceKm(live, saved) < 0.2))], [liveCinemas, cinemas]);
  const selected = allCinemas.find(c => c.id === selectedId) ?? null;
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return allCinemas.map(cinema => ({ cinema, distance: location ? distanceKm(location, cinema) : null }))
      .filter(({ cinema, distance }) => {
        const matches = !q || `${cinema.name} ${cinema.city} ${cinema.address}`.toLocaleLowerCase().includes(q);
        return matches && (!location || distance === null || distance <= radius);
      })
      .sort((a, b) => a.distance === null ? (b.distance === null ? 0 : 1) : b.distance === null ? -1 : a.distance - b.distance);
  }, [allCinemas, location, query, radius]);

  function persist(next: Cinema[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setCinemas(next); setError(''); }
    catch { setError('Could not save to this browser. Check storage availability.'); }
  }
  async function fetchCinemas(point: Point, cityName = '', radiusKm = radius) {
    setSearching(true); setError(''); setLocation(point);
    setStatus('Scanning OpenStreetMap for cinemas near this location…');
    const radiusMeters = radiusKm * 1000;
    const queryText = `[out:json][timeout:25];(node["amenity"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude});way["amenity"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude});relation["amenity"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude});node["building"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude});way["building"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude});relation["building"="cinema"](around:${radiusMeters},${point.latitude},${point.longitude}););out center tags;`;
    try {
      // Public Overpass instances occasionally rate-limit or go offline. Try a small
      // set of community endpoints in sequence rather than failing on the first one.
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
      ];
      type OverpassElement = { id: number; type?: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
      type OverpassResponse = { elements?: OverpassElement[] };
      let data: OverpassResponse | null = null;
      let lastFailure = 'Map data services are temporarily unavailable.';
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: queryText, signal: AbortSignal.timeout(18000) });
          if (!response.ok) throw new Error(`Map data service returned ${response.status}`);
          data = await response.json() as OverpassResponse;
          if (data) break;
        } catch (failure) { lastFailure = failure instanceof Error ? failure.message : lastFailure; }
      }
      if (!data) throw new Error(`${lastFailure} Please retry shortly or search by city.`);
      const mapped: Cinema[] = [...new Map((data.elements ?? []).map((element) => [`${element.type ?? 'node'}-${element.id}`, element])).values()].map((element): Cinema | null => {
        const latitude = element.lat ?? element.center?.lat; const longitude = element.lon ?? element.center?.lon; const tags = element.tags ?? {};
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        return { id: `osm-${element.id}`, name: tags.name || tags['name:en'] || tags.brand || 'Cinema (name unavailable)', city: tags['addr:city'] || cityName || 'Nearby', address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb']].filter(Boolean).join(', '), latitude: latitude!, longitude: longitude!, screens: [], verification: 'OpenStreetMap' as const, createdAt: '' };
      }).filter((c): c is Cinema => c !== null);
      setLiveCinemas(mapped);
      setStatus(mapped.length ? `Found ${mapped.length} mapped cinema${mapped.length === 1 ? '' : 's'} within ${radiusKm} km. Listings depend on OpenStreetMap coverage.` : `No mapped cinemas found within ${radiusKm} km. Try a wider radius or search by city.`);
    } catch (err) {
      setStatus('Could not reach the live map data service right now. Try again in a moment, or search by city.');
      setError(err instanceof Error ? err.message : 'Cinema search failed.');
    } finally { setSearching(false); }
  }
  function locate() {
    setError('');
    if (!navigator.geolocation) { setStatus('Location is unavailable in this browser. Search by city instead.'); return; }
    setStatus('Requesting location permission…');
    navigator.geolocation.getCurrentPosition(
      p => { const point = { latitude: p.coords.latitude, longitude: p.coords.longitude }; void fetchCinemas(point); },
      e => setStatus(e.code === 1 ? 'Location permission was denied. Search by city or enable location permission in your browser settings.' : e.code === 3 ? 'Location request timed out. Try again or search by city.' : 'Could not get your location. Check that location services are enabled, then try again.'),
      { timeout: 20000, maximumAge: 60000, enableHighAccuracy: true },
    );
  }
  async function searchCity() {
    if (!query.trim()) { setError('Enter a city or area to search.'); return; }
    setSearching(true); setError(''); setStatus(`Finding ${query.trim()}…`);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search'); url.searchParams.set('q', query.trim()); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('limit', '1');
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('City lookup is temporarily unavailable.');
      const places = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (!places.length) throw new Error(`Could not find “${query.trim()}”. Try adding the country or region.`);
      const place = places[0]; setQuery(place.display_name.split(',')[0]); await fetchCinemas({ latitude: Number(place.lat), longitude: Number(place.lon) }, place.display_name.split(',')[0]);
    } catch (err) { setError(err instanceof Error ? err.message : 'City search failed.'); setStatus('City search could not be completed.'); setSearching(false); }
  }
  function addCinema(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const latitude = Number(lat), longitude = Number(lon);
    if (!name.trim() || !city.trim() || !lat.trim() || !lon.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Enter a cinema name, city, and valid latitude/longitude.'); return;
    }
    const duplicate = cinemas.find(c => c.name.toLowerCase() === name.trim().toLowerCase() && distanceKm({ latitude, longitude }, c) < 0.15);
    if (duplicate) { setError(`A similar cinema already exists: ${duplicate.name}.`); setSelectedId(duplicate.id); setCinemaForm(false); return; }
    const item: Cinema = { id: newId(), name: name.trim(), city: city.trim(), address: address.trim(), latitude, longitude, screens: [], verification: 'community-submitted', createdAt: new Date().toISOString() };
    persist([...cinemas, item]); setSelectedId(item.id); setName(''); setCity(''); setAddress(''); setLat(''); setLon(''); setCinemaForm(false);
  }
  function addScreen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!selected) return;
    if (!screenName.trim() || formats.length === 0) { setError('Enter a screen name and select at least one format.'); return; }
    if (selected.screens.some(s => s.name.toLowerCase() === screenName.trim().toLowerCase())) { setError('That screen name already exists for this cinema.'); return; }
    persist(cinemas.map(c => c.id === selected.id ? { ...c, screens: [...c.screens, { id: newId(), name: screenName.trim(), formats }] } : c));
    setScreenName(''); setFormats(['2D']); setScreenForm(false);
  }
  const field: React.CSSProperties = { width: '100%', marginTop: 6, padding: '11px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' };
  const panel: React.CSSProperties = { padding: 20, border: '1px solid var(--line)', background: 'var(--glass)', borderRadius: 22 };
  const button: React.CSSProperties = { border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', background: 'var(--panel-2)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 8 };
  const primary: React.CSSProperties = { ...button, background: 'var(--amber)', color: '#0b0a10', borderColor: 'var(--amber)', fontWeight: 700 };
  return <section className="page-wrap">
    <div className="page-heading"><div><p className="eyebrow">CINEMA INTELLIGENCE</p><h1>Nearby cinemas</h1><p className="page-description">Find a saved venue, inspect its screens, or submit a missing cinema.</p></div></div>
    <div style={{ ...panel, marginBottom: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 240px' }}><h2 style={{ margin: '0 0 6px' }}><MapPin size={18} style={{ verticalAlign: 'middle' }} /> Location search</h2><p className="page-description" aria-live="polite">{status}</p></div>
        <button type="button" style={primary} onClick={locate} disabled={searching}><LocateFixed size={16}/> {searching ? 'Scanning…' : 'Scan near me'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12, marginTop: 14 }}>
        <label>Search by cinema or city<div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 12, top: 18, opacity: .65 }}/><input style={{ ...field, paddingLeft: 36 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Chennai or cinema name" /></div></label>

      </div>
      <button type="button" style={{ ...primary, marginTop: 12 }} onClick={searchCity} disabled={searching}><Search size={15}/> Search this city / area</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}><a style={button} target="_blank" rel="noreferrer" href={location ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}+cinemas` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((query.trim() || 'cinemas near me'))}`}><ExternalLink size={15}/> Explore nearby cinemas in Google Maps</a></div><p className="page-description" style={{ marginTop: 12, fontSize: 13 }}>Venue listings are discovered from OpenStreetMap and your permission-based location. Google Maps opens the selected place or a nearby-cinema search; no embedded map is loaded, keeping this page lighter. Coverage can vary by area.</p>
    </div>
    {error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: 14 }}>{error}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h2 style={{ margin: 0 }}>Directory <span className="page-description">({results.length})</span></h2><button style={primary} type="button" onClick={() => { setCinemaForm(v => !v); setError(''); }}><Plus size={16}/> Add cinema</button></div>
    {cinemaForm && <form onSubmit={addCinema} style={{ ...panel, marginBottom: 18 }}><h2>Add a cinema</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,220px),1fr))', gap: 12 }}><label>Cinema name *<input style={field} required maxLength={120} value={name} onChange={e => setName(e.target.value)}/></label><label>City *<input style={field} required maxLength={100} value={city} onChange={e => setCity(e.target.value)}/></label><label>Address<input style={field} maxLength={250} value={address} onChange={e => setAddress(e.target.value)}/></label><label>Latitude *<input style={field} required type="number" step="any" min="-90" max="90" value={lat} onChange={e => setLat(e.target.value)}/></label><label>Longitude *<input style={field} required type="number" step="any" min="-180" max="180" value={lon} onChange={e => setLon(e.target.value)}/></label></div><p className="page-description" style={{ fontSize: 13, marginTop: 10 }}>Enter the cinema's coordinates, not your current location unless you are at that venue. You can find coordinates from a map service.</p><div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button style={primary} type="submit">Save cinema</button><button style={button} type="button" onClick={() => setCinemaForm(false)}>Cancel</button></div></form>}
    {results.length === 0 ? <div style={panel}><Building2 size={24}/><h3>No matching cinemas yet</h3><p className="page-description">Try another city or add a venue to this browser's directory.</p></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 14 }}>{results.map(({ cinema }) => <article key={cinema.id} style={panel}><h3 style={{ marginTop: 0 }}>{cinema.name}</h3><p className="page-description">{cinema.address || 'Address not provided'}{cinema.address ? ' · ' : ''}{cinema.city}</p><p style={{ margin: '12px 0' }}><Monitor size={15} style={{ verticalAlign: 'middle' }}/> {cinema.screens.length ? `${cinema.screens.length} reported screens` : 'Screen details not listed'}</p><span className="eyebrow">{cinema.verification === 'OpenStreetMap' ? 'OPENSTREETMAP LISTING' : 'COMMUNITY SUBMITTED · UNVERIFIED'}</span><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}><button style={primary} type="button" onClick={() => { setSelectedId(cinema.id); setScreenForm(false); setError(''); }}>View details</button><a style={button} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cinema.name} ${cinema.address} ${cinema.city}`)}`}><ExternalLink size={14}/> Open in Google Maps ↗</a></div></article>)}</div>}
    {selected && <section style={{ ...panel, marginTop: 22 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}><div><p className="eyebrow">SELECTED VENUE</p><h2 style={{ margin: '0 0 6px' }}>{selected.name}</h2><p className="page-description">{selected.city} · {selected.verification === 'OpenStreetMap' ? 'mapped venue listing' : 'community-submitted, not verified'}</p><a style={button} target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.name} ${selected.address} ${selected.city}`)}`}><ExternalLink size={14}/> Open in Google Maps ↗</a></div><button style={button} type="button" onClick={() => { setSelectedId(null); setScreenForm(false); }}>Close</button></div><h3 style={{ marginTop: 20 }}>Screens</h3>{selected.screens.length === 0 ? <p className="page-description">No screen formats are available for this listing yet. Venue-specific screen information may need to be confirmed.</p> : selected.screens.map(screen => <div key={screen.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}><strong>{screen.name}</strong><p className="page-description">{screen.formats.join(' · ')}</p></div>)}{selected.verification !== 'OpenStreetMap' && <button style={primary} type="button" onClick={() => setScreenForm(v => !v)}><Plus size={16}/> Add missing screen</button>}{screenForm && <form onSubmit={addScreen} style={{ marginTop: 18 }}><label>Screen name or number<input style={field} required maxLength={80} value={screenName} onChange={e => setScreenName(e.target.value)} placeholder="e.g. Screen 4"/></label><p style={{ marginTop: 14 }}>Formats supported by this screen</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 9, margin: '12px 0' }}>{FORMATS.map(format => <label key={format} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={formats.includes(format)} onChange={() => setFormats(current => current.includes(format) ? current.filter(f => f !== format) : [...current, format])}/>{format}</label>)}</div><p className="page-description" style={{ fontSize: 13 }}>Only choose formats you know this screen supports. Screen information is not independently verified.</p><div style={{ display: 'flex', gap: 10, marginTop: 12 }}><button style={primary} type="submit">Save screen</button><button style={button} type="button" onClick={() => setScreenForm(false)}>Cancel</button></div></form>}</section>}
  </section>;
}
