'use strict';

const should = require('should');
const conf = require('nconf');
const io = require('socket.io-client');
const request = require('request');
const child = require('child_process');

const server = require('../').getServer();

conf.argv().env().file({ file: 'test/config.json' });

const HOST = 'http://127.0.0.1:' + conf.get('port');

let userID = 111;

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

describe('connections', function() {
  it('should follow an account', function(done) {
    let account2 = {
      id: userID,
      name: 'test2',
      bio: '?',
      publicURL: 'http://test2.ngrok.com'
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('follow', {
        type: 'follow.add',
        account: account2
      });

      socket.on('followack', function(data) {
        should.exist(data.account);
        should.deepEqual(data.account, account2);
        socket.disconnect();
        done();
      });
    });
  });

  it('should update an account you follow', function(done) {
    let account2 = {
      id: '111',
      name: 'test2b',
      bio: '?',
      publicURL: 'http://test2b.ngrok.com'
    };

    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      request({
        url: HOST + '/ext/following/profile',
        qs: {
          type: 'following.update',
          account: account2
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

      socket.on('followack', function(data) {
        should.deepEqual(data.account, account2);
        socket.disconnect();
        done();
      });
    });
  });

  it('should return all the users you are following', function(done) {
    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('follow', {
        type: 'follow.getAll'
      });

      socket.on('followack', function(data) {
        data.type.should.equal('follow.getAll');
        data.following.length.should.equal(1);
        socket.disconnect();
        done();
      });
    });
  });

  it('should unfollow a user', function(done) {
    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      socket.emit('follow', {
        type: 'follow.remove',
        account: {
          id: userID
        }
      });

      socket.on('followack', function(data) {
        console.log(data);
        socket.disconnect();
        done();
      });
    });
  });
});
