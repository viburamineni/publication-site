'use strict';

const slugValidation = [
  { unique: true },
  {
    regexp: {
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      flags: null,
    },
    message: 'Use lowercase words separated by hyphens.',
  },
];

function entryLink(typeIds) {
  return {
    type: 'Link',
    linkType: 'Entry',
    validations: [{ linkContentType: typeIds }],
  };
}

function entryArray(typeIds, size) {
  return {
    type: 'Array',
    items: entryLink(typeIds),
    validations: size ? [{ size }] : [],
  };
}

function symbolList() {
  return { type: 'Array', items: { type: 'Symbol', validations: [] } };
}

function addSlug(type, trackingField = 'name') {
  type.createField('slug').name('Slug').type('Symbol').required(true).validations(slugValidation);
  type.changeFieldControl('slug', 'builtin', 'slugEditor', {
    trackingFieldId: trackingField,
    helpText: 'Lowercase URL value. Changing it requires adding the old value to Previous slugs.',
  });
}

module.exports = function initialModel(migration) {
  const image = migration
    .createContentType('image')
    .name('Image')
    .description('Editorial image plus required accessibility, credit, and rights metadata.')
    .displayField('alternativeText');
  image.createField('asset').name('Asset').type('Link').linkType('Asset').required(true);
  image
    .createField('alternativeText')
    .name('Alternative text')
    .type('Symbol')
    .required(true)
    .validations([{ size: { min: 5, max: 240 } }]);
  image.createField('caption').name('Caption').type('Text').required(false);
  image
    .createField('photographerOrSourceCredit')
    .name('Photographer or source credit')
    .type('Symbol')
    .required(true);
  image.createField('rightsOrUsageNote').name('Rights or usage note').type('Text').required(false);
  image
    .createField('focalPointDescription')
    .name('Focal point description')
    .type('Symbol')
    .required(false);
  image.changeFieldControl('alternativeText', 'builtin', 'singleLine', {
    helpText: 'Describe the information in the image for a reader who cannot see it.',
  });
  image.changeFieldControl('photographerOrSourceCredit', 'builtin', 'singleLine', {
    helpText: 'Required. Name the photographer, illustrator, agency, or source.',
  });

  const source = migration
    .createContentType('source')
    .name('Source')
    .description('A source cited by an article.')
    .displayField('sourceTitle');
  source.createField('sourceTitle').name('Source title').type('Symbol').required(true);
  source.createField('publisher').name('Publisher').type('Symbol').required(true);
  source
    .createField('url')
    .name('URL')
    .type('Symbol')
    .required(true)
    .validations([{ regexp: { pattern: '^https://', flags: null } }]);
  source.createField('publicationDate').name('Publication date').type('Date').required(false);
  source.createField('accessDate').name('Access date').type('Date').required(true);
  source.createField('optionalNote').name('Optional note').type('Text').required(false);

  const author = migration
    .createContentType('author')
    .name('Author')
    .description('Staff or guest contributor profile.')
    .displayField('displayName');
  author.createField('displayName').name('Display name').type('Symbol').required(true);
  addSlug(author, 'displayName');
  author
    .createField('staffPhotograph')
    .name('Staff photograph')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  author.createField('positionOrTitle').name('Position or title').type('Symbol').required(true);
  author
    .createField('shortBiography')
    .name('Short biography')
    .type('Text')
    .required(true)
    .validations([{ size: { min: 20, max: 400 } }]);
  author.createField('fullBiography').name('Full biography').type('Text').required(true);
  author.createField('areasOfCoverage', symbolList()).name('Areas of coverage').required(false);
  author.createField('socialLinks').name('Social links').type('Object').required(false);
  author.createField('personalWebsite').name('Personal website').type('Symbol').required(false);
  author
    .createField('staffOrGuestDesignation')
    .name('Staff or guest designation')
    .type('Symbol')
    .required(true)
    .validations([{ in: ['Staff', 'Guest'] }]);
  author
    .createField('activeOrFormerStaffDesignation')
    .name('Active or former staff designation')
    .type('Symbol')
    .required(true)
    .validations([{ in: ['Active', 'Former'] }]);

  const category = migration
    .createContentType('category')
    .name('Category')
    .description('A primary publication section.')
    .displayField('name');
  category.createField('name').name('Name').type('Symbol').required(true);
  addSlug(category);
  category.createField('description').name('Description').type('Text').required(true);
  category
    .createField('headerImage')
    .name('Header image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  category
    .createField('displayOrder')
    .name('Display order')
    .type('Integer')
    .required(true)
    .validations([{ range: { min: 0 } }]);
  category
    .createField('showInNavigation')
    .name('Show in navigation')
    .type('Boolean')
    .required(true)
    .defaultValue({ 'en-US': true });
  category
    .createField('featuredCategoryColorToken')
    .name('Featured category color token')
    .type('Symbol')
    .required(true)
    .validations([{ in: ['pine', 'oxblood', 'clay', 'river', 'plum', 'graphite'] }])
    .defaultValue({ 'en-US': 'graphite' });

  const book = migration
    .createContentType('book')
    .name('Book')
    .description('Optional book metadata for Reviews that are about a book.')
    .displayField('title');
  book.createField('title').name('Title').type('Symbol').required(true);
  book.createField('author').name('Author').type('Symbol').required(true);
  book
    .createField('coverImage')
    .name('Cover image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  book.createField('publisher').name('Publisher').type('Symbol').required(true);
  book
    .createField('publicationYear')
    .name('Publication year')
    .type('Integer')
    .required(true)
    .validations([{ range: { min: 1000, max: 3000 } }]);
  book
    .createField('isbn')
    .name('ISBN')
    .type('Symbol')
    .required(true)
    .validations([{ size: { min: 10, max: 17 } }]);
  book
    .createField('externalInformationUrl')
    .name('External information URL')
    .type('Symbol')
    .required(true);

  const pullQuote = migration
    .createContentType('pullQuote')
    .name('Pull Quote')
    .description('A quoted sentence embedded in article Rich Text.')
    .displayField('quote');
  pullQuote.createField('quote').name('Quote').type('Text').required(true);
  pullQuote.createField('attribution').name('Attribution').type('Symbol').required(false);

  const factBox = migration
    .createContentType('factBox')
    .name('Fact Box')
    .description('A concise contextual box embedded in an article.')
    .displayField('title');
  factBox.createField('title').name('Title').type('Symbol').required(true);
  factBox.createField('body').name('Body').type('Text').required(true);

  const sectionDivider = migration
    .createContentType('sectionDivider')
    .name('Section Divider')
    .description('A semantic break in a long-form article.')
    .displayField('label');
  sectionDivider.createField('label').name('Internal label').type('Symbol').required(true);

  const correctionNotice = migration
    .createContentType('correctionNotice')
    .name('Correction Notice')
    .description('A correction embedded at the relevant point in article text.')
    .displayField('note');
  correctionNotice.createField('note').name('Correction note').type('Text').required(true);

  const relatedArticles = migration
    .createContentType('relatedArticles')
    .name('Related Articles')
    .description('A curated related-reading block embedded in an article.')
    .displayField('heading');
  relatedArticles
    .createField('heading')
    .name('Heading')
    .type('Symbol')
    .required(true)
    .defaultValue({ 'en-US': 'Related reading' });
  relatedArticles
    .createField('articles', entryArray(['article'], { min: 1, max: 4 }))
    .name('Articles')
    .required(true);

  const topic = migration
    .createContentType('topic')
    .name('Topic')
    .description('A continuing event or macro trend.')
    .displayField('name');
  topic.createField('name').name('Name').type('Symbol').required(true);
  addSlug(topic);
  topic.createField('summary').name('Summary').type('Text').required(true);
  topic
    .createField('heroImage')
    .name('Hero image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  topic
    .createField('relatedArticles', entryArray(['article']))
    .name('Related articles')
    .required(false);
  topic
    .createField('timelineIntroduction')
    .name('Timeline introduction')
    .type('Text')
    .required(false);
  topic
    .createField('featuredStatus')
    .name('Featured status')
    .type('Boolean')
    .required(true)
    .defaultValue({ 'en-US': false });

  const article = migration
    .createContentType('article')
    .name('Article')
    .description('Editorial work. Publishing makes an entry eligible for the public site.')
    .displayField('title');
  article
    .createField('title')
    .name('Title')
    .type('Symbol')
    .required(true)
    .validations([{ size: { min: 10, max: 140 } }]);
  addSlug(article, 'title');
  article
    .createField('dek')
    .name('Dek')
    .type('Text')
    .required(true)
    .validations([{ size: { min: 30, max: 350 } }]);
  article
    .createField('articleType')
    .name('Does this story need a special label?')
    .type('Symbol')
    .required(true)
    .validations([{ in: ['Standard story', 'Brief', 'Analysis', 'Opinion', 'Review'] }])
    .defaultValue({ 'en-US': 'Standard story' });
  article
    .createField('authors', entryArray(['author'], { min: 1, max: 3 }))
    .name('Authors')
    .required(true);
  article
    .createField('primaryCategory')
    .name('Where does this story belong?')
    .type('Link')
    .linkType('Entry')
    .required(true)
    .validations([{ linkContentType: ['category'] }]);
  article
    .createField('topics', entryArray(['topic']))
    .name('Topics')
    .required(false);
  article
    .createField('heroImage')
    .name('Hero image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  article
    .createField('body')
    .name('Body')
    .type('RichText')
    .required(true)
    .validations([
      {
        enabledNodeTypes: [
          'heading-2',
          'heading-3',
          'ordered-list',
          'unordered-list',
          'hr',
          'blockquote',
          'embedded-entry-block',
          'entry-hyperlink',
          'hyperlink',
        ],
      },
      {
        nodes: {
          'embedded-entry-block': [
            {
              linkContentType: [
                'image',
                'pullQuote',
                'factBox',
                'relatedArticles',
                'sectionDivider',
                'correctionNotice',
              ],
            },
          ],
          'entry-hyperlink': [{ linkContentType: ['article'] }],
        },
      },
    ]);
  article
    .createField('sources', entryArray(['source']))
    .name('Sources')
    .required(false);
  article
    .createField('relatedArticles', entryArray(['article'], { max: 6 }))
    .name('Related articles')
    .required(false);
  article
    .createField('displayPublicationDate')
    .name('Display publication date')
    .type('Date')
    .required(true);
  article
    .createField('displayUpdatedDate')
    .name('Display updated date')
    .type('Date')
    .required(false);
  article
    .createField('book')
    .name('Book')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['book'] }]);
  article.createField('correctionNote').name('Correction note').type('Text').required(false);
  article.createField('previousSlugs', symbolList()).name('Previous slugs').required(false);
  article
    .createField('featured')
    .name('Featured')
    .type('Boolean')
    .required(true)
    .defaultValue({ 'en-US': false });
  article
    .createField('seoTitle')
    .name('SEO title')
    .type('Symbol')
    .required(false)
    .validations([{ size: { max: 70 } }]);
  article
    .createField('seoDescription')
    .name('SEO description')
    .type('Text')
    .required(false)
    .validations([{ size: { max: 170 } }]);
  article.createField('internalNotes').name('Internal notes').type('Text').required(false);

  article.changeFieldControl('dek', 'builtin', 'multipleLine', {
    helpText: '30–350 characters. Summarize the story without repeating the headline.',
  });
  article.changeFieldControl('articleType', 'builtin', 'dropdown', {
    helpText:
      'Most stories should use Standard story. Choose a label only for a brief update, analysis, opinion piece, or review.',
  });
  article.changeFieldControl('primaryCategory', 'builtin', 'entryLinkEditor', {
    helpText: 'Choose the main subject or section for this story.',
  });
  article.changeFieldControl('heroImage', 'builtin', 'entryLinkEditor', {
    helpText: 'Required except for a Brief. Use an Image entry with alt text and credit.',
  });
  article.changeFieldControl('book', 'builtin', 'entryLinkEditor', {
    helpText: 'Optional. Add a Book only when a Review is about a book.',
  });
  article.changeFieldControl('body', 'builtin', 'richTextEditor', {
    helpText: 'Use H2 and H3 headings. Only approved embedded blocks are available.',
  });
  article.changeFieldControl('correctionNote', 'builtin', 'multipleLine', {
    helpText: 'Describe the correction and what changed. This appears publicly.',
  });
  article.changeFieldControl('internalNotes', 'builtin', 'multipleLine', {
    helpText: 'Never rendered on the public site.',
  });

  const homepage = migration
    .createContentType('homepage')
    .name('Homepage')
    .description('Singleton curation record. The frontend falls back to recent published stories.')
    .displayField('internalName');
  homepage
    .createField('internalName')
    .name('Internal name')
    .type('Symbol')
    .required(true)
    .defaultValue({ 'en-US': 'Homepage' });
  homepage
    .createField('leadArticle')
    .name('Lead article')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['article'] }]);
  homepage
    .createField('secondaryLeadArticles', entryArray(['article'], { max: 4 }))
    .name('Secondary lead articles')
    .required(false);
  homepage
    .createField('breakingNewsArticles', entryArray(['article'], { max: 5 }))
    .name('Breaking-news articles')
    .required(false);
  homepage
    .createField('featuredAnalysis', entryArray(['article'], { max: 4 }))
    .name('Featured analysis')
    .required(false);
  homepage
    .createField('featuredOpinions', entryArray(['article'], { max: 4 }))
    .name('Featured opinions')
    .required(false);
  homepage
    .createField('featuredBookReviews', entryArray(['article'], { max: 4 }))
    .name('Featured reviews')
    .required(false);
  homepage
    .createField('featuredTopic')
    .name('Featured topic')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['topic'] }]);
  homepage
    .createField('categoryDisplayOrder', entryArray(['category']))
    .name('Category display order')
    .required(false);
  homepage
    .createField('optionalAnnouncementStrip')
    .name('Optional announcement strip')
    .type('Symbol')
    .required(false)
    .validations([{ size: { max: 180 } }]);

  const siteSettings = migration
    .createContentType('siteSettings')
    .name('Site Settings')
    .description('Singleton publication identity and launch controls.')
    .displayField('publicationName');
  siteSettings
    .createField('publicationName')
    .name('Publication name')
    .type('Symbol')
    .required(true);
  siteSettings.createField('shortName').name('Short name').type('Symbol').required(true);
  siteSettings.createField('tagline').name('Tagline').type('Symbol').required(true);
  siteSettings.createField('description').name('Description').type('Text').required(true);
  siteSettings.createField('textLogo').name('Text logo').type('Symbol').required(true);
  siteSettings
    .createField('logoImage')
    .name('Logo image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  siteSettings
    .createField('favicon')
    .name('Favicon')
    .type('Link')
    .linkType('Asset')
    .required(false);
  siteSettings
    .createField('defaultSocialImage')
    .name('Default social image')
    .type('Link')
    .linkType('Entry')
    .required(false)
    .validations([{ linkContentType: ['image'] }]);
  siteSettings
    .createField('navigationCategories', entryArray(['category']))
    .name('Navigation categories')
    .required(false);
  siteSettings.createField('footerSections').name('Footer sections').type('Object').required(false);
  siteSettings.createField('contactLinks').name('Contact links').type('Object').required(false);
  siteSettings.createField('socialLinks').name('Social links').type('Object').required(false);
  siteSettings.createField('copyrightText').name('Copyright text').type('Symbol').required(true);
  siteSettings
    .createField('siteLaunched')
    .name('Site launched')
    .type('Boolean')
    .required(true)
    .defaultValue({ 'en-US': false });
  siteSettings.changeFieldControl('siteLaunched', 'builtin', 'boolean', {
    helpText:
      'Leave off until real reporting, branding, legal details, and launch review are complete.',
    trueLabel: 'Allow search indexing',
    falseLabel: 'Keep the site noindex',
  });
};
