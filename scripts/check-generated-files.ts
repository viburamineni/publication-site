import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_COUNT = 18_000;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const distDirectory = path.resolve(process.cwd(), 'dist');

interface FileDetails {
  path: string;
  size: number;
}

async function walk(directory: string): Promise<FileDetails[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: FileDetails[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(entryPath)));
    if (entry.isFile()) files.push({ path: entryPath, size: (await stat(entryPath)).size });
  }
  return files;
}

const files = await walk(distDirectory);
const oversized = files.filter((file) => file.size > MAX_FILE_SIZE);
const imageFiles = files.filter((file) => /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.path));
const totalImageSize = imageFiles.reduce((total, file) => total + file.size, 0);
const largest = [...files].sort((left, right) => right.size - left.size)[0];

console.log(`Generated file count: ${files.length}`);
console.log(`Generated image files: ${imageFiles.length}`);
console.log(`Generated image bytes: ${totalImageSize}`);
console.log(
  `Largest generated file: ${largest ? `${path.relative(distDirectory, largest.path)} (${largest.size} bytes)` : 'none'}`,
);

if (files.length > MAX_FILE_COUNT) {
  throw new Error(
    `Generated file count ${files.length} exceeds the safety limit of ${MAX_FILE_COUNT}.`,
  );
}
if (oversized.length > 0) {
  throw new Error(
    `Generated files exceed the 20 MiB safety limit:\n${oversized
      .map((file) => `${path.relative(distDirectory, file.path)} (${file.size} bytes)`)
      .join('\n')}`,
  );
}
