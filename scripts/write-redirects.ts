import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { serializeRedirectFile } from './redirect-file';

const source = path.resolve(process.cwd(), 'dist', 'redirects.json');
const destination = path.resolve(process.cwd(), 'dist', '_redirects');
const redirects: unknown = JSON.parse(await readFile(source, 'utf8'));

await writeFile(destination, serializeRedirectFile(redirects));
await rm(source, { force: true });
