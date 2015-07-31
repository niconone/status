'use strict';

const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');
const ngrok = require('ngrok');

const db = require('./db').set();
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

function setTunnel(id, next) {
  ngrok.connect({
    port: conf.get('port'),
    subdomain: id
  }, function(err, url) {
    if (err) {
      if (JSON.parse(err.message).error_code === 103) {
        return next(null, {
          id: id,
          publicURL: 'https://' + id + '.ngrox.io'
        });
      }

      throw err;
    }

    console.log('url: ', url);
    next(null, {
      id: id,
      publicURL: url
    });
  });
}

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

        return setTunnel(newID, next);
      });

      db.put('profile', {
        id: newID,
        name: newID,
        bio: '?'
      }, function(errProf) {
        if (errProf) {
          console.log('Could not save new profile');
        }
      });
    }

    db.get('profile', function(error, acct) {
      next(null, acct);
    });
  });
};

exports.generateStatusID = function(next) {
  let id = new FlakeID();
  let currID = intFormat(id.next(), 'dec');

  next(null, currID);
};
