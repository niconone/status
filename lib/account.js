'use strict';

const conf = require('nconf');
const concat = require('concat-stream');
const request = require('request');

const db = require('./db').set();
const utils = require('./utils');

conf.argv().env().file({ file: 'config.json' });

exports.authenticate = function(req, reply) {
  if (req.payload.password === conf.get('password')) {
    req.auth.session.set({
      authenticated: true
    });
  }

  reply.redirect('/');
};

exports.update = function(socket, data) {
  function sendProfile(user, type, account) {
    let followType = 'follower';

    if (type === 'follow.update') {
      followType = 'following';
    }

    request({
      url: user.publicURL + '/ext/' + followType + '/profile',
      qs: {
        type: type,
        account: account
      },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error) {
      if (error) {
        console.log('ERROR: ', error);
      }
    });
  }

  function broadcastProfileUpdate(account) {
    let rs = db.createReadStream({
      gte: 'follow!',
      lte: 'follow!\xff'
    });

    rs.pipe(concat(function(follows) {
      follows.forEach(function(f) {
        sendProfile(f.value, 'follow.update', account);
      });
    }));

    rs.on('error', function(err) {
      console.log('Error on profile update to following: ', err);
    });

    rs = db.createReadStream({
      gte: 'follower!',
      lte: 'follower!\xff'
    });

    rs.pipe(concat(function(followers) {
      followers.forEach(function(f) {
        sendProfile(f.value, 'follower.update', account);
      });
    }));

    rs.on('error', function(err) {
      console.log('Error on profile update to followers: ', err);
    });
  }

  utils.getOrSetID(function(err, acct) {
    if (acct) {
      let account = {
        id: acct.id,
        name: data.account.name || acct.name || acct.id,
        bio: data.account.bio || acct.bio || '?',
        publicURL: acct.publicURL,
        lastID: acct.id
      };

      db.put('profile', account, function(error) {
        if (error) {
          return console.log('ERROR: ', err);
        }

        broadcastProfileUpdate(account);

        console.log('updated account');
        socket.emit('accountack', {
          type: 'account.update',
          account: account
        });
      });
    }
  });
};

exports.get = function(socket) {
  db.get('profile', function(err, account) {
    console.log('getting account ', account);
    if (account) {
      console.log('getting account');
      socket.emit('accountack', {
        type: 'account.get',
        account: account
      });
    }
  });
};
