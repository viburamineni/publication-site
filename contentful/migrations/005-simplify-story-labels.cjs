'use strict';

const storyLabels = ['Standard story', 'Brief', 'Analysis', 'Opinion', 'Review'];
const legacyStoryLabels = ['News', 'News Brief', 'Long Form', 'Book Review'];

const storyLabelCompatibilityMap = {
  'Standard story': 'Standard story',
  Brief: 'Brief',
  Analysis: 'Analysis',
  Opinion: 'Opinion',
  Review: 'Review',
  News: 'Standard story',
  'News Brief': 'Brief',
  'Long Form': 'Standard story',
  'Book Review': 'Review',
};

function mapExistingStoryLabel(value) {
  const storyLabel = storyLabelCompatibilityMap[value];
  if (!storyLabel) {
    throw new Error(`Unsupported existing story label: ${String(value)}`);
  }
  return storyLabel;
}

module.exports = function simplifyStoryLabels(migration) {
  const article = migration.editContentType('article');

  article
    .editField('articleType')
    .name('Does this story need a special label?')
    .required(true)
    .validations([{ in: [...storyLabels, ...legacyStoryLabels] }])
    .defaultValue({ 'en-US': 'Standard story' });

  article.editField('primaryCategory').name('Where does this story belong?');

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

  migration.transformEntries({
    contentType: 'article',
    from: ['articleType'],
    to: ['articleType'],
    shouldPublish: 'preserve',
    transformEntryForLocale(fromFields, currentLocale) {
      const currentValue = fromFields.articleType?.[currentLocale] ?? 'Standard story';
      return {
        articleType: mapExistingStoryLabel(currentValue),
      };
    },
  });

  article.editField('articleType').validations([{ in: storyLabels }]);

  migration
    .editContentType('book')
    .description('Optional book metadata for Reviews that are about a book.');

  migration.editContentType('homepage').editField('featuredBookReviews').name('Featured reviews');
};

module.exports.mapExistingStoryLabel = mapExistingStoryLabel;
