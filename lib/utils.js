'use strict';

const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');

const db = require('./db').set();
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

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
        name: newID,
        bio: '?',
        publicURL: '?'
      }, function(errProf) {
        if (errProf) {
          console.log('Could not save new profile');
        }
      });
    }

    next(null, id);
  });
};

exports.generateStatusID = function(next) {
  let id = new FlakeID();
  let currID = intFormat(id.next(), 'dec');

  next(null, currID);
};
