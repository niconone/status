'use strict';

const concat = require('concat-stream');
const request = require('request');

const db = require('./db').set();

function sendProfilePing(remoteURL, url) {
  request({
    url: remoteURL + '/ext/profile',
    qs: {
      publicURL: url
    },
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, function(error) {
    if (error) {
      console.log('ERROR: ', error);
    }
  });
}

// Who you follow

exports.updateAccountFollowing = function(req) {
  let data = req.query;
  console.log('follower update ', data);
  db.put('follow!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on updateAccount: ', err);
    }

    let io = require('../index').io();
    io.emit('followack', data);
  });
};

exports.addIDFollowing = function(socket, data) {
  console.log('data ', data);
  db.get('profile', function(err, account) {
    console.log('getting account ', account);
    if (account && account.id == data.account.id) {
      console.log('This id matches your own id - you cannot follow yourself');
      return;
    }

    db.put('follow!' + data.account.id, data.account, function(errFollow) {
      if (errFollow) {
        return console.log('Error on addIDFollowing: ', err);
      }

      request({
        url: data.account.publicURL + '/ext/follower',
        qs: {
          type: 'follower.add',
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

      socket.emit('followack', data);
    });
  });
};

exports.getAllFollowing = function(socket) {
  let rs = db.createReadStream({
    gte: 'follow!',
    lte: 'follow!\xff',
    reverse: true
  });

  rs.pipe(concat(function(follows) {
    socket.emit('followack', {
      type: 'follow.getAll',
      following: follows
    });

    db.get('profile', function(err, account) {
      if (account) {
        follows.forEach(function(f) {
          // Update their profiles locally, if they are online
          sendProfilePing(f.value.publicURL, account.publicURL);
        });
      }
    });
  }));

  rs.on('error', function(err) {
    console.log('Error on getAllFollowing: ', err);
  });
};

exports.removeIDFollowing = function(socket, id) {
  db.get('follow!' + id, function(err, acct) {
    if (err) {
      console.log('Error on removeIDFollowing: ', err);
      return;
    }

    request({
      url: acct.publicURL + '/ext/unfollow',
      qs: {
        type: 'follow.remove',
        account: acct
      },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, function(error) {
      if (error) {
        console.log('ERROR: ', error);
      }

      db.del('follow!' + id, function(errDel) {
        if (errDel) {
          socket.emit('followack', {
            type: 'follow.error',
            error: 'Could not unfollow ' + id
          });
          return;
        }

        socket.emit('followack', {
          type: 'follow.remove',
          account: {
            id: id
          }
        });
      });
    });
  });
};

// Who follows you

exports.updateAccountFollower = function(req) {
  let data = req.query;
  console.log('follower update ', data);
  db.put('follower!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on updateAccount: ', err);
    }

    data.type = 'follower.update';
    let io = require('../index').io();

    io.emit('followerack', data);
  });
};

exports.addIDFollower = function(socket, data) {
  db.put('follower!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on addIDFollower: ', err);
    }

    socket.emit('followerack', data);
  });
};

exports.addIDFollowerIncoming = function(req) {
  let data = req.query;
  console.log('data ', data);
  db.get('profile', function(err, account) {
    console.log('getting account ', account);
    if (account && account.id == data.account.id) {
      console.log('This id matches your own id - you cannot follow yourself');
      return;
    }

    db.put('follower!' + data.account.id, data.account, function(errFollow) {
      if (errFollow) {
        return console.log('Error on addIDFollowing: ', err);
      }

      data.type = 'follower.add';
      let io = require('../index').io();

      io.emit('followerack', data);
    });
  });
};

exports.getAllFollowers = function(socket) {
  let rs = db.createReadStream({
    gte: 'follower!',
    lte: 'follower!\xff',
    reverse: true
  });

  rs.pipe(concat(function(followers) {
    socket.emit('followerack', {
      type: 'follower.getAll',
      followers: followers
    });

    db.get('profile', function(err, account) {
      if (account) {
        followers.forEach(function(f) {
          // Update their profiles locally, if they are online
          sendProfilePing(f.value.publicURL, account.publicURL);
        });
      }
    });
  }));

  rs.on('error', function(err) {
    console.log('Error on getAllFollowers: ', err);
  });
};

// If a follower unfollows you
exports.removeFollowerIncoming = function(req) {
  let data = req.query;
  db.del('follower!' + data.id, function(err) {
    if (err) {
      return console.log('Error on removeFollowerIncoming: ', err);
    }

    let io = require('../index').io();

    io.emit.emit('followerack', {
      type: 'follower.remove',
      account: {
        id: data.id
      }
    });
  });
};
