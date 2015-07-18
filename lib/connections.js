'use strict';

const concat = require('concat-stream');

const db = require('./db').set();

exports.addID = function(data, next) {
  db.put('follow!' + data.id, data.bio, function(err) {
    if (err) {
      return next(err);
    }

    return next(null, data.id);
  });
};

exports.getAll = function(next) {
  let rs = db.createReadStream({
    gte: 'follow!',
    lte: 'follow!\xff',
    reverse: true
  });

  rs.pipe(concat(function(follows) {
    return next(null, follows);
  }));

  rs.on('error', function(err) {
    return next(err);
  });
};

exports.removeID = function(id, next) {
  db.del('follow!' + id, function(err) {
    if (err) {
      return next(err);
    }

    return next(null, true);
  });
};

exports.reply = function(id, data, next) {
  let packet = {
    to: id,
    data: data
  };

  db.put('status!' + Date.time(), packet, function(err) {
    if (err) {
      return next(err);
    }

    return next(null, packet);
  });
};
