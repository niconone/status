'use strict';

const Hapi = require('hapi');
const http = require('http');
const conf = require('nconf');
const SocketIO = require('socket.io');

conf.argv().env().file({ file: 'config.json' });

const views = require('./lib/views');
const account = require('./lib/account');
const connections = require('./lib/connections');
const statuses = require('./lib/statuses');

const server = new Hapi.Server();

let auth = {
  mode: 'try',
  strategy: 'session'
};

server.connection({
  host: conf.get('domain'),
  port: conf.get('port'),
  routes: {
    cors: true
  }
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

server.register(require('hapi-auth-cookie'), function(err) {
  if (err) {
    throw err;
  }

  server.auth.strategy('session', 'cookie', {
    password: conf.get('cookiePassword'),
    ttl: conf.get('cookieTTL'),
    cookie: conf.get('cookie'),
    keepAlive: true,
    isSecure: false
  });
});

server.ext('onPreResponse', function(request, reply) {
  let response = request.response;

  if (!response.isBoom) {
    return reply.continue();
  }

  let error = response;
  let ctx = {};

  let statusCode = error.output.statusCode || 500;
  ctx.code = error.output.statusCode || 500;
  ctx.httpMessage = http.STATUS_CODES[statusCode].toLowerCase();

  console.log(ctx.httpMessage);

  return reply.view('error', ctx).code(statusCode);
});

let routes = [
  {
    method: 'GET',
    path: '/',
    handler: views.dashboard,
    config: {
      auth: auth
    }
  },
  {
    method: 'GET',
    path: '/feed',
    handler: views.feed
  },
  {
    method: 'POST',
    path: '/authenticate',
    handler: account.authenticate
  },
  {
    method: 'GET',
    path: '/ext/profile',
    handler: account.getIncoming
  },
  {
    method: 'POST',
    path: '/ext/follower',
    handler: connections.addIDFollowerIncoming
  },
  {
    method: 'POST',
    path: '/ext/following/profile',
    handler: connections.updateAccountFollowing
  },
  {
    method: 'POST',
    path: '/ext/follower/profile',
    handler: connections.updateAccountFollower
  },
  {
    method: 'POST',
    path: '/ext/status',
    handler: statuses.addIncoming
  },
  {
    method: 'POST',
    path: '/ext/unfollow',
    handler: connections.removeFollowerIncoming
  },
  {
    method: 'GET',
    path: '/ext/follower/ping',
    handler: connections.isFollowingIncoming
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

let io;

exports.io = function() {
  return io;
};

server.start(function(err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  io = SocketIO.listen(server.listener);

  io.on('connection', function(socket) {
    socket.on('identifier', function() {
      views.getID(socket);
    });

    socket.on('follow', function(data) {
      switch (data.type) {
        case 'follow.add':
          connections.addIDFollowing(socket, data);
          break;
        case 'follow.getAll':
          connections.getAllFollowing(socket);
          break;
        case 'follow.remove':
          connections.removeIDFollowing(socket. data.account.id);
          break;
      }
    });

    socket.on('follower', function(data) {
      switch (data.type) {
        case 'follower.add':
          connections.addIDFollower(socket, data);
          break;
        case 'follower.getAll':
          connections.getAllFollowers(socket);
          break;
      }
    });

    socket.on('status', function(data) {
      switch (data.type) {
        case 'status.getAll':
          statuses.getAll(socket);
          break;
        case 'status.add':
          statuses.add(socket, data);
          break;
        case 'status.remove':
          statuses.remove(socket, data);
          break;
      }
    });

    socket.on('feed', function(data) {
      switch (data.type) {
        case 'feed.getAll':
          statuses.feed(socket);
          break;
      }
    });

    socket.on('account', function(data) {
      switch (data.type) {
        case 'account.get':
          account.get(socket);
          break;
        case 'account.update':
          console.log('updating account changes ', data);
          account.update(socket, data);
          break;
      }
    });
  });
});

exports.getServer = function() {
  return server;
};
