import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve(process.cwd(), 'dist');

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(entryPath)));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(entryPath);
  }
  return files;
}

function targetPath(href: string): string | undefined {
  if (!href.startsWith('/') || href.startsWith('//')) return undefined;
  const pathname = new URL(href, 'https://example.test').pathname;
  if (path.extname(pathname)) return path.join(distDirectory, pathname);
  return path.join(distDirectory, pathname, 'index.html');
}

const missing: string[] = [];
for (const file of await htmlFiles(distDirectory)) {
  const html = await readFile(file, 'utf8');
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!);
  for (const href of links) {
    const target = targetPath(href);
    if (!target) continue;
    try {
      await access(target);
    } catch {
      missing.push(`${path.relative(distDirectory, file)} -> ${href}`);
    }
  }
}

if (missing.length > 0) {
  throw new Error(`Broken internal links:\n${[...new Set(missing)].join('\n')}`);
}

console.log('Internal link verification passed.');
