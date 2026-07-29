'use strict';

const previousSlugValidations = [
  {
    regexp: {
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      flags: null,
    },
    message: 'Use lowercase words separated by hyphens.',
  },
];

module.exports = function validatePreviousSlugs(migration) {
  migration.editContentType('article').editField('previousSlugs').items({
    type: 'Symbol',
    validations: previousSlugValidations,
  });
};
