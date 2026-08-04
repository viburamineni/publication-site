import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ExportField {
  id: string;
  name: string;
  validations: unknown[];
  defaultValue?: Record<string, unknown>;
}

interface ExportContentType {
  sys: { id: string };
  description: string;
  fields: ExportField[];
}

interface ContentModelExport {
  exportedAt: string;
  spaceId: string;
  environmentId: string;
  contentTypes: ExportContentType[];
  projection?: {
    source: string;
    migration: string;
    appliedToContentful: boolean;
  };
}

const sourceName = 'content-model-2026-07-30.json';
const outputName = 'content-model-expected-after-005.json';
const exportDirectory = path.resolve('contentful/exports');
const sourcePath = path.join(exportDirectory, sourceName);
const outputPath = path.join(exportDirectory, outputName);

const model = JSON.parse(await readFile(sourcePath, 'utf8')) as ContentModelExport;
const byId = new Map(model.contentTypes.map((contentType) => [contentType.sys.id, contentType]));

const article = byId.get('article');
const book = byId.get('book');
const homepage = byId.get('homepage');
if (!article || !book || !homepage) {
  throw new Error('The source export is missing Article, Book, or Homepage.');
}

const articleFields = new Map(article.fields.map((field) => [field.id, field]));
const storyLabel = articleFields.get('articleType');
const primaryCategory = articleFields.get('primaryCategory');
if (!storyLabel || !primaryCategory) {
  throw new Error('The source export is missing Article classification fields.');
}

storyLabel.name = 'Does this story need a special label?';
storyLabel.validations = [
  {
    in: ['Standard story', 'Brief', 'Analysis', 'Opinion', 'Review'],
  },
];
storyLabel.defaultValue = { 'en-US': 'Standard story' };
primaryCategory.name = 'Where does this story belong?';

book.description = 'Optional book metadata for Reviews that are about a book.';
const featuredReviews = homepage.fields.find((field) => field.id === 'featuredBookReviews');
if (!featuredReviews) {
  throw new Error('The source export is missing Homepage featured reviews.');
}
featuredReviews.name = 'Featured reviews';

model.projection = {
  source: sourceName,
  migration: 'contentful/migrations/005-simplify-story-labels.cjs',
  appliedToContentful: false,
};

await writeFile(outputPath, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Wrote projected model snapshot: ${path.relative(process.cwd(), outputPath)}`);
