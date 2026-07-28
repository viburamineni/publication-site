import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface Redirect {
  from: string;
  to: string;
  status: number;
}

const source = path.resolve(process.cwd(), 'dist', 'redirects.json');
const destination = path.resolve(process.cwd(), 'dist', '_redirects');
const redirects = JSON.parse(await readFile(source, 'utf8')) as Redirect[];
const retiredFixtureRedirects = [
  '/articles/harbor-town-tests-quieter-preparation/ /latest/ 301',
  '/articles/fictional-budget-vote-maintenance-line/ /latest/ 301',
  '/articles/regional-network-resilience-drill/ /latest/ 301',
  '/articles/opinion-room-for-unfinished-sentence/ /latest/ 301',
  '/articles/book-review-fictional-atlas-boundary/ /books/ 301',
  '/articles/demonstration-brief-search-index-check/ /latest/ 301',
  '/authors/mara-vale/ /staff/ 301',
  '/authors/jules-north/ /staff/ 301',
  '/authors/iman-reed/ /staff/ 301',
  '/topics/living-with-higher-water/ /latest/ 301',
  '/topics/public-balance-sheet/ /latest/ 301',
  '/topics/systems-under-strain/ /latest/ 301',
];
const lines = [
  '# Generated from published Article.previousSlugs values.',
  '# Retired fixture routes are permanent redirects so stale Pages assets cannot resurface.',
  ...retiredFixtureRedirects,
  ...redirects.map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`),
  '',
];

await writeFile(destination, lines.join('\n'));
await rm(source, { force: true });
