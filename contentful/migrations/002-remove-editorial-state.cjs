module.exports = function removeEditorialState(migration) {
  migration
    .editContentType('article')
    .description('Editorial work. Publishing makes an entry eligible for the public site.')
    .deleteField('editorialState');

  migration
    .editContentType('homepage')
    .description('Singleton curation record. The frontend falls back to recent published stories.');
};
