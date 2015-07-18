'use strict';

const Boom = require('boom');

const utils = require('./utils');
const connections = require('./connections');

exports.getID = function(socket) {
  utils.getOrSetID(function(err, id) {
    if (id) {
      socket.emit('identifierack', id);
    }
  });
};

exports.dashboard = function(request, reply) {
  let followed = [];
  connections.getAll(function(err, follows) {
    followed = follows;

    reply.view('index', {
      follows: followed
    });
  });
};

exports.follow = function(socket, data) {
  connections.addID(data, function(err) {
    if (err) {
      console.log(err);
      return true;
    }

    socket.emit('followack', data);
  });
};

exports.reply = function(request, reply) {

};
