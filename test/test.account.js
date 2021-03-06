'use strict';

const should = require('should');
const conf = require('nconf');
const io = require('socket.io-client');
const request = require('request');
const child = require('child_process');

const server = require('../').getServer();

conf.argv().env().file({ file: 'test/config.json' });

const HOST = 'http://127.0.0.1:' + conf.get('port');

let wsOpts = {
  transports: ['websocket'],
  'force new connection': true,
  'reconnection delay': 0,
  'reopen delay': 0
};

after(function() {
  child.exec('rm -rf ./test/db');
  server.stop();
});

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
      let header = res.headers['set-cookie'];
      header.length.should.equal(1);
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
      let header = res.headers['set-cookie'];
      should.not.exist(header);
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
});

describe('account.get', function() {
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

  it('should send a profile to a publicURL', function(done) {
    let account2 = {
      id: 111,
      name: 'test2',
      bio: '?',
      publicURL: 'http://test2.ngrok.com'
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('follower', {
        type: 'follower.add',
        account: account2
      });

      socket.on('followerack', function() {
        request({
          url: HOST + '/ext/profile',
          qs: {
            publicURL: account2.publicURL
          },
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }, function(error, res, body) {
          if (error) {
            console.log('ERROR: ', error);
          }

          should.deepEqual(JSON.parse(body), {
            status: 'sent'
          });

          socket.disconnect();
          done();
        });
      });
    });
  });
});
