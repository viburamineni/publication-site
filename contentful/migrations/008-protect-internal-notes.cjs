'use strict';

module.exports = function protectInternalNotes(migration) {
  migration.editContentType('article').editField('internalNotes').omitted(true);
};
