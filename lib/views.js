'use strict';

const utils = require('./utils');

exports.getID = function(socket) {
  utils.getOrSetID(function(err, account) {
    if (account) {
      socket.emit('identifierack', account);
    }
  });
};

exports.dashboard = function(request, reply) {
  reply.view('index', {
    authenticated: request.auth.isAuthenticated
  });
};

exports.reply = function(request, reply) {

};
