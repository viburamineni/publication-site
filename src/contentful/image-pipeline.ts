import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Image } from './types';

interface RawAsset {
  sys?: { id?: string; version?: number; publishedVersion?: number };
  fields?: {
    file?: {
      url?: string;
      details?: { image?: { width?: number; height?: number } };
      contentType?: string;
    };
  };
}

interface RawImageFields {
  asset?: RawAsset;
  alternativeText?: string;
  caption?: string;
  photographerOrSourceCredit?: string;
  rightsOrUsageNote?: string;
  focalPointDescription?: string;
}

function safeAssetUrl(value: string): URL {
  const url = new URL(value.startsWith('//') ? `https:${value}` : value);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('ctfassets.net')) {
    throw new Error(`Image asset must use Contentful's HTTPS asset host: ${url.toString()}`);
  }
  return url;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function materializeContentfulImage(
  id: string,
  fields: RawImageFields,
): Promise<Image> {
  const asset = fields.asset;
  const assetId = asset?.sys?.id;
  const file = asset?.fields?.file;
  const originalWidth = file?.details?.image?.width;
  const originalHeight = file?.details?.image?.height;

  if (!assetId || !file?.url || !originalWidth || !originalHeight) {
    throw new Error(`Image entry ${id} has an unresolved or incomplete asset reference.`);
  }
  if (!fields.alternativeText?.trim()) {
    throw new Error(`Image entry ${id} is missing required alternative text.`);
  }
  if (!fields.photographerOrSourceCredit?.trim()) {
    throw new Error(`Image entry ${id} is missing required photographer or source credit.`);
  }

  const sourceUrl = safeAssetUrl(file.url);
  const version = asset.sys?.publishedVersion ?? asset.sys?.version ?? 1;
  const requestedWidths = [480, 960, 1440]
    .filter((width) => width <= originalWidth)
    .concat(originalWidth < 480 ? [originalWidth] : [])
    .filter((width, index, values) => values.indexOf(width) === index)
    .slice(0, 4);
  const generatedDirectory = path.join(process.cwd(), 'public', 'generated');
  await mkdir(generatedDirectory, { recursive: true });

  const sources = [];
  for (const width of requestedWidths) {
    const height = Math.max(1, Math.round((originalHeight / originalWidth) * width));
    const filename = `${assetId}-${version}-${width}.webp`;
    const outputPath = path.join(generatedDirectory, filename);

    if (!(await fileExists(outputPath))) {
      const transformedUrl = new URL(sourceUrl);
      transformedUrl.searchParams.set('w', String(width));
      transformedUrl.searchParams.set('fm', 'webp');
      transformedUrl.searchParams.set('q', '82');
      const response = await fetch(transformedUrl, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) {
        throw new Error(
          `Image entry ${id} failed to download asset ${assetId}: ${response.status} ${response.statusText}`,
        );
      }
      await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
    }

    sources.push({
      src: `/generated/${filename}`,
      width,
      height,
      type: 'image/webp',
    });
  }

  return {
    id,
    alt: fields.alternativeText,
    caption: fields.caption ?? '',
    credit: fields.photographerOrSourceCredit,
    rightsNote: fields.rightsOrUsageNote ?? '',
    focalPoint: fields.focalPointDescription ?? 'center',
    width: originalWidth,
    height: originalHeight,
    sources,
  };
}
