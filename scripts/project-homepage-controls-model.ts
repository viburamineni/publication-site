import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ExportField {
  id: string;
  name: string;
  validations: unknown[];
  omitted: boolean;
  disabled: boolean;
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

const sourceName = 'content-model-2026-08-04.json';
const outputName = 'content-model-expected-after-006.json';
const exportDirectory = path.resolve('contentful/exports');
const sourcePath = path.join(exportDirectory, sourceName);
const outputPath = path.join(exportDirectory, outputName);

const model = JSON.parse(await readFile(sourcePath, 'utf8')) as ContentModelExport;
const homepage = model.contentTypes.find((contentType) => contentType.sys.id === 'homepage');
if (!homepage) throw new Error('The source export is missing Homepage.');

homepage.description =
  'Single front-page curation entry. Latest remains automatic; all other homepage selections live here.';
const fields = new Map(homepage.fields.map((field) => [field.id, field]));

function requireField(id: string): ExportField {
  const field = fields.get(id);
  if (!field) throw new Error(`The source export is missing Homepage.${id}.`);
  return field;
}

const visibleNames: Record<string, string> = {
  leadArticle: 'Featured article',
  secondaryLeadArticles: 'Editor’s picks',
  featuredAnalysis: 'Analysis section',
  featuredOpinions: 'Opinion section',
  featuredBookReviews: 'Books and reviews section',
  featuredTopic: 'Featured topic',
  optionalAnnouncementStrip: 'Homepage announcement',
};
for (const [id, name] of Object.entries(visibleNames)) requireField(id).name = name;

for (const id of [
  'secondaryLeadArticles',
  'featuredAnalysis',
  'featuredOpinions',
  'featuredBookReviews',
]) {
  requireField(id).validations = [{ size: { max: 3 } }];
}

for (const id of ['breakingNewsArticles', 'categoryDisplayOrder']) {
  const field = requireField(id);
  field.omitted = true;
  field.disabled = true;
}

model.projection = {
  source: sourceName,
  migration: 'contentful/migrations/006-clean-homepage-controls.cjs',
  appliedToContentful: true,
};

await writeFile(outputPath, `${JSON.stringify(model, null, 2)}\n`);
console.log(`Wrote projected model snapshot: ${path.relative(process.cwd(), outputPath)}`);
