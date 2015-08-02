'use strict';

const should = require('should');
const conf = require('nconf');
const io = require('socket.io-client');

const server = require('../').getServer();

process.env.NODE_ENV = 'test';

const HOST = 'http://127.0.0.1:' + conf.get('port');

conf.argv().env().file({ file: 'test/config.json' });

let wsOpts = {
  transports: ['websocket'],
  'force new connection': true,
  'reconnection delay': 0,
  'reopen delay': 0
};

describe('account.authenticate', function() {
  it('should authenticate successfully', function(done) {
    let options = {
      method: 'POST',
      url: HOST + '/authenticate',
      payload: {
        password: 'test'
      }
    };

    server.inject(options, function(res) {
      res.headers.location.should.equal('/?success');
      res.statusCode.should.equal(302);
      done();
    });
  });

  it('should not authenticate', function(done) {
    let options = {
      method: 'POST',
      url: HOST + '/authenticate',
      payload: {
        password: 'wrong'
      }
    };

    server.inject(options, function(res) {
      res.headers.location.should.equal('/?error');
      res.statusCode.should.equal(302);
      done();
    });
  });
});

describe('account.update', function() {
  it('should update a profile', function(done) {
    let account = {
      name: 'test1',
      bio: '?',
      publicURL: 'http://test.ngrok.com'
    };

    let data = {
      type: 'account.update',
      account: account
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('account', data);

      socket.on('accountack', function(d) {
        console.log(d);
        d.account.id.should.not.be.empty();
        d.account.name.should.equal(account.name);
        d.account.bio.should.equal(account.bio);
        d.account.publicURL.should.equal(account.publicURL);
        socket.disconnect();
        done();
      });
    });
  });

  it('should not update a profile', function(done) {
    let account = {
      name: 'test2',
      bio: '?',
      publicURL: ''
    };

    let data = {
      type: 'account.update',
      account: account
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('account', data);

      socket.on('accountack', function(d) {
        d.type.should.equal('account.error');
        d.error.should.equal('publicURL cannot be empty');
        socket.disconnect();
        done();
      });
    });
  });

  it('should get a profile', function(done) {
    let account = {
      name: 'test1',
      bio: '?',
      publicURL: 'http://test.ngrok.com'
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      let data = {
        type: 'account.get'
      };

      socket.emit('account', data);

      socket.on('accountack', function(d) {
        should.exist(d.account);
        d.account.name.should.equal(account.name);
        d.account.bio.should.equal(account.bio);
        d.account.publicURL.should.equal(account.publicURL);
        socket.disconnect();
        done();
      });
    });
  });
});
