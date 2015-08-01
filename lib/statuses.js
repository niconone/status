'use strict';

const concat = require('concat-stream');
const marked = require('marked');
const request = require('request');

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

  if (data.status.status.trim().length < 1) {
    console.log('Invalid message content, ignoring');
    return;
  }

  let date = Date.now();

  function sendStatus(id, type, status, url) {
    request({
      url: url + '/ext/status',
      qs: {
        type: type,
        id: id,
        status: status
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

  function broadcastStatus(status) {
    let rs = db.createReadStream({
      gte: 'follower!',
      lte: 'follower!\xff'
    });

    rs.pipe(concat(function(followers) {
      followers.forEach(function(f) {
        sendStatus(f.value.id, 'status.add', status, f.value.publicURL);
      });

      // now markdown is ok to render
      status.status = marked(status.status);
      console.log('sending status back to client ', status);

      socket.emit('statusack', {
        type: 'status.add',
        status: status
      });
    }));

    rs.on('error', function(err) {
      console.log('Error on profile update to followers: ', err);
    });
  }

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
        // send status pre-markdown to followers
        broadcastStatus(status);
      }
    });
  });
};

exports.addIncoming = function(req) {
  let data = req.query;
  let status = data.status;

  if (status.status.trim().length < 1) {
    console.log('Invalid message content, ignoring');
    return;
  }

  db.put('status!' + status.created + '!' + status.id, status, function(err) {
    if (!err) {
      status.status = marked(status.status);
      console.log('sending status back to client ', status);
      let io = require('../index').io();
      io.emit('statusack', {
        type: 'status.add',
        status: status
      });
    }
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
