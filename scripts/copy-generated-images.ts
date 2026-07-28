import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const sourceDirectory = path.resolve(process.cwd(), 'public', 'generated');
const outputDirectory = path.resolve(process.cwd(), 'dist', 'generated');
const expectedSourceSuffix = `${path.sep}public${path.sep}generated`;
const expectedOutputSuffix = `${path.sep}dist${path.sep}generated`;

if (
  !sourceDirectory.endsWith(expectedSourceSuffix) ||
  !outputDirectory.endsWith(expectedOutputSuffix)
) {
  throw new Error('Refusing to copy generated images to an unexpected path.');
}

await mkdir(sourceDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });
const files = await readdir(sourceDirectory);
for (const file of files) {
  await cp(path.join(sourceDirectory, file), path.join(outputDirectory, file));
}

console.log(`Copied ${files.length} generated Contentful image variants into dist.`);
