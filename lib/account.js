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

    return reply.redirect('/?success');
  }

  reply.redirect('/?error');
};

exports.update = function(socket, data) {
  // Validation
  if (data.account.publicURL.trim() < 1) {
    socket.emit('accountack', {
      type: 'account.error',
      error: 'publicURL cannot be empty'
    });
    return;
  }

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
        sendProfile(f.value, 'follower.update', account);
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
        sendProfile(f.value, 'follow.update', account);
      });
    }));

    rs.on('error', function(err) {
      console.log('Error on profile update to followers: ', err);
    });
  }

  utils.getOrSetID(function(err, id) {
    if (id) {
      let account = {
        id: id,
        name: data.account.name || id,
        bio: data.account.bio || '?',
        publicURL: data.account.publicURL,
        lastID: id
      };

      db.put('profile', account, function(error) {
        if (error) {
          socket.emit('accountack', {
            type: 'account.error',
            error: error
          });
          return;
        }

        broadcastProfileUpdate(account);

        console.log('updated account ', account);
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

exports.getIncoming = function(req) {
  let data = req.query;
  console.log(data);
  db.get('profile', function(err, account) {
    if (account) {
      console.log('getting account for follower ', account);
      request({
        url: data.publicURL + '/ext/following/profile',
        qs: {
          type: 'follow.update',
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

      request({
        url: data.publicURL + '/ext/follower/profile',
        qs: {
          type: 'follower.update',
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
  });
};
