'use strict';

const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');
const ngrok = require('ngrok');

const db = require('./db').set();
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

exports.setTunnel = function(id, next) {
  ngrok.connect({
    port: conf.get('port'),
    subdomain: id
  }, function(err, url) {
    if (err) {
      if (JSON.parse(err.message).error_code === 103) {
        return next(null, {
          id: id,
          publicURL: 'http://' + id + '.ngrok.io'
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
};

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

        return next(null, {
          id: newID,
          publicURL: 'http://' + newID + '.ngrok.io'
        })
      });

      db.put('profile', {
        id: newID,
        name: newID,
        bio: '?',
        publicURL: 'http://' + newID + '.ngrok.io'
      }, function(errProf) {
        if (errProf) {
          console.log('Could not save new profile');
        }
      });
    }

    next(null, {
      id: id,
      publicURL: 'http://' + id + '.ngrok.io'
    });
  });
};

exports.generateStatusID = function(next) {
  let id = new FlakeID();
  let currID = intFormat(id.next(), 'dec');

  next(null, currID);
};
