module.exports = function addPublishingChecks(migration) {
  migration
    .editContentType('article')
    .createField('publishingChecks')
    .name('Publishing checks')
    .type('Symbol')
    .required(true)
    .omitted(true)
    .disabled(true)
    .validations([
      {
        in: ['ready'],
        message: 'Open Publishing checks in the sidebar and fix every reported issue.',
      },
    ]);
};
