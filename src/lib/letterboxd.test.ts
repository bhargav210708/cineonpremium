import { describe, expect, it } from 'vitest';
import { parseCsv, parseLetterboxdDiaryCsv } from './letterboxd';

describe('Letterboxd CSV import', () => {
  it('keeps commas and escaped quotes inside quoted fields', () => {
    expect(parseCsv('Name,Review\n"A Film","Great, and ""moving""."')).toEqual([
      ['Name', 'Review'], ['A Film', 'Great, and "moving".'],
    ]);
  });
  it('parses diary rows and tags', () => {
    expect(parseLetterboxdDiaryCsv('Date,Name,Year,Letterboxd URI,Rating,Watched Date,Tags,Review\n2025-01-01,Film,2024,https://letterboxd.com/film/film/,4.5,2025-01-02,"imax|sound","Lovely, immersive"')).toEqual([
      { title: 'Film', watchedAt: '2025-01-02', rating: 4.5, review: 'Lovely, immersive', tags: ['imax', 'sound'] },
    ]);
  });
  it('rejects CSVs that are not diary exports', () => {
    expect(() => parseLetterboxdDiaryCsv('Title,Rating\nFilm,4')).toThrow('Name column is missing');
  });
});
