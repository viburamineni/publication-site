import { describe, expect, it, vi } from 'vitest';
import { inspectContentfulImage, type RawImageFields } from '../../src/contentful/image-pipeline';
import { IMAGE_FANOUT_BUDGET, normalizeContentfulEntries } from '../../src/contentful/normalize';

const { materializeContentfulImage } = vi.hoisted(() => ({
  materializeContentfulImage: vi.fn(async (id: string) => ({
    id,
    alt: `Alternative text for ${id}`,
    caption: '',
    credit: 'Fictional Staff',
    rightsNote: '',
    focalPoint: 'center',
    width: 1_440,
    height: 810,
    sources: [
      {
        src: `/generated/${id}-1-1440.webp`,
        width: 1_440,
        height: 810,
        type: 'image/webp',
      },
    ],
  })),
}));

vi.mock('../../src/contentful/image-pipeline', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/contentful/image-pipeline')>()),
  materializeContentfulImage,
}));

function link(id: string) {
  return { sys: { id } };
}

function rawEntry(type: string, id: string, fields: object) {
  return {
    sys: { id, contentType: { sys: { id: type } } },
    fields,
  } as never;
}

function rawImageFields(id: string, sourceBytes = 1_024): RawImageFields {
  return {
    asset: {
      sys: { id: `asset-${id}`, publishedVersion: 7 },
      fields: {
        file: {
          url: `//images.ctfassets.net/example/${id}.jpg`,
          details: { size: sourceBytes, image: { width: 1_440, height: 810 } },
          contentType: 'image/jpeg',
        },
      },
    },
    alternativeText: `Alternative text for ${id}`,
    photographerOrSourceCredit: 'Fictional Staff',
  };
}

function rawImageEntry(id: string, sourceBytes = 1_024) {
  return rawEntry('image', id, rawImageFields(id, sourceBytes));
}

function rawCategoryEntry(id: string, imageId: string) {
  return rawEntry('category', id, { headerImage: link(imageId) });
}

function rawSettingsEntry(defaultSocialImage?: string) {
  return rawEntry('siteSettings', 'site-settings', {
    publicationName: 'The Example Edition',
    shortName: 'Example',
    tagline: 'A fictional publication fixture.',
    description: 'A fictional publication used only for test coverage.',
    textLogo: 'EXAMPLE',
    footerSections: [],
    contactLinks: [],
    socialLinks: [],
    copyrightText: 'Fictional test publication.',
    siteLaunched: false,
    ...(defaultSocialImage ? { defaultSocialImage: link(defaultSocialImage) } : {}),
  });
}

describe('Contentful image fan-out preflight', () => {
  it('materializes only reachable images after a normal manifest passes preflight', async () => {
    materializeContentfulImage.mockClear();

    const publication = await normalizeContentfulEntries([
      rawSettingsEntry('image-used'),
      rawImageEntry('image-used'),
      rawEntry('image', 'image-unreachable', {}),
    ]);

    expect(publication.settings.defaultSocialImage?.id).toBe('image-used');
    expect(materializeContentfulImage).toHaveBeenCalledTimes(1);
    expect(materializeContentfulImage).toHaveBeenCalledWith(
      'image-used',
      expect.objectContaining({ alternativeText: 'Alternative text for image-used' }),
    );
  });

  it('rejects excessive reachable image count before any materialization', async () => {
    materializeContentfulImage.mockClear();
    const count = IMAGE_FANOUT_BUDGET.maxImages + 1;
    const entries = Array.from({ length: count }, (_, index) => [
      rawImageEntry(`image-${index}`),
      rawCategoryEntry(`category-${index}`, `image-${index}`),
    ]).flat();

    await expect(normalizeContentfulEntries([rawSettingsEntry(), ...entries])).rejects.toThrow(
      new RegExp(`${count} images.*${IMAGE_FANOUT_BUDGET.maxImages}`),
    );
    expect(materializeContentfulImage).not.toHaveBeenCalled();
  });

  it('rejects excessive generated variants before any materialization', async () => {
    materializeContentfulImage.mockClear();
    const count = Math.floor(IMAGE_FANOUT_BUDGET.maxVariants / 3) + 1;
    const entries = Array.from({ length: count }, (_, index) => [
      rawImageEntry(`image-${index}`),
      rawCategoryEntry(`category-${index}`, `image-${index}`),
    ]).flat();

    await expect(normalizeContentfulEntries([rawSettingsEntry(), ...entries])).rejects.toThrow(
      new RegExp(`${count * 3} generated variants.*${IMAGE_FANOUT_BUDGET.maxVariants}`),
    );
    expect(materializeContentfulImage).not.toHaveBeenCalled();
  });

  it('rejects excessive projected aggregate bytes before any materialization', async () => {
    materializeContentfulImage.mockClear();
    const imageCount = 9;
    const sourceBytes = 20 * 1024 * 1024;
    const entries = Array.from({ length: imageCount }, (_, index) => [
      rawImageEntry(`image-${index}`, sourceBytes),
      rawCategoryEntry(`category-${index}`, `image-${index}`),
    ]).flat();

    await expect(normalizeContentfulEntries([rawSettingsEntry(), ...entries])).rejects.toThrow(
      new RegExp(
        `${imageCount * sourceBytes * 3} bytes.*${IMAGE_FANOUT_BUDGET.maxEstimatedDownloadBytes} bytes`,
      ),
    );
    expect(materializeContentfulImage).not.toHaveBeenCalled();
  });

  it('fails closed on missing byte metadata and keeps each image at four variants or fewer', () => {
    expect(() =>
      inspectContentfulImage('image-missing-size', {
        asset: {
          sys: { id: 'asset-missing-size', publishedVersion: 1 },
          fields: {
            file: {
              url: '//images.ctfassets.net/example/missing-size.jpg',
              details: { image: { width: 1_440, height: 810 } },
            },
          },
        },
        alternativeText: 'Alternative text',
        photographerOrSourceCredit: 'Fictional Staff',
      }),
    ).toThrow(/invalid or missing asset byte metadata/);

    const plan = inspectContentfulImage('image-normal', rawImageFields('image-normal'));
    expect(plan.variantCount).toBe(3);
    expect(plan.variantCount).toBeLessThanOrEqual(4);
  });
});
