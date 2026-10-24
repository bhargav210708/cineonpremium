import { useEffect, useMemo, useState } from 'react';
import { Award, Brain, CalendarDays, Clapperboard, Compass, Flame, RefreshCw, Sparkles, Ticket } from 'lucide-react';
import { readWorkspace, type WorkspaceData } from '../../lib/workspace';

type Quest = { id: string; title: string; description: string; progress: number; target: number; reward: string };

function useWorkspaceSnapshot() {
  const [data, setData] = useState<WorkspaceData>(() => readWorkspace());
  useEffect(() => {
    const refresh = () => setData(readWorkspace());
    window.addEventListener('cinetribe:workspace', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cinetribe:workspace', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return data;
}

export default function ExperiencePage() {
  const data = useWorkspaceSnapshot();
  const entries = data.diary.filter((entry) => !entry.deletedAt);
  const year = String(new Date().getFullYear());
  const thisYear = entries.filter((entry) => entry.watchedAt.startsWith(year));
  const formatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) => counts.set(entry.format || 'Unspecified', (counts.get(entry.format || 'Unspecified') ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);
  const genreLikeTags = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) => entry.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [entries]);
  const tasteDimensions = useMemo(() => {
    const dimensions = [
      { label: 'Atmosphere', terms: ['atmospheric','dreamy','dark','surreal','cozy','immersive','moody','eerie'] },
      { label: 'Pace', terms: ['slow burn','slow-burn','fast-paced','fast paced','kinetic','meditative','action-packed','action packed'] },
      { label: 'Complexity', terms: ['complex','mind-bending','mind bending','twist','layered','ambiguous','puzzle','thought-provoking','thought provoking'] },
      { label: 'Emotion', terms: ['emotional','moving','heartbreaking','heartwarming','romantic','bittersweet','tender','funny'] },
      { label: 'Scale', terms: ['epic','grand','spectacle','intimate','small-scale','small scale','cosmic','personal'] },
      { label: 'Tone', terms: ['hopeful','bleak','whimsical','grim','playful','satirical','optimistic','melancholic'] },
    ];
    const tags=entries.flatMap(entry=>entry.tags.map(tag=>tag.trim().toLowerCase())).filter(Boolean);
    return dimensions.map(d=>{const matches=tags.filter(tag=>d.terms.some(term=>tag.includes(term)));return {label:d.label,count:matches.length,score:tags.length?Math.min(100,Math.round(matches.length/tags.length*100*2.5)):0,examples:[...new Set(matches)].slice(0,3)};});
  }, [entries]);
  const uniqueCinemas = new Set(entries.map((entry) => entry.cinema.trim()).filter(Boolean)).size;
  const formatsUsed = new Set(entries.map((entry) => entry.format).filter(Boolean)).size;
  const quests: Quest[] = [
    { id: 'first-frame', title: 'First Frame', description: 'Log your first cinema experience.', progress: Math.min(entries.length, 1), target: 1, reward: 'Passport starter stamp' },
    { id: 'format-explorer', title: 'Format Explorer', description: 'Try three different presentation formats.', progress: Math.min(formatsUsed, 3), target: 3, reward: 'Format explorer badge' },
    { id: 'regular', title: 'The Regular', description: 'Log ten screenings in your diary.', progress: Math.min(entries.length, 10), target: 10, reward: 'Frequent viewer badge' },
    { id: 'city-hopper', title: 'Cinema Hopper', description: 'Record visits to three different cinemas.', progress: Math.min(uniqueCinemas, 3), target: 3, reward: 'Cinema hopper stamp' },
    { id: 'year-goal', title: `${year} Film Goal`, description: `Reach your yearly target of ${data.profile.yearlyGoal} logged screenings.`, progress: Math.min(thisYear.length, data.profile.yearlyGoal), target: data.profile.yearlyGoal, reward: 'Year-in-cinema milestone' },
  ];
  const completed = quests.filter((quest) => quest.progress >= quest.target).length;
  const averageRating = entries.length ? entries.reduce((sum, entry) => sum + entry.stars, 0) / entries.length : 0;
  const topFormat = formatCounts[0]?.[0] ?? 'Not enough data yet';
  const recap = `In ${year}, you logged ${thisYear.length} screening${thisYear.length === 1 ? '' : 's'}${formatCounts[0] ? `, with ${topFormat} as your most-used format` : ''}.`;

  return (
    <section className="page-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your cinema, decoded</p>
          <h1>Cinema DNA & quests</h1>
          <p className="page-description">A personal taste profile, collectible milestones and a year-in-cinema recap, calculated from your Cinéon diary.</p>
        </div>
      </div>

      <div className="metric-grid">
        <div className="glass-panel"><span className="muted-small">Diary screenings</span><strong className="metric-value">{entries.length}</strong><span className="entry-meta">Across all years</span></div>
        <div className="glass-panel"><span className="muted-small">Favourite format</span><strong className="metric-value">{topFormat}</strong><span className="entry-meta">Based on your diary</span></div>
        <div className="glass-panel"><span className="muted-small">Average rating</span><strong className="metric-value">{entries.length ? `${averageRating.toFixed(1)} / 5` : '—'}</strong><span className="entry-meta">Your own ratings</span></div>
        <div className="glass-panel"><span className="muted-small">Quest stamps</span><strong className="metric-value">{completed}/{quests.length}</strong><span className="entry-meta">Unlocked milestones</span></div>
      </div>

      <div className="glass-panel" style={{ marginBottom: 18 }}>
        <div className="section-row"><h2><Brain size={20} style={{ verticalAlign: 'middle' }} /> Your Cinema DNA</h2><span className="pill">Personal · local</span></div>
        <p className="muted-copy">This profile uses the entries you have logged. It does not infer genres from TMDB or claim to predict your taste when there is not enough data.</p>
        {formatCounts.length === 0 ? <div className="empty-state"><Clapperboard size={26}/><h3>Your taste profile is waiting</h3><p>Log a screening and select its format to start building your Cinema DNA.</p></div> : <div className="score-list">{formatCounts.slice(0, 6).map(([format, count]) => <div key={format}><span>{format}</span><div className="score-track"><i style={{ width: `${(count / formatCounts[0][1]) * 100}%` }} /></div><b>{count}</b></div>)}</div>}
        <div className="taste-dimensions"><h3>Film DNA dimensions</h3><p className="muted-copy">These signals are calculated only from descriptive tags you chose for diary entries. Untagged films are not guessed.</p>{tasteDimensions.map(d=><div className="taste-dimension" key={d.label}><span>{d.label}</span><div className="score-track"><i style={{width:`${d.score}%`}}/></div><b>{d.count?`${d.count} tag matches`:'—'}</b>{d.examples.length>0&&<small>{d.examples.join(' · ')}</small>}</div>)}</div>
        {genreLikeTags.length > 0 && <div style={{ marginTop: 16 }}><h3>Recurring tags</h3><div className="form-actions">{genreLikeTags.map(([tag, count]) => <span className="pill" key={tag}>{tag} · {count}</span>)}</div></div>}
      </div>

      <div className="glass-panel" style={{ marginBottom: 18 }}>
        <div className="section-row"><h2><Award size={20} style={{ verticalAlign: 'middle' }} /> Cinema quests</h2><span className="pill">{completed} complete</span></div>
        <p className="muted-copy">Quest progress updates from your diary and local cinema reports. Stamps are a gamification layer, not proof of a ticket purchase.</p>
        <div className="badge-grid">{quests.map((quest) => { const done = quest.progress >= quest.target; return <article className={`badge ${done ? 'earned' : ''}`} key={quest.id}><div>{done ? <Award size={19}/> : <Flame size={19}/>}</div><strong>{quest.title}</strong><span>{quest.description}</span><div className="score-track" style={{ width: '100%', marginTop: 10 }}><i style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}/></div><span>{quest.progress}/{quest.target} · {done ? 'Unlocked' : quest.reward}</span></article>; })}</div>
      </div>

      <div className="glass-panel">
        <div className="section-row"><h2><CalendarDays size={20} style={{ verticalAlign: 'middle' }} /> Year in the Dark · {year}</h2><span className="pill">Diary recap</span></div>
        <p className="page-description">{recap}</p>
        <div className="metric-grid">
          <div><span className="muted-small">This year's screenings</span><strong className="metric-value">{thisYear.length}</strong></div>
          <div><span className="muted-small">Cinemas recorded</span><strong className="metric-value">{new Set(thisYear.map((entry) => entry.cinema.trim()).filter(Boolean)).size}</strong></div>
          <div><span className="muted-small">Formats explored</span><strong className="metric-value">{new Set(thisYear.map((entry) => entry.format).filter(Boolean)).size}</strong></div>
          <div><span className="muted-small">Cards exported</span><strong className="metric-value">{data.cardExports.filter((item) => item.createdAt.startsWith(year)).length}</strong></div>
        </div>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="primary-button" onClick={() => window.location.assign('/diary')}><Ticket size={16}/> Log a screening</button>
          <button className="primary-button secondary-button" onClick={() => window.location.assign('/stats')}><Compass size={16}/> Open stats & passport</button>
          <button className="primary-button secondary-button" onClick={() => window.location.reload()}><RefreshCw size={16}/> Refresh recap</button>
          <span className="entry-meta"><Sparkles size={14} style={{ verticalAlign: 'middle' }}/> Based on your local data</span>
        </div>
      </div>
    </section>
  );
}
