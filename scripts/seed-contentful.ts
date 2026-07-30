import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from 'contentful-management';
import { fixturePublication } from '../src/contentful/fixtures';

const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const action = process.argv[2] || 'seed';
const locale = 'en-US';

if (!token || !spaceId) {
  throw new Error('CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID are required.');
}

const client = createClient({ accessToken: token }, { type: 'legacy' });
const space = await client.getSpace(spaceId);
const environment = await space.getEnvironment(environmentId);

const localized = <T>(value: T): Record<string, T> => ({ [locale]: value });
const entryLink = (id: string) => ({ sys: { type: 'Link', linkType: 'Entry', id } });
const assetLink = (id: string) => ({ sys: { type: 'Link', linkType: 'Asset', id } });

function isNotFound(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    ('name' in error || 'sys' in error) &&
    ((error as { name?: string }).name === 'NotFound' ||
      (error as { sys?: { id?: string } }).sys?.id === 'NotFound'),
  );
}

async function getEntry(id: string) {
  try {
    return await environment.getEntry(id);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

async function upsertEntry(contentTypeId: string, id: string, values: Record<string, unknown>) {
  const fields = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, localized(value)]),
  );
  const existing = await getEntry(id);
  if (!existing) {
    return environment.createEntryWithId(contentTypeId, id, { fields });
  }
  existing.fields = fields;
  return existing.update();
}

async function publishEntry(entry: Awaited<ReturnType<typeof upsertEntry>>) {
  if (entry.isPublished() && !entry.isUpdated()) return entry;
  return entry.publish();
}

const imageDefinitions = [
  {
    id: 'image-harbor',
    fileName: 'harbor-study.svg',
    alt: 'Abstract illustration of a harbor, cranes, and tide gauges',
    caption: 'A demonstration study of a working harbor. This article is fictional.',
  },
  {
    id: 'image-civic',
    fileName: 'civic-study.svg',
    alt: 'Abstract illustration of a circular public chamber',
    caption: 'A demonstration study of a public assembly. This article is fictional.',
  },
  {
    id: 'image-network',
    fileName: 'network-study.svg',
    alt: 'Abstract illustration of switching nodes connected by cables',
    caption: 'A demonstration study of a regional network. This article is fictional.',
  },
  {
    id: 'image-book',
    fileName: 'book-study.svg',
    alt: 'Abstract illustration of an open book',
    caption: 'A demonstration study for a fictional book review.',
  },
];

async function ensureImage(definition: (typeof imageDefinitions)[number]) {
  const existing = await getEntry(definition.id);
  if (existing) {
    return publishEntry(existing);
  }

  const file = await readFile(path.resolve(process.cwd(), 'public', 'demo', definition.fileName));
  const asset = await environment.createAssetFromFiles({
    fields: {
      title: localized(`Demonstration ${definition.fileName}`),
      description: localized(definition.alt),
      file: localized({
        contentType: 'image/svg+xml',
        fileName: definition.fileName,
        file: file.toString('utf8'),
      }),
    },
  });
  const processed = await asset.processForAllLocales({
    processingCheckWait: 750,
    processingCheckRetries: 20,
  });
  const publishedAsset = await processed.publish();
  const imageEntry = await upsertEntry('image', definition.id, {
    asset: assetLink(publishedAsset.sys.id),
    alternativeText: definition.alt,
    caption: definition.caption,
    photographerOrSourceCredit: 'Demonstration artwork by the publication team',
    rightsOrUsageNote: 'Original demonstration artwork. Replace before launch.',
    focalPointDescription: 'center',
  });
  return publishEntry(imageEntry);
}

async function seed() {
  for (const image of imageDefinitions) await ensureImage(image);

  for (const author of fixturePublication.authors) {
    await publishEntry(
      await upsertEntry('author', author.id, {
        displayName: author.name,
        slug: author.slug,
        positionOrTitle: author.position,
        shortBiography: author.shortBiography,
        fullBiography: author.fullBiography,
        areasOfCoverage: author.areasOfCoverage,
        socialLinks: author.socialLinks,
        personalWebsite: author.personalWebsite,
        staffOrGuestDesignation: author.designation,
        activeOrFormerStaffDesignation: author.status,
      }),
    );
  }

  for (const category of fixturePublication.categories) {
    await publishEntry(
      await upsertEntry('category', category.id, {
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
        showInNavigation: category.showInNavigation,
        featuredCategoryColorToken: category.colorToken,
      }),
    );
  }

  for (const topic of fixturePublication.topics) {
    await publishEntry(
      await upsertEntry('topic', topic.id, {
        name: topic.name,
        slug: topic.slug,
        summary: topic.summary,
        heroImage: topic.heroImage ? entryLink(topic.heroImage.id) : undefined,
        timelineIntroduction: topic.timelineIntroduction,
        featuredStatus: topic.featured,
      }),
    );
  }

  for (const source of fixturePublication.sources) {
    await publishEntry(
      await upsertEntry('source', source.id, {
        sourceTitle: source.title,
        publisher: source.publisher,
        url: source.url,
        publicationDate: source.publicationDate,
        accessDate: source.accessDate,
        optionalNote: source.note,
      }),
    );
  }

  for (const book of fixturePublication.books) {
    await publishEntry(
      await upsertEntry('book', book.id, {
        title: book.title,
        author: book.author,
        coverImage: book.coverImage ? entryLink(book.coverImage.id) : undefined,
        publisher: book.publisher,
        publicationYear: book.publicationYear,
        isbn: book.isbn,
        externalInformationUrl: book.informationUrl,
      }),
    );
  }

  await upsertEntry('pullQuote', 'pull-quote-demo', {
    quote: 'This quotation is fictional and exists only to test an editorial component.',
    attribution: 'Demonstration fixture',
  });
  await upsertEntry('factBox', 'fact-box-demo', {
    title: 'About this demonstration',
    body: 'Every person, organization, event, and claim in these sample entries is fictional.',
  });

  for (const article of fixturePublication.articles) {
    await upsertEntry('article', article.id, {
      title: article.title,
      slug: article.slug,
      dek: article.dek,
      articleType: article.articleType,
      authors: article.authorIds.map(entryLink),
      primaryCategory: entryLink(article.primaryCategoryId),
      topics: article.topicIds.map(entryLink),
      heroImage: article.heroImage ? entryLink(article.heroImage.id) : undefined,
      body: article.body,
      sources: article.sourceIds.map(entryLink),
      displayPublicationDate: article.publicationDate,
      book: article.bookId ? entryLink(article.bookId) : undefined,
      correctionNote: article.correctionNote,
      previousSlugs: article.previousSlugs,
      featured: article.featured,
      internalNotes: 'Fictional seed content. Do not present as real reporting.',
    });
  }

  await publishEntry(
    await upsertEntry('homepage', 'homepage-default', {
      categoryDisplayOrder: fixturePublication.homepage.categoryOrderIds.map(entryLink),
      optionalAnnouncementStrip:
        'Demonstration edition: every story and person on this site is fictional.',
    }),
  );

  await publishEntry(
    await upsertEntry('siteSettings', 'site-settings-default', {
      publicationName: fixturePublication.settings.publicationName,
      shortName: fixturePublication.settings.shortName,
      tagline: fixturePublication.settings.tagline,
      description: fixturePublication.settings.description,
      textLogo: fixturePublication.settings.textLogo,
      defaultSocialImage: entryLink('image-harbor'),
      navigationCategories: [],
      footerSections: fixturePublication.settings.footerSections,
      contactLinks: fixturePublication.settings.contactLinks,
      socialLinks: fixturePublication.settings.socialLinks,
      copyrightText: fixturePublication.settings.copyrightText,
      siteLaunched: false,
    }),
  );

  console.log('Seeded Contentful foundations and six fictional draft articles.');
}

async function publishSmokeArticle() {
  const entry = await environment.getEntry('article-brief');
  await entry.publish();
  console.log('Published the clearly labeled smoke-test article.');
}

async function unpublishSmokeArticle() {
  const entry = await environment.getEntry('article-brief');
  if (entry.isPublished()) await entry.unpublish();
  console.log('Unpublished the smoke-test article.');
}

if (action === 'seed') await seed();
else if (action === 'publish-test') await publishSmokeArticle();
else if (action === 'unpublish-test') await unpublishSmokeArticle();
else throw new Error(`Unknown action: ${action}`);
