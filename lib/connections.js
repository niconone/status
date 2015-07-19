'use strict';

const concat = require('concat-stream');

const db = require('./db').set();

// Who you follow

exports.updateAccountFollowing = function(socket, data) {
  db.put('follow!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on updateAccount: ', err);
    }

    socket.emit('followack', data);
  });
};

exports.addIDFollowing = function(socket, data) {
  db.put('follow!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on addIDFollowing: ', err);
    }

    socket.emit('followack', data);
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
  }));

  rs.on('error', function(err) {
    console.log('Error on getAllFollowing: ', err);
  });
};

exports.removeIDFollowing = function(socket, id) {
  db.del('follow!' + id, function(err) {
    if (err) {
      return console.log('Error on removeIDFollowing: ', err);
    }

    socket.emit('followack', {
      type: 'follow.remove',
      id: id
    });
  });
};

// Who follows you

exports.updateAccountFollower = function(socket, data) {
  db.put('follower!' + data.account.id, data.account, function(err) {
    if (err) {
      return console.log('Error on updateAccount: ', err);
    }

    data.type = 'follower.update';
    socket.emit('followerack', data);
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

exports.getAllFollowers = function(socket) {
  let rs = db.createReadStream({
    gte: 'follower!',
    lte: 'follower!\xff',
    reverse: true
  });

  rs.pipe(concat(function(follows) {
    socket.emit('followerack', {
      type: 'follower.getAll',
      followers: follows
    });
  }));

  rs.on('error', function(err) {
    console.log('Error on getAllFollowers: ', err);
  });
};

exports.removeIDFollower = function(socket, id) {
  db.del('follower!' + id, function(err) {
    if (err) {
      return console.log('Error on removeIDFollower: ', err);
    }

    socket.emit('followerack', {
      type: 'follower.remove',
      id: id
    });
  });
};
