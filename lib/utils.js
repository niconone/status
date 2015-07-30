'use strict';

const request = require('request');
const FlakeID = require('flake-idgen');
const intFormat = require('biguint-format');

const db = require('./db').set();
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

const NGROK_API = 'http://127.0.0.1:4040';
const NGROK_TUNNEL = 'command_line';

function setTunnel(id, next) {
  request.del(NGROK_API + '/api/tunnels/' + NGROK_TUNNEL, function(err) {
    if (err) {
      throw err;
    }

    request({
      url: NGROK_API + '/api/tunnels',
      qs: {
        addr: conf.get('port'),
        proto: 'http',
        name: NGROK_TUNNEL
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error, response, body) {
      if (error) {
        throw error;
      }

      next(null, {
        id: id,
        publicURL: JSON.parse(body).tunnels[0].public_url
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

  setTunnel(currID, next);
};
