'use strict';

const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');

const db = require('./db').set();

exports.getOrSetID = function(next) {
  db.get('identifier', function(err, id) {
    if (err || !id) {
      // generate a new id
      id = new FlakeID();
      let newID = intFormat(id.next(), 'dec');

      db.put('identifier', newID, function(errID) {
        if (errID) {
          return next(err);
        }

        return next(null, newID);
      });

      db.put('profile', {
        id: newID,
        name: '?',
        bio: '?'
      }, function(errProf) {
        if (errProf) {
          console.log('Could not save new profile');
        }
      });
    }

    return next(null, id);
  });
};

exports.generateStatusID = function(next) {
  let id = new FlakeID();
  next(null, intFormat(id.next(), 'dec'));
};
