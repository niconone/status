'use strict';

const request = require('request');
const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');

const db = require('./db').set();
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

const NGROK_API = 'http://127.0.0.1:4040';

function setTunnel(id, next) {
  request.del(NGROK_API + '/api/tunnels/' + id, function(err) {
    if (err) {
      throw err;
    }

    request({
      url: NGROK_API + '/api/tunnels',
      method: 'POST',
      qs: {
        addr: conf.get('port'),
        proto: 'http',
        name: id
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error) {
      if (error) {
        throw error;
      }

      next(null, {
        id: id,
        publicURL: '//' + id + '.ngrok.io'
      });
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
        name: '?',
        bio: '?'
      }, function(errProf) {
        if (errProf) {
          console.log('Could not save new profile');
        }
      });
    }

    setTunnel(id, next);
  });
};

exports.generateStatusID = function(next) {
  let id = new FlakeID();
  let currID = intFormat(id.next(), 'dec');

  next(null, currID);
};
