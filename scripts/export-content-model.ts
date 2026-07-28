import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from 'contentful-management';

const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';

if (!token || !spaceId) {
  throw new Error('CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID are required.');
}

const client = createClient({ accessToken: token });
const contentTypes = await client.contentType.getMany({
  spaceId,
  environmentId,
  query: { limit: 1000 },
});
const payload = {
  exportedAt: new Date().toISOString(),
  spaceId,
  environmentId,
  contentTypes: contentTypes.items.map((contentType) => ({
    sys: { id: contentType.sys.id, version: contentType.sys.version },
    name: contentType.name,
    description: contentType.description,
    displayField: contentType.displayField,
    fields: contentType.fields,
  })),
};
const outputDirectory = path.resolve(process.cwd(), 'contentful', 'exports');
await mkdir(outputDirectory, { recursive: true });
const filename = `content-model-${new Date().toISOString().slice(0, 10)}.json`;
await writeFile(path.join(outputDirectory, filename), `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `Exported ${contentTypes.items.length} content types to contentful/exports/${filename}.`,
);
