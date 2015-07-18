'use strict';

const Hapi = require('hapi');
const http = require('http');
const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

const views = require('./lib/views');

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
});

exports.getServer = function() {
  return server;
};
