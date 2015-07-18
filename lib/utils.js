'use strict';

const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');

const db = require('./db').set();

exports.getOrSetID = function(next) {
  db.get('identifier', function(err, id) {
    if (err || !id) {
      // generate a new id
      id = new FlakeID();
      let newID = intFormat(id.next(), 'hex', { prefix: '0x' });

      db.put('identifier', newID, function(errID) {
        if (errID) {
          return next(err);
        }

        return next(null, newID);
      });
    }

    return next(null, id);
  });
};
