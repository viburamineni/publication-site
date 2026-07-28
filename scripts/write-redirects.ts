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
const lines = [
  '# Generated from published Article.previousSlugs values.',
  ...redirects.map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`),
  '',
];

await writeFile(destination, lines.join('\n'));
await rm(source, { force: true });
