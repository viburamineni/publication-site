import { publicationSchema } from './schemas';
import type { Image, Publication } from './types';
import { estimateReadingMinutes } from '../utilities/content';

const generatedAt = '2026-07-28T16:00:00.000Z';

function image(id: string, file: string, alt: string, caption: string): Image {
  return {
    id,
    alt,
    caption,
    credit: 'Demonstration artwork by the publication team',
    rightsNote: 'Original demonstration artwork. Replace before launch.',
    focalPoint: 'center',
    width: 1440,
    height: 900,
    sources: [{ src: `/demo/${file}`, width: 1440, height: 900, type: 'image/svg+xml' }],
  };
}

const harborImage = image(
  'image-harbor',
  'harbor-study.svg',
  'Abstract illustration of a harbor, cranes, and tide gauges',
  'A demonstration study of a working harbor. This article is fictional.',
);
const civicImage = image(
  'image-civic',
  'civic-study.svg',
  'Abstract illustration of a circular public chamber',
  'A demonstration study of a public assembly. This article is fictional.',
);
const networkImage = image(
  'image-network',
  'network-study.svg',
  'Abstract illustration of switching nodes connected by cables',
  'A demonstration study of a regional network. This article is fictional.',
);
const bookImage = image(
  'image-book',
  'book-study.svg',
  'Abstract illustration of an open book',
  'A demonstration study for a fictional book review.',
);

function paragraph(text: string) {
  return {
    nodeType: 'paragraph',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  };
}

function heading(text: string) {
  return {
    nodeType: 'heading-2',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  };
}

function body(first: string, second: string, final: string) {
  return {
    nodeType: 'document' as const,
    data: {},
    content: [
      paragraph(first),
      heading('What the demonstration is testing'),
      paragraph(second),
      {
        nodeType: 'blockquote',
        data: {},
        content: [
          paragraph(
            'This quotation is fictional and appears only to test the publication’s editorial components.',
          ),
        ],
      },
      paragraph(final),
    ],
  };
}

const articleDrafts = [
  {
    id: 'article-harbor',
    title: 'A harbor town tests a quieter way to prepare for the next high tide',
    slug: 'harbor-town-tests-quieter-preparation',
    dek: 'A fictional demonstration report follows planners, dockworkers, and residents as they compare small defenses with one large barrier.',
    articleType: 'News' as const,
    body: body(
      'This is fictional demonstration content created to test the publication. No people, agencies, or events described here are real.',
      'The page needs to carry a long headline, explanatory copy, credited art, sources, and related reading without losing the front page’s rhythm.',
      'Before launch, editors should replace this story and every demonstration asset with verified reporting and properly licensed imagery.',
    ),
    heroImage: harborImage,
    authorIds: ['author-mara', 'author-jules'],
    primaryCategoryId: 'category-world',
    topicIds: ['topic-climate'],
    sourceIds: ['source-demo'],
    relatedArticleIds: ['article-budget', 'article-network'],
    publicationDate: '2026-07-28T13:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-budget',
    title: 'The fictional budget vote turns on one overlooked maintenance line',
    slug: 'fictional-budget-vote-maintenance-line',
    dek: 'A demonstration analysis shows how the site distinguishes explanatory reporting from straight news at a glance.',
    articleType: 'Analysis' as const,
    body: body(
      'The council and its budget are invented for this demonstration. The article exists to test analysis pages and archive filters.',
      'Analysis should explain evidence and uncertainty without borrowing the visual voice of opinion. Labels, author context, and source notes do that work.',
      'No claim in this fixture should be interpreted as reporting about a real municipality.',
    ),
    heroImage: civicImage,
    authorIds: ['author-jules'],
    primaryCategoryId: 'category-politics',
    topicIds: ['topic-public-finance'],
    sourceIds: ['source-demo'],
    relatedArticleIds: ['article-harbor'],
    publicationDate: '2026-07-27T15:30:00.000Z',
    featured: true,
  },
  {
    id: 'article-network',
    title: 'Inside a made-up regional network’s twelve-hour resilience drill',
    slug: 'regional-network-resilience-drill',
    dek: 'A fictional long-form feature tests deep reading, section headings, embedded quotations, and responsive editorial art.',
    articleType: 'Long Form' as const,
    body: body(
      'The network, operators, and drill in this story are fictional. The article is deliberately structured like a long read so the build can test typography.',
      'Long-form pages use a narrower measure, an optional topic trail, and stable heading anchors. All core content remains available without client JavaScript.',
      'Editors should remove this fixture before the site is opened to search engines.',
    ),
    heroImage: networkImage,
    authorIds: ['author-mara'],
    primaryCategoryId: 'category-technology',
    topicIds: ['topic-infrastructure'],
    sourceIds: ['source-demo'],
    relatedArticleIds: ['article-harbor'],
    publicationDate: '2026-07-26T12:00:00.000Z',
    featured: false,
  },
  {
    id: 'article-opinion',
    title: 'Opinion: A public meeting should leave room for the unfinished sentence',
    slug: 'opinion-room-for-unfinished-sentence',
    dek: 'A fictional guest column demonstrates a clearly marked opinion voice without presenting sample writing as real testimony.',
    articleType: 'Opinion' as const,
    body: body(
      'This guest column is fictional and does not represent the views of a real person or organization.',
      'The opinion treatment is deliberately different from analysis, but it uses the same accessible structure, source controls, and author archive.',
      'Published opinion should disclose relevant context and should never be styled so similarly to news that a reader could confuse the two.',
    ),
    heroImage: civicImage,
    authorIds: ['author-iman'],
    primaryCategoryId: 'category-opinion',
    topicIds: [],
    sourceIds: [],
    relatedArticleIds: ['article-budget'],
    publicationDate: '2026-07-25T09:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-book',
    title: 'Book review: A fictional atlas asks who gets to draw the boundary',
    slug: 'book-review-fictional-atlas-boundary',
    dek: 'A demonstration review tests book metadata, review structured data, cover art, and the Books archive without endorsing a real title.',
    articleType: 'Book Review' as const,
    body: body(
      'Both the book and this review are fictional. They exist solely to exercise the site’s review content model.',
      'A book review connects editorial argument with structured information such as publisher, year, and ISBN while remaining visually part of the same publication.',
      'Replace this entry with a reviewed, fact-checked title before launch.',
    ),
    heroImage: bookImage,
    authorIds: ['author-mara'],
    primaryCategoryId: 'category-books',
    topicIds: [],
    bookId: 'book-atlas',
    sourceIds: ['source-demo'],
    relatedArticleIds: [],
    publicationDate: '2026-07-24T14:00:00.000Z',
    featured: true,
  },
  {
    id: 'article-brief',
    title: 'Demonstration brief: Archive search completes a scheduled index check',
    slug: 'demonstration-brief-search-index-check',
    dek: 'This short fictional item confirms that news briefs can publish without a hero image and still appear in search and RSS.',
    articleType: 'News Brief' as const,
    body: body(
      'This brief is test content. It records no real event.',
      'The brief exercises the only article format that does not require a hero image.',
      'Its search result, feed entry, and category link should behave exactly like longer stories.',
    ),
    authorIds: ['author-jules'],
    primaryCategoryId: 'category-technology',
    topicIds: [],
    sourceIds: [],
    relatedArticleIds: ['article-network'],
    publicationDate: '2026-07-23T18:00:00.000Z',
    featured: false,
  },
];

export const fixturePublication: Publication = publicationSchema.parse({
  settings: {
    publicationName: 'The Public Ledger',
    shortName: 'Ledger',
    tagline: 'Reporting in the open.',
    description:
      'A demonstration publication for accountable news, explanatory reporting, criticism, and public argument.',
    textLogo: 'The Public Ledger',
    footerSections: [
      {
        title: 'Publication',
        links: [
          { label: 'About', url: '/about/' },
          { label: 'Staff', url: '/staff/' },
          { label: 'Latest', url: '/latest/' },
        ],
      },
      {
        title: 'Editions',
        links: [
          { label: 'Analysis', url: '/analysis/' },
          { label: 'Opinion', url: '/opinion/' },
          { label: 'Books', url: '/books/' },
        ],
      },
    ],
    contactLinks: [],
    socialLinks: [],
    copyrightText: 'The Public Ledger. Demonstration edition.',
    launched: false,
    defaultSocialImage: harborImage,
  },
  homepage: {
    leadArticleId: 'article-harbor',
    secondaryLeadArticleIds: ['article-budget', 'article-network'],
    breakingArticleIds: ['article-brief'],
    featuredAnalysisIds: ['article-budget'],
    featuredOpinionIds: ['article-opinion'],
    featuredBookReviewIds: ['article-book'],
    featuredTopicId: 'topic-climate',
    categoryOrderIds: [
      'category-world',
      'category-politics',
      'category-technology',
      'category-culture',
    ],
    announcement: '',
  },
  articles: articleDrafts.map((article) => ({
    ...article,
    previousSlugs: [],
    correctionNote: '',
    readingMinutes: estimateReadingMinutes(JSON.stringify(article.body)),
  })),
  authors: [
    {
      id: 'author-mara',
      name: 'Mara Vale',
      slug: 'mara-vale',
      position: 'Demonstration editor',
      shortBiography: 'A fictional staff editor used to test author pages and article bylines.',
      fullBiography:
        'Mara Vale is a fictional person created for this demonstration. Replace this profile before launch.',
      areasOfCoverage: ['World', 'Culture', 'Books'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-jules',
      name: 'Jules North',
      slug: 'jules-north',
      position: 'Demonstration reporter',
      shortBiography: 'A fictional reporter used to test staff listings and co-bylines.',
      fullBiography:
        'Jules North is a fictional person created for this demonstration. Replace this profile before launch.',
      areasOfCoverage: ['Politics', 'Economics', 'Technology'],
      socialLinks: [],
      designation: 'Staff',
      status: 'Active',
    },
    {
      id: 'author-iman',
      name: 'Iman Reed',
      slug: 'iman-reed',
      position: 'Guest contributor',
      shortBiography: 'A fictional guest writer used to test contributor separation.',
      fullBiography:
        'Iman Reed is a fictional person created for this demonstration. Replace this profile before launch.',
      areasOfCoverage: ['Opinion'],
      socialLinks: [],
      designation: 'Guest',
      status: 'Active',
    },
  ],
  categories: [
    ['category-world', 'World', 'world', 'Reporting across borders and shared systems.', 0, 'pine'],
    [
      'category-politics',
      'Politics',
      'politics',
      'Institutions, elections, and public power.',
      1,
      'oxblood',
    ],
    [
      'category-economics',
      'Economics',
      'economics',
      'Work, markets, public finance, and trade.',
      2,
      'clay',
    ],
    [
      'category-technology',
      'Technology',
      'technology',
      'Infrastructure, tools, and digital power.',
      3,
      'river',
    ],
    [
      'category-culture',
      'Culture',
      'culture',
      'Arts, ideas, language, and public life.',
      4,
      'plum',
    ],
    [
      'category-analysis',
      'Analysis',
      'analysis',
      'Evidence-led explanation and context.',
      5,
      'graphite',
    ],
    ['category-opinion', 'Opinion', 'opinion', 'Arguments and guest perspectives.', 6, 'oxblood'],
    ['category-books', 'Books', 'books', 'Reviews, criticism, and reading lists.', 7, 'clay'],
  ].map(([id, name, slug, description, displayOrder, colorToken]) => ({
    id,
    name,
    slug,
    description,
    displayOrder,
    showInNavigation: true,
    colorToken,
  })),
  topics: [
    {
      id: 'topic-climate',
      name: 'Living with higher water',
      slug: 'living-with-higher-water',
      summary:
        'A fictional demonstration topic about adaptation, infrastructure, and public choices.',
      timelineIntroduction: 'Follow the reporting in chronological order.',
      featured: true,
      heroImage: harborImage,
      relatedArticleIds: ['article-harbor'],
    },
    {
      id: 'topic-public-finance',
      name: 'The public balance sheet',
      slug: 'public-balance-sheet',
      summary: 'A demonstration topic for budgets, maintenance, and long-term public obligations.',
      timelineIntroduction: '',
      featured: false,
      relatedArticleIds: ['article-budget'],
    },
    {
      id: 'topic-infrastructure',
      name: 'Systems under strain',
      slug: 'systems-under-strain',
      summary: 'A demonstration topic for the networks and physical systems people rely on.',
      timelineIntroduction: '',
      featured: false,
      heroImage: networkImage,
      relatedArticleIds: ['article-network'],
    },
  ],
  sources: [
    {
      id: 'source-demo',
      title: 'Demonstration source record',
      publisher: 'The Public Ledger test fixture',
      url: 'https://example.com/demonstration-source',
      publicationDate: '2026-07-20T00:00:00.000Z',
      accessDate: '2026-07-28T00:00:00.000Z',
      note: 'Fictional source metadata for interface testing only.',
    },
  ],
  books: [
    {
      id: 'book-atlas',
      title: 'The Unfinished Atlas',
      author: 'Nora Field',
      publisher: 'Demonstration Press',
      publicationYear: 2026,
      isbn: '9780000000002',
      informationUrl: 'https://example.com/unfinished-atlas',
      coverImage: bookImage,
    },
  ],
  generatedAt,
  source: 'fixtures',
});
