'use strict';

const concat = require('concat-stream');
const marked = require('marked');

const db = require('./db').set();
const utils = require('./utils');

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

exports.getAll = function(socket) {
  console.log('get all status updates');

  let rs = db.createReadStream({
    gte: 'status!',
    lte: 'status!\xff',
    limit: 20,
    reverse: true
  });

  rs.pipe(concat(function(statuses) {
    statuses.forEach(function(status) {
      status.value.status = marked(status.value.status);
    });

    socket.emit('statusack', {
      type: 'status.getAll',
      statuses: statuses
    });
  }));

  rs.on('error', function(err) {
    console.log('Error on getAll: ', err);
  });
};

exports.add = function(socket, data) {
  console.log('adding a new status message ', data);

  let date = Date.now();

  utils.generateStatusID(function(_, id) {
    let status = {
      id: id,
      status: data.status.status,
      account: data.status.account,
      created: date,
      faved: false
    };

    db.put('status!' + date + '!' + id, status, function(err) {
      if (!err) {
        status.status = marked(status.status);
        console.log('sending status back to client ', status);
        socket.emit('statusack', {
          type: 'status.add',
          status: status
        });
      }
    });
  });
};

exports.getLastFromFollowing = function(socket, followerID, timestamp) {
  console.log('getting the last statuses since a timestamp');

  let rs = db.createReadStream({
    gte: 'status!',
    lte: 'status!\xff',
    limit: 20,
    reverse: true
  });

  rs.pipe(concat(function(statuses) {
    statuses.forEach(function(status) {
      status.value.status = marked(status.value.status);
    });

    socket.emit('statusack', {
      type: 'status.getAll',
      statuses: statuses
    });
  }));

  rs.on('error', function(err) {
    console.log('Error on getAll: ', err);
  });
};
