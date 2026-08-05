import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ExportField {
  id: string;
  omitted: boolean;
  disabled: boolean;
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

const sourceName = 'content-model-expected-after-007.json';
const outputName = 'content-model-expected-after-008.json';
const exportDirectory = path.resolve('contentful/exports');
const sourcePath = path.join(exportDirectory, sourceName);
const outputPath = path.join(exportDirectory, outputName);

const model = JSON.parse(await readFile(sourcePath, 'utf8')) as ContentModelExport;
const article = model.contentTypes.find((contentType) => contentType.sys.id === 'article');
if (!article) throw new Error('The source export is missing Article.');

const internalNotes = article.fields.find((field) => field.id === 'internalNotes');
if (!internalNotes) throw new Error('The source export is missing Article.internalNotes.');
internalNotes.omitted = true;

model.projection = {
  source: sourceName,
  migration: 'contentful/migrations/008-protect-internal-notes.cjs',
  appliedToContentful: false,
};

await writeFile(outputPath, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Wrote projected model snapshot: ${path.relative(process.cwd(), outputPath)}`);
