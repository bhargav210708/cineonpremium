/** Parse a Letterboxd diary CSV while respecting commas and escaped quotes in fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some(value => value.trim())) rows.push(row); }
  return rows;
}

export interface LetterboxdRow { title: string; watchedAt: string; rating: number; review: string; tags: string[]; }
export function parseLetterboxdDiaryCsv(text: string): LetterboxdRow[] {
  const [header = [], ...rows] = parseCsv(text);
  const columns = new Map(header.map((name, index) => [name.trim().toLowerCase(), index]));
  const at = (...names: string[]) => names.map(name => columns.get(name.toLowerCase())).find(index => index !== undefined);
  const nameIndex = at('name');
  if (nameIndex === undefined) throw new Error('This CSV does not look like a Letterboxd export: the Name column is missing.');
  const dateIndex = at('watched date', 'date');
  const ratingIndex = at('rating');
  const reviewIndex = at('review');
  const tagsIndex = at('tags');
  return rows.flatMap(row => {
    const title = (row[nameIndex] ?? '').trim();
    if (!title) return [];
    const rawDate = dateIndex === undefined ? '' : (row[dateIndex] ?? '').trim();
    const parsedDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : '';
    const rawRating = ratingIndex === undefined ? '' : (row[ratingIndex] ?? '').trim();
    const rating = Number(rawRating);
    return [{
      title,
      watchedAt: parsedDate || new Date().toISOString().slice(0, 10),
      rating: Number.isFinite(rating) && rating >= 0.5 && rating <= 5 ? rating : 0,
      review: reviewIndex === undefined ? '' : (row[reviewIndex] ?? '').slice(0, 2000),
      tags: tagsIndex === undefined ? [] : (row[tagsIndex] ?? '').split('|').map(tag => tag.trim()).filter(Boolean),
    }];
  });
}
