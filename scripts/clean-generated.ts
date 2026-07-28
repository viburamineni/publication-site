import { rm } from 'node:fs/promises';
import path from 'node:path';

const generatedDirectory = path.resolve(process.cwd(), 'public', 'generated');
const expectedSuffix = `${path.sep}public${path.sep}generated`;

if (!generatedDirectory.endsWith(expectedSuffix)) {
  throw new Error(`Refusing to clean unexpected path: ${generatedDirectory}`);
}

await rm(generatedDirectory, { recursive: true, force: true });
