'use strict';

const utils = require('./utils');

exports.getID = function(socket) {
  utils.getOrSetID(function(err, id) {
    if (id) {
      socket.emit('identifierack', id);
    }
  });
};

exports.dashboard = function(request, reply) {
  reply.view('index', {
    authenticated: request.auth.isAuthenticated
  });
};

exports.feed = function(request, reply) {
  reply.view('feed');
};
