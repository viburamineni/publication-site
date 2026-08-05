'use strict';

module.exports = function removeClientReadinessMarker(migration) {
  migration.editContentType('article').deleteField('publishingChecks');
};
