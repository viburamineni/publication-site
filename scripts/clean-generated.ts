import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const generatedDirectory = path.resolve(process.cwd(), 'public', 'generated');
const expectedSuffix = `${path.sep}public${path.sep}generated`;

if (!generatedDirectory.endsWith(expectedSuffix)) {
  throw new Error(`Refusing to clean unexpected path: ${generatedDirectory}`);
}

if (process.env.PUBLICATION_PRESERVE_GENERATED === 'true') {
  await mkdir(generatedDirectory, { recursive: true });
  console.log('Preserving cached generated Contentful images for this build.');
} else {
  await rm(generatedDirectory, { recursive: true, force: true });
}
