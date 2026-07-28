import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const action = process.argv[2];
const directory = path.resolve(process.cwd(), 'dist', '__search-anchor');

if (action === 'create') {
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'index.html'),
    '<!doctype html><html lang="en"><head><title>Search anchor</title></head><body><main data-pagefind-body>publicationsearchanchorsentinel</main></body></html>\n',
  );
} else if (action === 'remove') {
  await rm(directory, { recursive: true, force: true });
} else {
  throw new Error('Expected pagefind-anchor action: create or remove.');
}
