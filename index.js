'use strict';

const Hapi = require('hapi');
const http = require('http');
const conf = require('nconf');
const SocketIO = require('socket.io');

conf.argv().env().file({ file: 'config.json' });

const views = require('./lib/views');
const account = require('./lib/account');
const connections = require('./lib/connections');

const server = new Hapi.Server();

server.connection({
  host: conf.get('domain'),
  port: conf.get('port')
});

server.views({
  engines: {
    jade: require('jade')
  },
  isCached: process.env.node === 'production',
  path: __dirname + '/views',
  compileOptions: {
    pretty: true
  }
});

server.ext('onPreResponse', function(request, reply) {
  let response = request.response;

  if (!response.isBoom) {
    return reply.continue();
  }

  let error = response;
  let ctx = {};

  let message = error.output.payload.message;
  let statusCode = error.output.statusCode || 500;
  ctx.code = statusCode;
  ctx.httpMessage = http.STATUS_CODES[statusCode].toLowerCase();

  switch (statusCode) {
    case 404:
      ctx.reason = 'page not found';
      break;
    case 403:
      ctx.reason = 'forbidden';
      break;
    case 500:
      ctx.reason = 'something went wrong';
      break;
    default:
      break;
  }

  console.log(error.stack || error);

  if (ctx.reason) {
    // Use actual message if supplied
    ctx.reason = message || ctx.reason;
    return reply.view('error', ctx).code(statusCode);
  }

  ctx.reason = message.replace(/\s/gi, '+');
  reply.redirect(request.path + '?err=' + ctx.reason);
});

let routes = [
  {
    method: 'GET',
    path: '/',
    handler: views.dashboard
  }
];

server.route(routes);

server.route({
  path: '/{p*}',
  method: 'GET',
  handler: {
    directory: {
      path: './public',
      listing: false,
      index: false
    }
  }
});

server.start(function(err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  let io = SocketIO.listen(server.listener);

  io.on('connection', function(socket) {
    socket.on('identifier', function() {
      views.getID(socket);
      socket.emit('apiack', conf.get('peerKey'));
    });

    socket.on('follow', function(data) {
      switch (data.type) {
        case 'add':
          connections.addIDFollowing(socket, data);
          break;
        case 'remove':
          connections.removeIDFollowing(socket, data.id);
          break;
        case 'getAll':
          connections.getAllFollowing(socket);
          break;
      }
    });

    socket.on('follower', function(data) {
      switch (data.type) {
        case 'add':
          connections.addIDFollower(socket, data);
          break;
        case 'remove':
          connections.removeIDFollower(socket, data.id);
          break;
        case 'getAll':
          connections.getAllFollowers(socket);
          break;
      }
    });

    socket.on('account', function(data) {
      account.update(socket, data);
    });
  });
});

exports.getServer = function() {
  return server;
};
