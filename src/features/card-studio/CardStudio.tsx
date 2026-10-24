import { readWorkspace, updateWorkspace } from '../../lib/workspace';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import qrcode from 'qrcode-generator';
import { ArrowLeft, Download, RotateCcw, Share2, Ticket } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tmdb, tmdbImage } from '../../lib/tmdb';
import { movieTitle, movieYear } from '../../types/tmdb';
import { recordCardExport } from '../../lib/storage';
const FORMATS = ['2D', '3D', 'IMAX', 'IMAX 70MM', 'IMAX 3D', '4DX', 'Dolby Cinema', 'ScreenX', '70MM', 'Dolby Atmos', 'PXL', 'ICE', 'EPIQ'];
const STYLES = ['Amber', 'Matte', 'Holo', 'Film strip', 'Mono', 'Neon'] as const;
type CardStyle = typeof STYLES[number];
const SHAPES = [{ id: 'classic', label: 'Classic Stub' }, { id: 'premiere', label: 'Premiere Pass' }, { id: 'future', label: 'Future Pass' }, { id: 'archive', label: 'Archive Ticket' }, { id: 'collector', label: 'Collector Card' }] as const;
type TicketShape = typeof SHAPES[number]['id'];
type TicketDraft = { id: string; name: string; posterPath: string | null; style: CardStyle; shape: TicketShape; cropX: number; cropY: number; cropZoom: number; format: string; label: string; cinema: string; city: string; date: string; seat: string; party: string; review: string; rating: number; characterEdition: string; characterImage: string; accentOverride: string; typeface: string; story: boolean; createdAt: string };
type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf' | 'svg';
const EXPORT_FORMATS: { value: ExportFormat; label: string; extension: string; mime: string }[] = [
  { value: 'png', label: 'PNG · lossless', extension: 'png', mime: 'image/png' },
  { value: 'jpeg', label: 'JPEG · smaller file', extension: 'jpg', mime: 'image/jpeg' },
  { value: 'webp', label: 'WebP · compact', extension: 'webp', mime: 'image/webp' },
  { value: 'pdf', label: 'PDF · print/share', extension: 'pdf', mime: 'application/pdf' },
  { value: 'svg', label: 'SVG · image container', extension: 'svg', mime: 'image/svg+xml' },
];
function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.94): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(`This browser could not export ${mime}.`)), mime, quality));
}
function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not prepare the export file.')); reader.readAsDataURL(blob); });
}
async function canvasAsSvg(canvas: HTMLCanvasElement): Promise<Blob> {
  const png = await canvasBlob(canvas, 'image/png');
  const data = await blobDataUrl(png);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><title>Cinéon ticket</title><image width="${canvas.width}" height="${canvas.height}" href="${data}"/></svg>`;
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}
async function jpegAsPdf(jpeg: Blob, width: number, height: number): Promise<Blob> {
  const imageBytes = new Uint8Array(await jpeg.arrayBuffer());
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const push = (chunk: Uint8Array | string) => { const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk; chunks.push(bytes); length += bytes.length; };
  const offsets: number[] = [0];
  push('%PDF-1.4\n%âãÏÓ\n');
  const object = (id: number, body: string | Uint8Array) => { offsets[id] = length; push(`${id} 0 obj\n`); if (typeof body === 'string') push(body); else push(body); push('\nendobj\n'); };
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length; push('4 0 obj\n'); push(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`); push(imageBytes); push('\nendstream\nendobj\n');
  const content = encoder.encode(`q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ`);
  object(5, `<< /Length ${content.length} >>\nstream\n${new TextDecoder().decode(content)}\nendstream`);
  const xrefOffset = length;
  push(`xref\n0 6\n0000000000 65535 f \n`);
  for (let id = 1; id <= 5; id++) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const output = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
  return new Blob([output.buffer as ArrayBuffer], { type: 'application/pdf' });
}
async function exportCanvas(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  if (format === 'svg') return canvasAsSvg(canvas);
  if (format === 'pdf') return jpegAsPdf(await canvasBlob(canvas, 'image/jpeg', 0.95), canvas.width, canvas.height);
  if (format === 'webp') { try { const webp = await canvasBlob(canvas, 'image/webp', 0.94); if (webp.type === 'image/webp') return webp; } catch { /* use a compatible lossless fallback below */ } return canvasBlob(canvas, 'image/png'); }
  return canvasBlob(canvas, format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.94);
}
const TICKET_DRAFTS_KEY = 'cinetribe.ticket-drafts.v1';
function readTicketDrafts(): TicketDraft[] { try { const parsed = JSON.parse(localStorage.getItem(TICKET_DRAFTS_KEY) || '[]'); return Array.isArray(parsed) ? parsed.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string') : []; } catch { return []; } }
export default function CardStudio() {
  const { id } = useParams(); const navigate = useNavigate(); const movieId = Number(id);
  const query = useQuery({ queryKey: ['movie', movieId], queryFn: () => tmdb.details(movieId), enabled: movieId > 0, staleTime: 24 * 60 * 60 * 1000 });
  const movie = query.data; const [format, setFormat] = useState('IMAX'); const [style, setStyle] = useState<CardStyle>('Amber'); const [label, setLabel] = useState('ONE FOR THE BIG SCREEN'); const [cinema, setCinema] = useState(''); const [city, setCity] = useState(''); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [seat, setSeat] = useState(''); const [party, setParty] = useState(''); const [story, setStory] = useState(false); const [flipped, setFlipped] = useState(false); const [posterPath, setPosterPath] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [depth, setDepth] = useState<'off'|'subtle'|'cinematic'>('subtle'); const [review, setReview] = useState(''); const [rating, setRating] = useState(0); const [reveal, setReveal] = useState(false); const [shape, setShape] = useState<TicketShape>('classic'); const [cropX, setCropX] = useState(50); const [cropY, setCropY] = useState(38); const [cropZoom, setCropZoom] = useState(100); const [characterEdition, setCharacterEdition] = useState(''); const [characterImage, setCharacterImage] = useState(''); const [accentOverride, setAccentOverride] = useState(''); const [typeface, setTypeface] = useState('Bricolage Grotesque'); const [ticketDrafts, setTicketDrafts] = useState<TicketDraft[]>(readTicketDrafts); const [draftName, setDraftName] = useState('My ticket edition'); const [exportFormat, setExportFormat] = useState<ExportFormat>('png'); const [draftNotice, setDraftNotice] = useState(''); const cropDragRef = useRef<{ x: number; y: number; cropX: number; cropY: number } | null>(null); const filmIdentity = `${movie ? movieTitle(movie).toLowerCase() : ''} ${(movie?.genres || []).map(g=>g.name.toLowerCase()).join(' ')}`; const styleAccent:Record<CardStyle,string>={Amber:'#f2a33a',Matte:'#ecdcb8',Holo:'#c6a4ff','Film strip':'#f2a33a',Mono:'#f5f5f5',Neon:'#5dffdb'}; const filmAccent=filmIdentity.includes('dune')||filmIdentity.includes('desert')||filmIdentity.includes('western')?'#e6b66b':/horror|thriller|terror|nightmare|conjuring|scream|it:/.test(filmIdentity)?'#d65b58':/romance|romantic|love|pride and prejudice|notebook/.test(filmIdentity)?'#d99aab':/batman|joker|dark knight|noir|crime/.test(filmIdentity)?'#b7c4d6':styleAccent[style]; const previewAccent=accentOverride||filmAccent; 
  useEffect(() => { if (movie?.poster_path) setPosterPath(movie.poster_path); }, [movie?.poster_path]);
  const posterOptions = useMemo(() => movie?.images?.posters?.length ? movie.images.posters.slice(0, 12) : (movie?.poster_path ? [{ file_path: movie.poster_path, width: 500, height: 750, iso_639_1: null }] : []), [movie]);
  const sharedProfileUrl = useMemo(() => `${window.location.origin}/profile?handle=${encodeURIComponent(readWorkspace().profile.handle || 'filmfriend')}`, []);
  const profileQrData = useMemo(() => { try { const code = qrcode(0, 'M'); code.addData(sharedProfileUrl); code.make(); return code.createDataURL(3, 2); } catch { return ''; } }, [sharedProfileUrl]);
  const [filmHistory, setFilmHistory] = useState(() => readWorkspace().diary.filter(entry=>!entry.deletedAt && entry.tmdbId===movieId));
  useEffect(()=>{const sync=()=>setFilmHistory(readWorkspace().diary.filter(entry=>!entry.deletedAt && entry.tmdbId===movieId));sync();window.addEventListener('cinetribe:workspace',sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener('cinetribe:workspace',sync);window.removeEventListener('storage',sync)}},[movieId]);
  const ticketStamps = useMemo(()=>{const stamps:string[]=[];if(filmHistory.length)stamps.push('VIEWED');if(filmHistory.length>1)stamps.push('REWATCH');if(rating>=4)stamps.push('FAVOURITE');if(review.trim())stamps.push('REVIEWED');return stamps},[filmHistory,rating,review]);

  function saveTicketDraft() {
    if (!movie) return;
    const draft: TicketDraft = { id: `${movie.id}-${Date.now()}`, name: draftName.trim() || `${movieTitle(movie)} edition`, posterPath, style, shape, cropX, cropY, cropZoom, format, label, cinema, city, date, seat, party, review, rating, characterEdition, characterImage, accentOverride, typeface, story, createdAt: new Date().toISOString() };
    const next = [draft, ...ticketDrafts].slice(0, 12); try { localStorage.setItem(TICKET_DRAFTS_KEY, JSON.stringify(next)); setTicketDrafts(next); setDraftNotice('Ticket edition saved in this browser.'); } catch { setDraftNotice('Browser storage is full. Remove an older draft or use a smaller character image, then try again.'); }
  }
  function loadTicketDraft(draft: TicketDraft) {
    setPosterPath(draft.posterPath); setStyle(draft.style); setShape(draft.shape); setCropX(draft.cropX); setCropY(draft.cropY); setCropZoom(draft.cropZoom); setFormat(draft.format); setLabel(draft.label); setCinema(draft.cinema); setCity(draft.city); setDate(draft.date); setSeat(draft.seat); setParty(draft.party); setReview(draft.review); setRating(draft.rating); setCharacterEdition(draft.characterEdition); setCharacterImage(draft.characterImage || ''); setAccentOverride(draft.accentOverride || ''); setTypeface(draft.typeface || 'Bricolage Grotesque'); setStory(draft.story); setDraftNotice(`Loaded “${draft.name}”.`);
  }
  function deleteTicketDraft(id: string) { const next = ticketDrafts.filter(d => d.id !== id); try { localStorage.setItem(TICKET_DRAFTS_KEY, JSON.stringify(next)); setTicketDrafts(next); setDraftNotice('Ticket edition deleted.'); } catch { setDraftNotice('Could not update browser storage. Try again.'); } }
  async function loadCharacterArtwork(file?: File) { if (!file) return; if (!file.type.startsWith('image/')) { setDraftNotice('Choose an image file for the character edition.'); return; } if (file.size > 12 * 1024 * 1024) { setDraftNotice('Choose an image under 12 MB.'); return; } try { const source = await new Promise<string>((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(new Error('Could not read this image.')); reader.readAsDataURL(file); }); const image = new Image(); image.src=source; await image.decode(); const canvas=document.createElement('canvas'); const scale=Math.min(1,720/image.width,1000/image.height); canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Could not prepare the character artwork.');ctx.drawImage(image,0,0,canvas.width,canvas.height);setCharacterImage(canvas.toDataURL('image/jpeg',.78));setDraftNotice('Character artwork added. It stays in this browser with your ticket draft.'); } catch { setDraftNotice('This image could not be loaded. Try another image.'); } }
  async function renderCard(outputFormat: ExportFormat = exportFormat): Promise<Blob> {
    if (!movie) throw new Error('Movie details are not ready.');
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = story ? 1920 : 1620;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Your browser could not create a canvas.');
    const w = canvas.width, h = canvas.height;
    // Clip the exported artwork to the selected silhouette so the PNG matches the live preview.
    ctx.save();
    if (shape === 'premiere') { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 72); ctx.clip(); }
    else if (shape === 'future') { ctx.beginPath(); ctx.moveTo(w*.09,0); ctx.lineTo(w*.91,0); ctx.lineTo(w,h*.08); ctx.lineTo(w,h*.92); ctx.lineTo(w*.91,h); ctx.lineTo(w*.09,h); ctx.lineTo(0,h*.92); ctx.lineTo(0,h*.08); ctx.closePath(); ctx.clip(); }
    else if (shape === 'collector') { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 36); ctx.clip(); }
    else if (shape === 'archive') { ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); }
    else { ctx.beginPath(); ctx.roundRect(0, 0, w, h, 34); ctx.clip(); }
    const palettes: Record<CardStyle, { accent: string; glow: string; base: string }> = {
      Amber: { accent: '#f2a33a', glow: '#8b4c1d', base: '#0b0a10' }, Matte: { accent: '#ecdcb8', glow: '#5b554b', base: '#111111' }, Holo: { accent: '#c6a4ff', glow: '#0f6e86', base: '#100c1b' }, 'Film strip': { accent: '#f2a33a', glow: '#522c12', base: '#090909' }, Mono: { accent: '#f5f5f5', glow: '#454545', base: '#050505' }, Neon: { accent: '#5dffdb', glow: '#5a2ca0', base: '#080b15' },
    };
    // Let the film's identity influence the ticket even when the user keeps the same finish.
    const filmName = movieTitle(movie).toLowerCase();
    const genreNames = (movie.genres || []).map(g => g.name.toLowerCase()).join(' ');
    const identity = `${filmName} ${genreNames}`;
    const theme = identity.includes('dune') || identity.includes('desert') || identity.includes('western')
      ? { accent: '#e6b66b', glow: '#8c542b', base: '#17100b', label: 'DESERT RELIC' }
      : /horror|thriller|terror|nightmare|conjuring|scream|it:/.test(identity)
        ? { accent: '#d65b58', glow: '#4b171e', base: '#09090d', label: 'MIDNIGHT PASS' }
        : /romance|romantic|love|pride and prejudice|notebook/.test(identity)
          ? { accent: '#d99aab', glow: '#642b43', base: '#160b12', label: 'LOVE LETTER' }
          : /batman|joker|dark knight|noir|crime/.test(identity)
            ? { accent: '#b7c4d6', glow: '#263449', base: '#080c13', label: 'NOIR ARCHIVE' }
            : { ...palettes[style], label: 'CINEMA MEMORY' };
    const palette = { accent: accentOverride || theme.accent, glow: theme.glow, base: theme.base };
    ctx.fillStyle = palette.base; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * .8, h * .58, 20, w * .8, h * .58, w * .8); glow.addColorStop(0, palette.glow); glow.addColorStop(1, palette.base); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    const imagePath = posterPath || movie.poster_path;
    let posterLoaded = false;
    if (imagePath) {
      const posterUrl = /^https?:\/\//i.test(imagePath) ? imagePath : tmdbImage(imagePath, 'original');
      let localPosterUrl: string | null = null;
      const image = new Image();
      image.decoding = 'async';
      image.crossOrigin = 'anonymous';
      try {
        // First fetch the bytes so the canvas stays origin-clean. Some browsers/CDN
        // combinations reject fetch even while the preview image is visible.
        try {
          const response = await fetch(posterUrl, { mode: 'cors', cache: 'force-cache', signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw new Error(`Poster server responded with ${response.status}.`);
          localPosterUrl = URL.createObjectURL(await response.blob());
          image.src = localPosterUrl;
          if (typeof image.decode === 'function') await image.decode();
          else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Poster decode failed')); });
          posterLoaded = true;
        } catch {
          if (localPosterUrl) URL.revokeObjectURL(localPosterUrl);
          localPosterUrl = null;
          // Retry as a CORS-enabled image element; never draw a non-CORS image because
          // it would taint the canvas and make PNG export impossible.
          image.src = '';
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve(); image.onerror = () => reject(new Error('Poster unavailable'));
            image.src = posterUrl;
          });
          posterLoaded = true;
        }
      } catch {
        // Export must still work when TMDB's image CDN is temporarily unavailable.
        // The artwork becomes an original cinematic title treatment instead.
        posterLoaded = false;
      }
      if (posterLoaded) {
        // Always cover the poster viewport. Zooming below 100% used to expose
        // empty pixels and make the downloaded artwork appear to escape its frame.
        const scale = Math.max(w / image.width, h * .69 / image.height) * Math.max(1, cropZoom / 100);
        const iw = image.width * scale, ih = image.height * scale;
        const drawX = (w - iw) * (cropX / 100), drawY = (h * .69 - ih) * (cropY / 100);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h * .69); ctx.clip();
        ctx.drawImage(image, drawX, drawY, iw, ih); ctx.restore();
      } else {
        ctx.save();
        const art = ctx.createLinearGradient(0, 0, w, h * .7); art.addColorStop(0, palette.glow); art.addColorStop(.55, palette.base); art.addColorStop(1, '#21152d');
        ctx.fillStyle = art; ctx.fillRect(0, 0, w, h * .69);
        ctx.globalAlpha = .35; ctx.strokeStyle = palette.accent; ctx.lineWidth = 2;
        for (let ring = 0; ring < 8; ring++) { ctx.beginPath(); ctx.ellipse(w * .72, h * .29, 90 + ring * 44, 130 + ring * 35, -.28, 0, Math.PI * 2); ctx.stroke(); }
        ctx.globalAlpha = 1; ctx.restore();
      }
      if (localPosterUrl) URL.revokeObjectURL(localPosterUrl);
    }
    const gradient = ctx.createLinearGradient(0, h * .25, 0, h * .72); gradient.addColorStop(0, 'rgba(11,10,16,0)'); gradient.addColorStop(.45, 'rgba(11,10,16,.55)'); gradient.addColorStop(1, palette.base); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    // Signature design: a collector's cinema artifact with perforated edges,
    // a vertical admission stub, foil-like orbital lines and a unique serial seal.
    ctx.strokeStyle = `${palette.accent}99`; ctx.lineWidth = 3;
    if (shape === 'premiere') { ctx.beginPath(); ctx.roundRect(28, 28, w - 56, h - 56, 72); ctx.stroke(); }
    else if (shape === 'future') { ctx.beginPath(); ctx.moveTo(120,34); ctx.lineTo(w-120,34); ctx.lineTo(w-34,120); ctx.lineTo(w-34,h-120); ctx.lineTo(w-120,h-34); ctx.lineTo(120,h-34); ctx.lineTo(34,h-120); ctx.lineTo(34,120); ctx.closePath(); ctx.stroke(); }
    else if (shape === 'collector') { ctx.beginPath(); ctx.roundRect(44, 34, w - 88, h - 68, 36); ctx.stroke(); }
    else if (shape === 'archive') { ctx.strokeRect(52, 52, w - 104, h - 104); ctx.strokeRect(66, 66, w - 132, h - 132); }
    else ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.save(); ctx.setLineDash([9, 13]); ctx.strokeStyle = `${palette.accent}99`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w - 158, 110); ctx.lineTo(w - 158, h - 115); ctx.stroke(); ctx.restore();
    for (let y = 78; y < h - 70; y += 64) { ctx.fillStyle = palette.base; ctx.beginPath(); ctx.arc(34, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(w - 34, y, 8, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.globalAlpha = .38; ctx.strokeStyle = palette.accent; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(w - 91, h * .23, 25 + i * 14, 75 + i * 12, .22, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = palette.accent; ctx.font = '700 25px "DM Sans"'; ctx.letterSpacing = '6px'; ctx.fillText(`C I N E T R I B E   /   ${shape.toUpperCase()} / ${theme.label}`, 72, 94); ctx.letterSpacing = '0px';
    // A unique, deterministic micro-pattern makes each exported ticket feel collectible.
    const serial = `${String(movie.id).padStart(6, '0')}-${date.replaceAll('-', '').slice(2)}`;
    ctx.fillStyle = palette.accent; ctx.font = '700 15px "DM Sans"'; ctx.fillText(`RELIC ${serial}`, w - 142, h - 86);
    const title = movieTitle(movie); let titleSize = 86; ctx.font = `800 ${titleSize}px "${typeface}"`; while (ctx.measureText(title).width > w - 144 && titleSize > 42) { titleSize -= 2; ctx.font = `800 ${titleSize}px "${typeface}"`; }
    ctx.fillStyle = '#fff8e9'; ctx.fillText(title, 72, h * .55, w - 144); ctx.fillStyle = '#c7c0cd'; ctx.font = '500 28px "DM Sans"'; const meta = [movieYear(movie), movie.runtime ? `${movie.runtime} MIN` : '', movie.genres?.slice(0, 2).map(g => g.name.toUpperCase()).join(' · ')].filter(Boolean).join('   /   '); ctx.fillText(meta, 76, h * .55 + 52);
    ctx.fillStyle = palette.accent; ctx.font = '700 23px "DM Sans"'; ctx.letterSpacing = '5px'; ctx.fillText(label.toUpperCase().slice(0, 45), 76, h * .55 + 122); ctx.letterSpacing = '0px';
    if(ticketStamps.length){ctx.font='700 15px "DM Sans"';let stampX=w-340;for(const stamp of ticketStamps.slice(0,3)){const stampW=ctx.measureText(stamp).width+24;ctx.fillStyle=`${palette.accent}24`;ctx.strokeStyle=`${palette.accent}99`;ctx.lineWidth=2;roundRect(ctx,stampX,h*.13,stampW,34,12);ctx.fill();ctx.stroke();ctx.fillStyle=palette.accent;ctx.fillText(stamp,stampX+12,h*.13+22);stampX+=stampW+8;}}
    if (party.trim()) { ctx.fillStyle = '#e8e1ed'; ctx.font = '500 26px "DM Sans"'; ctx.fillText(`WITH ${party.toUpperCase().slice(0, 52)}`, 76, h * .55 + 174); }
    // Export only the selected screening format. The old nine-format grid was
    // copied into every downloaded ticket, making the keepsake look like an editor UI.
    const badgeY = h * .55 + (party.trim() ? 230 : 188);
    const badgeText = format.toUpperCase();
    ctx.font = '700 24px "DM Sans"';
    const badgeWidth = Math.min(w - 152, Math.max(170, ctx.measureText(badgeText).width + 56));
    ctx.fillStyle = `${palette.accent}24`; ctx.strokeStyle = `${palette.accent}cc`; ctx.lineWidth = 2;
    roundRect(ctx, 76, badgeY, badgeWidth, 58, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.accent; ctx.fillText(badgeText, 104, badgeY + 37, badgeWidth - 48);
    const footerY = h - 135; ctx.fillStyle = '#e6deea'; ctx.font = '600 23px "DM Sans"'; ctx.fillText([date, cinema, city, seat ? `SEAT ${seat}` : ''].filter(Boolean).join('   ·   ').toUpperCase().slice(0, 90) || 'YOUR NEXT CINEMA MEMORY', 76, footerY, w - 270); ctx.fillStyle = palette.accent; ctx.font = '700 19px "DM Sans"'; ctx.fillText(`FORMAT SELECTED  /  ${format}`, 76, h - 82);
    if (characterEdition.trim()) { ctx.fillStyle = palette.accent; ctx.font = '700 21px "DM Sans"'; ctx.fillText(`CHARACTER EDITION / ${characterEdition.trim().toUpperCase().slice(0, 36)}`, 76, h - 48); }
    if (review.trim()) { ctx.fillStyle = '#fff8e9'; ctx.font = '700 24px "DM Sans"'; ctx.fillText('MY CINEMA MEMORY', 76, h - 250); if (rating) { ctx.fillStyle = palette.accent; ctx.font = '700 25px "DM Sans"'; ctx.fillText('★'.repeat(rating) + '☆'.repeat(5-rating), 76, h - 210); } ctx.fillStyle = '#d8d0df'; ctx.font = '400 23px "DM Sans"'; const words = review.slice(0, 300).split(' '); let line = '', lineY = h - (rating ? 165 : 205); for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > w - 152) { ctx.fillText(line, 76, lineY); line = word; lineY += 34; if (lineY > h - 145) break; } else line = test; } if (line && lineY <= h - 145) ctx.fillText(line, 76, lineY); }
    if (style === 'Film strip') { ctx.fillStyle = palette.base; for (let y = 52; y < h - 52; y += 46) { ctx.fillRect(20, y, 20, 24); ctx.fillRect(w - 40, y, 20, 24); } }
    ctx.restore();
    return exportCanvas(canvas, outputFormat);
  }
  async function renderBackCard(outputFormat: ExportFormat = exportFormat): Promise<Blob> {
    if (!movie) throw new Error('Movie details are not ready.');
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = story ? 1920 : 1620;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Your browser could not create a canvas.');
    const w = canvas.width, h = canvas.height;
    ctx.save();
    if(shape==='premiere'){ctx.beginPath();ctx.roundRect(0,0,w,h,72);ctx.clip();}
    else if(shape==='future'){ctx.beginPath();ctx.moveTo(w*.09,0);ctx.lineTo(w*.91,0);ctx.lineTo(w,h*.08);ctx.lineTo(w,h*.92);ctx.lineTo(w*.91,h);ctx.lineTo(w*.09,h);ctx.lineTo(0,h*.92);ctx.lineTo(0,h*.08);ctx.closePath();ctx.clip();}
    else if(shape==='collector'){ctx.beginPath();ctx.roundRect(0,0,w,h,36);ctx.clip();}
    else if(shape==='classic'){ctx.beginPath();ctx.roundRect(0,0,w,h,34);ctx.clip();}
    const palettes: Record<CardStyle, { accent: string; base: string }> = { Amber: { accent:'#f2a33a',base:'#100d15' }, Matte:{accent:'#ecdcb8',base:'#111111'}, Holo:{accent:'#c6a4ff',base:'#100c1b'}, 'Film strip':{accent:'#f2a33a',base:'#090909'}, Mono:{accent:'#f5f5f5',base:'#050505'}, Neon:{accent:'#5dffdb',base:'#080b15'} };
    const colors = { ...palettes[style], accent: accentOverride || palettes[style].accent }; ctx.fillStyle = colors.base; ctx.fillRect(0,0,w,h);
    const glow = ctx.createRadialGradient(w*.5,h*.22,10,w*.5,h*.22,w*.8); glow.addColorStop(0,`${colors.accent}40`); glow.addColorStop(1,colors.base); ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=`${colors.accent}bb`;ctx.lineWidth=4;
    if(shape==='future'){ctx.beginPath();ctx.moveTo(w*.09,0);ctx.lineTo(w*.91,0);ctx.lineTo(w,h*.08);ctx.lineTo(w,h*.92);ctx.lineTo(w*.91,h);ctx.lineTo(w*.09,h);ctx.lineTo(0,h*.92);ctx.lineTo(0,h*.08);ctx.closePath();ctx.stroke();}
    else if(shape==='premiere'||shape==='collector'){ctx.beginPath();ctx.roundRect(28,28,w-56,h-56,shape==='premiere'?72:36);ctx.stroke();}
    else {ctx.strokeRect(34,34,w-68,h-68);if(shape==='archive')ctx.strokeRect(52,52,w-104,h-104);}
    ctx.fillStyle=colors.accent;ctx.font='700 24px "DM Sans"';ctx.letterSpacing='6px';ctx.fillText('Cinéon  /  REVERSE EDITION',76,112);ctx.letterSpacing='0px';
    if(characterImage){try{const art=new Image();art.src=characterImage;await art.decode();const bx=w*.61,by=h*.16,bw=w*.29,bh=h*.32,scale=Math.max(bw/art.width,bh/art.height),iw=art.width*scale,ih=art.height*scale;ctx.save();ctx.beginPath();ctx.roundRect(bx,by,bw,bh,28);ctx.clip();ctx.drawImage(art,bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);ctx.restore();}catch{/* Optional character artwork; keep the text-only reverse if decoding fails. */}}
    ctx.fillStyle='#fff8e9';ctx.font=`800 68px "${typeface}"`;ctx.fillText(movieTitle(movie).slice(0,30),76,230,characterImage?w*.48:w-152);
    if(characterEdition.trim()){ctx.fillStyle=colors.accent;ctx.font='700 24px "DM Sans"';ctx.fillText('CHARACTER EDITION',76,310);ctx.fillStyle='#fff8e9';ctx.font=`800 52px "${typeface}"`;ctx.fillText(characterEdition.trim().slice(0,34),76,380,w-152);}
    if(review.trim()){ctx.fillStyle='#e5deea';ctx.font='400 28px "DM Sans"';let line='',y=story?530:480;for(const word of review.slice(0,300).split(/\s+/)){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>(characterImage?w*.48:w-152)){ctx.fillText(line,76,y);line=word;y+=40;if(y>h*.55)break;}else line=test;}if(line&&y<=h*.55)ctx.fillText(line,76,y);}
    const qr = qrcode(0,'M'); qr.addData(sharedProfileUrl); qr.make();const qrSize=220,qrX=(w-qrSize)/2,qrY=h-qrSize-220,moduleCount=qr.getModuleCount(),moduleSize=qrSize/moduleCount;
    ctx.fillStyle='#fff8e9';ctx.fillRect(qrX-18,qrY-18,qrSize+36,qrSize+36);ctx.fillStyle='#111018';for(let row=0;row<moduleCount;row++)for(let col=0;col<moduleCount;col++)if(qr.isDark(row,col))ctx.fillRect(qrX+col*moduleSize,qrY+row*moduleSize,Math.ceil(moduleSize),Math.ceil(moduleSize));
    ctx.fillStyle=colors.accent;ctx.font='700 20px "DM Sans"';ctx.textAlign='center';ctx.fillText('SCAN TO OPEN Cinéon PROFILE',w/2,qrY+qrSize+62);ctx.textAlign='left';
    ctx.fillStyle='#bdb4c7';ctx.font='500 22px "DM Sans"';ctx.fillText([date,cinema,city,seat?`SEAT ${seat}`:''].filter(Boolean).join('  ·  ').toUpperCase().slice(0,90),76,h-92,w-152);
    ctx.restore();
    return exportCanvas(canvas, outputFormat);
  }
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  async function download() { setBusy(true); try { const blob = flipped ? await renderBackCard(exportFormat) : await renderCard(exportFormat); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const requestedMeta = EXPORT_FORMATS.find(item => item.value === exportFormat) || EXPORT_FORMATS[0]; const exportMeta = blob.type === 'image/png' && exportFormat === 'webp' ? EXPORT_FORMATS[0] : requestedMeta; a.href = url; a.download = `CINÉON-${(movie ? movieTitle(movie) : 'ticket').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${flipped ? 'reverse' : format.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${story ? '-story' : ''}.${exportMeta.extension}`; a.click(); if (!('download' in a)) window.open(url, '_blank', 'noopener'); window.setTimeout(() => URL.revokeObjectURL(url), 10000); recordCardExport(movie ? movieTitle(movie) : 'Unknown', `${format} · ${exportMeta.extension.toUpperCase()}`); updateWorkspace(d => d.cardExports.push({ title: movie ? movieTitle(movie) : 'Unknown', format: `${format} · ${exportMeta.extension.toUpperCase()}`, createdAt: new Date().toISOString() })); } catch (error) { alert(error instanceof Error ? error.message : 'Card export failed.'); } finally { setBusy(false); } }
  async function share() { try { const blob = flipped ? await renderBackCard(exportFormat) : await renderCard(exportFormat); const requestedMeta = EXPORT_FORMATS.find(item => item.value === exportFormat) || EXPORT_FORMATS[0]; const exportMeta = blob.type === 'image/png' && exportFormat === 'webp' ? EXPORT_FORMATS[0] : requestedMeta; const file = new File([blob], `CINÉON-ticket-${flipped ? 'reverse' : 'front'}.${exportMeta.extension}`, { type: exportMeta.mime }); if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ title: movie ? movieTitle(movie) : 'My Cinéon ticket', text: `My ${format} cinema ticket`, files: [file] }); else await download(); } catch (error) { if (error instanceof Error && error.name !== 'AbortError') alert(error.message); } }
  if (query.isLoading) return <div className="page"><div className="detail-skeleton"/></div>;
  if (query.isError || !movie) return <div className="page"><h2>Card studio could not load.</h2><p>{query.error instanceof Error ? query.error.message : 'Try again from the movie page.'}</p><button className="primary-button" onClick={() => navigate('/')}>Back to discover</button></div>;
  return <div className="page studio-page"><button className="back-button" onClick={() => navigate(`/movie/${movie.id}`)}><ArrowLeft size={16}/> Back to movie</button><div className="studio-heading"><div><div className="eyebrow"><Ticket size={14}/> THE SIGNATURE FEATURE</div><h1>Make it <em>your</em> ticket.</h1><p>Build a cinema memory worth keeping.</p></div><label className="story-toggle"><input type="checkbox" checked={story} onChange={e => setStory(e.target.checked)}/> Story size · 9:16</label></div><div className="studio-layout"><section className="ticket-stage"><div className={`ticket-card ticket-shape-${shape} style-${style.toLowerCase().replace(' ', '-')} ${flipped ? 'flipped' : ''} depth-${depth}`} style={{ '--ticket-accent': previewAccent, '--ticket-font': typeface } as CSSProperties} onMouseMove={event => { if (depth === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const r = event.currentTarget.getBoundingClientRect(); const rx = (event.clientY-r.top)/r.height-.5; const ry = (event.clientX-r.left)/r.width-.5; event.currentTarget.style.setProperty('--tilt-x', `${-rx*(depth==='cinematic'?8:3)}deg`); event.currentTarget.style.setProperty('--tilt-y', `${ry*(depth==='cinematic'?8:3)}deg`); }} onMouseLeave={event => { event.currentTarget.style.setProperty('--tilt-x','0deg'); event.currentTarget.style.setProperty('--tilt-y','0deg'); }}><div className="ticket-card-front"><div className={`ticket-card-image depth-art depth-art-${depth} crop-draggable`} role="img" aria-label="Poster crop preview; drag to reposition artwork" title="Drag to reposition poster" style={{ backgroundImage: `linear-gradient(to bottom,rgba(11,10,16,.08),rgba(11,10,16,.05) 28%,#0b0a10 75%),url("${tmdbImage(posterPath, 'w780')}")`, backgroundPosition: `${cropX}% ${cropY}%`, backgroundSize: `${Math.max(100, cropZoom)}% auto`, backgroundRepeat: 'no-repeat', touchAction: 'none' }} onPointerDown={event => { if (event.button !== 0 && event.pointerType === 'mouse') return; cropDragRef.current = { x: event.clientX, y: event.clientY, cropX, cropY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { const origin = cropDragRef.current; if (!origin) return; const bounds = event.currentTarget.getBoundingClientRect(); setCropX(Math.max(0, Math.min(100, origin.cropX - (event.clientX-origin.x)/Math.max(1,bounds.width)*100))); setCropY(Math.max(0, Math.min(100, origin.cropY - (event.clientY-origin.y)/Math.max(1,bounds.height)*100))); }} onPointerUp={() => { cropDragRef.current = null; }} onPointerCancel={() => { cropDragRef.current = null; }}/><div className="ticket-card-content"><div className="ticket-kicker">Cinéon <span>NO. {String(movie.id).padStart(5, '0')}</span></div><h2>{movieTitle(movie)}</h2><div className="ticket-meta">{movieYear(movie)}{movie.runtime ? ` · ${movie.runtime} MIN` : ''}</div><div className="ticket-label">{label || 'YOUR CINEMA MEMORY'}</div>{ticketStamps.length>0&&<div className="ticket-stamps">{ticketStamps.map(stamp=><span key={stamp}>{stamp}</span>)}</div>}{party && <div className="ticket-party">WITH {party}</div>}<div className="ticket-format-grid">{FORMATS.slice(0, 9).map(item => <button className={format === item ? 'chosen' : ''} key={item} onClick={() => setFormat(item)}>{item}</button>)}</div><div className="ticket-footer"><span>{date || 'YOUR DATE'}<br/><b>{cinema || 'YOUR CINEMA'}</b></span><span>{city || 'YOUR CITY'}<br/><b>{seat ? `SEAT ${seat}` : format}</b></span></div></div></div><div className="ticket-card-back"><div className="ticket-kicker">YOUR CINEMA MEMORY</div><h2>{movieTitle(movie)}</h2><p>{label}</p>{characterEdition && <div className="character-edition"><span>CHARACTER EDITION</span><strong>{characterEdition}</strong><small>Fan-created personal design</small></div>}{profileQrData && <img className="profile-qr-preview" src={profileQrData} alt="Scannable QR code linking to the Cinéon profile page"/>}<small className="qr-caption">Scan to open Cinéon's profile page · no login credentials embedded</small><div className="fake-barcode" aria-label="Ticket serial barcode">▥ ▥ ▥ ▥ ▥ ▥ ▥ ▥ ▥ ▥</div><p>{[date, cinema, city, seat && `Seat ${seat}`].filter(Boolean).join(' · ')}</p><button className="secondary-button" onClick={() => setFlipped(false)}><RotateCcw size={15}/> Flip back</button></div></div><button className="flip-button" onClick={() => setFlipped(!flipped)}><RotateCcw size={15}/> {flipped ? 'Show ticket front' : 'Flip ticket over'}</button><p className="preview-note">PREVIEW · {story ? '1080 × 1920 STORY' : '1080 × 1620 TICKET'} · EXPORT USES THE SHOWN SIDE AND SELECTED FORMAT</p><section className="memory-preview"><div className="memory-preview-top"><span>✦ &nbsp; MY CINEMA MEMORY</span><span>{rating ? '★'.repeat(rating) : 'YOUR NOTE'}</span></div><p>{review.trim() || 'Your two- or three-sentence review will become part of this keepsake.'}</p></section></section><aside className="studio-controls"><div className="control-section"><div className="control-title"><span>01</span><h3>Choose your poster</h3></div><div className="poster-picker">{posterOptions.map(poster => <button className={posterPath === poster.file_path ? 'selected' : ''} key={poster.file_path} onClick={() => setPosterPath(poster.file_path)} aria-label="Choose poster"><img src={tmdbImage(poster.file_path, 'w185')} alt="Alternate movie poster"/></button>)}</div></div><div className="control-section"><div className="control-title"><span>02</span><h3>Frame your artwork</h3></div><p className="control-hint">Drag directly on the ticket artwork, or use the precision controls below. The framing values are used by every export format.</p><label className="field-label">Horizontal position <output>{cropX}%</output><input type="range" min="0" max="100" value={cropX} onChange={e => setCropX(Number(e.target.value))}/></label><label className="field-label">Vertical position <output>{cropY}%</output><input type="range" min="0" max="100" value={cropY} onChange={e => setCropY(Number(e.target.value))}/></label><label className="field-label">Artwork zoom <output>{cropZoom}%</output><input type="range" min="100" max="180" value={cropZoom} onChange={e => setCropZoom(Number(e.target.value))}/></label><button type="button" className="secondary-button crop-reset" onClick={() => { setCropX(50); setCropY(38); setCropZoom(100); }}><RotateCcw size={14}/> Reset crop</button></div><div className="control-section"><div className="control-title"><span>03</span><h3>Choose ticket silhouette</h3></div><div className="shape-options">{SHAPES.map(item => <button type="button" key={item.id} className={shape === item.id ? 'selected' : ''} onClick={() => setShape(item.id)}>{item.label}</button>)}</div></div><div className="control-section"><div className="control-title"><span>04</span><h3>Bring the poster to life</h3></div><label className="field-label">Cinematic depth<select value={depth} onChange={e => setDepth(e.target.value as typeof depth)}><option value="off">Off · flat artwork</option><option value="subtle">Subtle · elegant parallax</option><option value="cinematic">Cinematic · deeper movement</option></select></label><p className="control-hint">Move your pointer over the ticket to see layered perspective. Poster separation varies by artwork.</p></div><div className="control-section"><div className="control-title"><span>05</span><h3>Make it yours</h3></div><label className="field-label">Your label<input value={label} onChange={e => setLabel(e.target.value)} maxLength={45} placeholder="ONE FOR THE BIG SCREEN"/></label><label className="field-label">Watch party names<input value={party} onChange={e => setParty(e.target.value)} maxLength={52} placeholder="Who’s coming with you?"/></label><div className="field-pair"><label className="field-label">Date<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label><label className="field-label">Seat<input value={seat} onChange={e => setSeat(e.target.value)} maxLength={12} placeholder="G12"/></label></div><label className="field-label">Cinema<input value={cinema} onChange={e => setCinema(e.target.value)} maxLength={60} placeholder="Cinema name"/></label><label className="field-label">City<input value={city} onChange={e => setCity(e.target.value)} maxLength={40} placeholder="Your city"/></label></div><div className="control-section"><div className="control-title"><span>06</span><h3>Add your memory</h3></div><label className="field-label">Your 2–3 sentence review<textarea value={review} onChange={e => setReview(e.target.value)} maxLength={300} rows={4} placeholder="What stayed with you after the credits?"/><small className="character-count">{review.length}/300 · Optional, saved on your exported ticket</small></label><div className="rating-picker" aria-label="Personal rating">{[1,2,3,4,5].map(n => <button type="button" key={n} className={rating>=n?'active':''} onClick={() => setRating(rating===n?0:n)} aria-label={`${n} stars`}>★</button>)}<span>{rating ? `${rating}/5` : 'Optional rating'}</span></div></div><div className="control-section"><div className="control-title"><span>07</span><h3>Pick a finish</h3></div><div className="style-options">{STYLES.map(item => <button key={item} className={`style-option ${style === item ? 'selected' : ''} swatch-${item.toLowerCase().replace(' ', '-')}`} onClick={() => setStyle(item)}>{item}</button>)}</div><div className="field-pair ticket-type-controls"><label className="field-label">Accent colour<input type="color" value={accentOverride || '#f2a33a'} onChange={e=>setAccentOverride(e.target.value)} aria-label="Custom ticket accent colour"/></label><label className="field-label">Title typeface<select value={typeface} onChange={e=>setTypeface(e.target.value)}><option>Bricolage Grotesque</option><option>DM Sans</option><option>Georgia</option><option>Arial</option></select></label></div><button type="button" className="secondary-button" onClick={()=>setAccentOverride('')}>Use film-inspired accent</button></div><div className="control-section"><div className="control-title"><span>08</span><h3>Character edition reverse</h3></div><label className="field-label">Character name<input value={characterEdition} onChange={e => setCharacterEdition(e.target.value)} maxLength={36} placeholder="e.g. Paul Atreides"/></label><label className="field-label">Character artwork (optional)<input type="file" accept="image/*" onChange={e=>void loadCharacterArtwork(e.target.files?.[0])}/></label>{characterImage && <div className="character-artwork-preview"><img src={characterImage} alt="Selected character artwork"/><button type="button" className="secondary-button" onClick={()=>setCharacterImage('')}>Remove artwork</button></div>}<p className="control-hint">Use artwork you own or are authorised to use. Character editions are fan-created and not officially endorsed.</p></div><div className="control-section ticket-save-section"><div className="control-title"><span>09</span><h3>Save your editions</h3></div><label className="field-label">Edition name<input value={draftName} onChange={e => setDraftName(e.target.value)} maxLength={60} placeholder="My ticket edition"/></label><button type="button" className="secondary-button" onClick={saveTicketDraft}>Save this ticket design</button>{draftNotice && <p className="control-hint" role="status">{draftNotice}</p>}{ticketDrafts.filter(d => d.id.startsWith(`${movie.id}-`)).length > 0 && <div className="saved-ticket-list">{ticketDrafts.filter(d => d.id.startsWith(`${movie.id}-`)).map(d => <div key={d.id}><button type="button" onClick={() => loadTicketDraft(d)}>{d.name}<small>{new Date(d.createdAt).toLocaleDateString()}</small></button><button type="button" aria-label={`Delete ${d.name}`} onClick={() => deleteTicketDraft(d.id)}>×</button></div>)}</div>}</div><div className="control-section export-format-section"><div className="control-title"><span>10</span><h3>Export your ticket</h3></div><label className="field-label">File format<select value={exportFormat} onChange={e=>setExportFormat(e.target.value as ExportFormat)} aria-label="Ticket export format">{EXPORT_FORMATS.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><p className="control-hint">PNG, JPEG, WebP and PDF are rendered exports. SVG wraps the ticket artwork in an SVG image container; it does not convert the lettering into editable vector paths.</p></div><div className="studio-actions"><button className="primary-button" onClick={() => { setReveal(true); window.setTimeout(() => setReveal(false), 950); }}><Ticket size={17}/>{reveal ? 'Your memory is ready' : 'Preview ticket reveal'}</button><button className="primary-button" onClick={download} disabled={busy}><Download size={17}/>{busy ? 'Rendering ticket…' : `Download ${flipped ? 'reverse' : 'front'} ${EXPORT_FORMATS.find(item=>item.value===exportFormat)?.extension.toUpperCase() || 'PNG'}`}</button><button className="secondary-button" onClick={share}><Share2 size={17}/> Share ticket</button></div><p className="studio-footnote">Posters and movie metadata are provided by TMDB. Your ticket is generated locally in your browser.</p></aside></div>{reveal && <div className="ticket-reveal-toast" role="status"><span>✦</span><strong>Another memory added to your cinematic universe.</strong><small>{movieTitle(movie)} · Cinéon</small></div>}</div>;
}
