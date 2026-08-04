'use strict';

module.exports = function cleanHomepageControls(migration) {
  const homepage = migration
    .editContentType('homepage')
    .description(
      'Single front-page curation entry. Latest remains automatic; all other homepage selections live here.',
    );

  homepage.editField('leadArticle').name('Featured article');
  homepage
    .editField('secondaryLeadArticles')
    .name('Editor’s picks')
    .validations([{ size: { max: 3 } }]);
  homepage
    .editField('featuredAnalysis')
    .name('Analysis section')
    .validations([{ size: { max: 3 } }]);
  homepage
    .editField('featuredOpinions')
    .name('Opinion section')
    .validations([{ size: { max: 3 } }]);
  homepage
    .editField('featuredBookReviews')
    .name('Books and reviews section')
    .validations([{ size: { max: 3 } }]);
  homepage.editField('featuredTopic').name('Featured topic');
  homepage.editField('optionalAnnouncementStrip').name('Homepage announcement');

  homepage.editField('breakingNewsArticles').omitted(true).disabled(true);
  homepage.editField('categoryDisplayOrder').omitted(true).disabled(true);

  homepage.changeFieldControl('leadArticle', 'builtin', 'entryLinkEditor', {
    helpText:
      'The large story at the top of the homepage. Leave empty to use the newest published article marked Featured, then the newest published article.',
  });
  homepage.changeFieldControl('secondaryLeadArticles', 'builtin', 'entryLinksEditor', {
    helpText:
      'Choose up to three articles for Editor’s picks. Their order here is their order on the homepage. Leave empty to hide the section.',
  });
  homepage.changeFieldControl('featuredAnalysis', 'builtin', 'entryLinksEditor', {
    helpText:
      'Choose up to three articles for the Analysis section. Leave empty to hide the section.',
  });
  homepage.changeFieldControl('featuredOpinions', 'builtin', 'entryLinksEditor', {
    helpText:
      'Choose up to three articles for the Opinion section. Leave empty to hide the section.',
  });
  homepage.changeFieldControl('featuredBookReviews', 'builtin', 'entryLinksEditor', {
    helpText:
      'Choose up to three articles for the Books and reviews section. Leave empty to hide the section.',
  });
  homepage.changeFieldControl('featuredTopic', 'builtin', 'entryLinkEditor', {
    helpText:
      'Choose the Topic highlighted near the bottom of the homepage. Leave empty to hide it.',
  });
  homepage.changeFieldControl('optionalAnnouncementStrip', 'builtin', 'singleLine', {
    helpText: 'Optional short reader-facing notice shown above the featured article.',
  });
};
