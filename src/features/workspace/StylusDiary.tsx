import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Download, Eraser, PenLine, Share2, ShieldCheck } from 'lucide-react';

type StrokePoint = { x: number; y: number; pressure: number };
type InkStroke = { points: StrokePoint[]; color: string; width: number };
type DiaryPage = { id: string; title: string; date: string; strokes: InkStroke[] };
const STORAGE_KEY = 'reelora.stylus-diary.v1';
const blankPage = (index: number): DiaryPage => ({ id: `page-${Date.now()}-${index}`, title: `Page ${index + 1}`, date: new Date().toISOString().slice(0, 10), strokes: [] });
function loadPages(): DiaryPage[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; return Array.isArray(parsed) && parsed.length ? parsed : [blankPage(0)]; }
  catch { return [blankPage(0)]; }
}

export default function StylusDiary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const strokeRef = useRef<InkStroke | null>(null);
  const [pages, setPages] = useState<DiaryPage[]>(loadPages);
  const pagesRef = useRef<DiaryPage[]>(pages);
  const [pageIndex, setPageIndex] = useState(0);
  const [turning, setTurning] = useState<'next' | 'previous' | null>(null);
  const [penSeen, setPenSeen] = useState(false);
  const [ink, setInk] = useState('#25212a');
  const [width, setWidth] = useState(2.4);
  const [status, setStatus] = useState('S Pen / active stylus input only. Finger and mouse drawing are disabled.');
  const page = pages[pageIndex] ?? pages[0];

  const persist = useCallback((next: DiaryPage[]) => {
    pagesRef.current = next; setPages(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStatus('Saved on this device.'); }
    catch { setStatus('This page could not be saved. Browser storage may be full.'); }
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || !page) return;
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const widthPx = Math.max(1, Math.floor(rect.width * dpr));
    const heightPx = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== widthPx || canvas.height !== heightPx) { canvas.width = widthPx; canvas.height = heightPx; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of page.strokes) {
      if (!stroke.points.length) continue;
      ctx.beginPath(); ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      stroke.points.forEach((point, index) => { const x = point.x * rect.width; const y = point.y * rect.height; if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      if (stroke.points.length === 1) { const p = stroke.points[0]; ctx.lineTo(p.x * rect.width + .1, p.y * rect.height + .1); }
      ctx.stroke();
    }
  }, [page]);

  useEffect(() => { redraw(); }, [redraw]);
  useEffect(() => { if (typeof ResizeObserver === 'undefined') { redraw(); return; } const observer = new ResizeObserver(redraw); if (hostRef.current) observer.observe(hostRef.current); return () => observer.disconnect(); }, [redraw]);

  const pointFrom = (event: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)), pressure: event.pressure || .5 };
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== 'pen') { setStatus(event.pointerType === 'touch' ? 'Finger input is intentionally disabled here. Use an S Pen or active stylus.' : 'Mouse drawing is disabled. Use an S Pen or active stylus.'); return; }
    event.preventDefault(); setPenSeen(true); drawingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFrom(event);
    strokeRef.current = { points: [point], color: ink, width: width * Math.max(.55, event.pressure || .6) };
    const rect = event.currentTarget.getBoundingClientRect(); const ctx = event.currentTarget.getContext('2d');
    if (ctx) { ctx.beginPath(); ctx.strokeStyle = ink; ctx.lineWidth = strokeRef.current.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.moveTo(point.x * rect.width, point.y * rect.height); }
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || event.pointerType !== 'pen' || !strokeRef.current) return;
    event.preventDefault(); const point = pointFrom(event); strokeRef.current.points.push(point);
    const rect = event.currentTarget.getBoundingClientRect(); const ctx = event.currentTarget.getContext('2d');
    if (ctx) { ctx.lineTo(point.x * rect.width, point.y * rect.height); ctx.stroke(); }
  };
  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const stroke = strokeRef.current; strokeRef.current = null;
    if (stroke) persist(pagesRef.current.map((p, i) => i === pageIndex ? { ...p, strokes: [...p.strokes, stroke] } : p));
  };
  const changePage = (direction: 'next' | 'previous') => {
    if (turning) return;
    const nextIndex = pageIndex + (direction === 'next' ? 1 : -1);
    if (nextIndex < 0) return;
    if (nextIndex >= pages.length) persist([...pages, blankPage(pages.length)]);
    setTurning(direction);
    window.setTimeout(() => { setPageIndex(nextIndex); setTurning(null); }, 360);
  };
  const clearPage = () => { if (!window.confirm('Erase all ink on this page?')) return; persist(pages.map((p, i) => i === pageIndex ? { ...p, strokes: [] } : p)); };
  const exportPage = async (share: boolean) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) { setStatus('Could not export this page.'); return; }
    const file = new File([blob], `Cinéon-diary-${pageIndex + 1}.png`, { type: 'image/png' });
    if (share && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try { await navigator.share({ title: page.title, text: 'A page from my Cinéon stylus diary', files: [file] }); setStatus('Diary page shared.'); return; } catch (e) { if (e instanceof Error && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url); setStatus('Diary page exported as PNG.');
  };

  return <section className="page-wrap stylus-diary-page">
    <div className="page-heading"><div><p className="eyebrow">Cinéon · PEN-FIRST JOURNAL</p><h1>Real <em>Diary.</em></h1><p className="page-description">A quiet paper-like journal for your S Pen. Ink accepts active pen input only—touch and mouse never draw here.</p></div><span className="stylus-badge"><PenLine size={16}/> STYLUS ONLY</span></div>
    <div className="stylus-toolbar glass-panel"><div className="stylus-status"><ShieldCheck size={16}/><span>{penSeen ? 'Stylus detected · pen input active' : 'Waiting for S Pen / active stylus input'}</span></div><label>Ink colour<select value={ink} onChange={e=>setInk(e.target.value)}><option value="#25212a">Midnight</option><option value="#173e78">Royal blue</option><option value="#a02e39">Crimson</option><option value="#24714b">Forest</option></select></label><label>Pen size<input type="range" min="1" max="6" step=".2" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label><button className="secondary-button" onClick={clearPage}><Eraser size={15}/> Erase page</button></div>
    <div className={`real-page-book ${turning ? `page-turn-${turning}` : ''}`}>
      <div className="real-paper"><div className="paper-margin"/><div className="paper-header"><span>Cinéon · FILM NOTES</span><span>{page.date}</span></div><input className="paper-title" value={page.title} maxLength={70} aria-label="Diary page title" onChange={e=>persist(pages.map((p,i)=>i===pageIndex?{...p,title:e.target.value}:p))}/><div className="paper-canvas-host" ref={hostRef}><canvas ref={canvasRef} className="stylus-ink-canvas" aria-label="Stylus-only handwriting canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onContextMenu={e=>e.preventDefault()} /></div><div className="paper-footer"><span>PAGE {(pageIndex+1).toString().padStart(2,'0')}</span><span>ONLY THE MOMENTS THAT MATTER</span></div></div>
      {turning && <div className="page-turn-sheet" aria-hidden="true"/>}
    </div>
    <div className="stylus-page-controls"><button className="secondary-button" disabled={pageIndex===0||!!turning} onClick={()=>changePage('previous')}><ArrowLeft size={16}/> Previous page</button><span>{pageIndex+1} / {pages.length}</span><button className="primary-button" disabled={!!turning} onClick={()=>changePage('next')}>Turn page <ArrowRight size={16}/></button><button className="secondary-button" onClick={()=>void exportPage(false)}><Download size={16}/> Export image</button><button className="secondary-button" onClick={()=>void exportPage(true)}><Share2 size={16}/> Share page</button></div>
    <p className="stylus-help" role="status">{status} Pages are stored locally on this device. Sharing uses your phone's native share sheet when supported.</p>
  </section>;
}
