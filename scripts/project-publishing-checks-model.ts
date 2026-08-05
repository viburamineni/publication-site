import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ExportField {
  id: string;
}

interface ExportContentType {
  sys: { id: string };
  fields: ExportField[];
}

interface ContentModelExport {
  contentTypes: ExportContentType[];
  projection?: {
    source: string;
    migration: string;
    appliedToContentful: boolean;
  };
}

const sourceName = 'content-model-expected-after-006.json';
const outputName = 'content-model-expected-after-007.json';
const exportDirectory = path.resolve('contentful/exports');
const sourcePath = path.join(exportDirectory, sourceName);
const outputPath = path.join(exportDirectory, outputName);

const model = JSON.parse(await readFile(sourcePath, 'utf8')) as ContentModelExport;
const article = model.contentTypes.find((contentType) => contentType.sys.id === 'article');
if (!article) throw new Error('The source export is missing Article.');

const markerIndex = article.fields.findIndex((field) => field.id === 'publishingChecks');
if (markerIndex === -1) throw new Error('The source export is missing Article.publishingChecks.');
article.fields.splice(markerIndex, 1);

model.projection = {
  source: sourceName,
  migration: 'contentful/migrations/007-remove-client-readiness-marker.cjs',
  appliedToContentful: false,
};

await writeFile(outputPath, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Wrote projected model snapshot: ${path.relative(process.cwd(), outputPath)}`);
