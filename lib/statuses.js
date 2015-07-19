'use strict';

const db = require('./db').set();
const utils = require('./utils');

exports.add = function(socket, data) {
  console.log('adding a new status message ', data);

  let date = Date.now();

  utils.generateStatusID(function(_, id) {
    let status = {
      id: id,
      status: data.status.status,
      account: data.status.account,
      created: date,
      replyTo: false,
      faved: false
    };

    db.put('status!' + date + '!' + id, status, function(err) {
      if (!err) {
        console.log('sending status back to client ', status);
        socket.emit('statusack', {
          type: 'status.add',
          status: status
        });
      }
    });
  });
};

// Replies to who you follow
// todo: replace with sockets
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
