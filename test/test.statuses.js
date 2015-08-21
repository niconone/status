'use strict';

const should = require('should');
const conf = require('nconf');
const io = require('socket.io-client');
const request = require('request');
const child = require('child_process');

const server = require('../').getServer();

conf.argv().env().file({ file: 'test/config.json' });

const HOST = 'http://127.0.0.1:' + conf.get('port');

let statusID;

let account = {
  name: 'test',
  bio: '?',
  publicURL: 'http://test.ngrok.com'
};

let account2 = {
  name: 'test2',
  bio: '?',
  publicURL: 'http://test2.ngrok.com'
};

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

describe('statuses', function() {
  it('should get all statuses', function(done) {
    let socket = io.connect(HOST, wsOpts);

    socket.on('connect', function() {
      let data = {
        type: 'status.getAll'
      };

      socket.emit('status', data);

      socket.on('statusack', function(d) {
        should.exist(d.statuses);
        socket.disconnect();
        done();
      });
    });
  });

  it('should add a new status', function(done) {
    let socket = io.connect(HOST, wsOpts);

    let status = {
      type: 'status.add',
      status: {
        status: 'test',
        account: account
      }
    };

    socket.on('connect', function() {
      socket.emit('status', status);

      socket.on('statusack', function(d) {
        statusID = d.status.id;
        should.exist(d.status.id);
        should.exist(d.status.created);
        should.equal(d.status.status, '<p>test</p>\n');
        should.equal(d.status.faved, false);
        socket.disconnect();
        done();
      });
    });
  });

  it('should remove a status', function(done) {
    let socket = io.connect(HOST, wsOpts);

    let status = {
      type: 'status.remove',
      key: statusID
    };

    socket.on('connect', function() {
      socket.emit('status', status);

      socket.on('statusack', function(d) {
        console.log(d)
        should.deepEqual(d, {
          type: 'status.remove',
          status: statusID.replace(/-/g, '!')
        });
        socket.disconnect();
        done();
      });
    });
  });

  it('should get a feed', function(done) {
    let socket = io.connect(HOST, wsOpts);

    let status = {
      type: 'feed.getAll'
    };

    socket.on('connect', function() {
      socket.emit('feed', status);

      socket.on('feedack', function(d) {
        should.exist(d.statuses);
        socket.disconnect();
        done();
      });
    });
  });

  it('should add an incoming status', function(done) {
    let socket = io.connect(HOST, wsOpts);

    let status = {
      id: 111,
      created: 1440190000000,
      status: 'test',
      account: account2,
      faved: false
    };

    socket.on('connect', function() {
      socket.emit('follow', {
        type: 'follow.add',
        account: account2
      });

      socket.on('followack', function() {
        request({
          url: HOST + '/ext/status',
          qs: {
            type: 'status.add',
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

        socket.on('statusack', function(d) {
          should.exist(d.status.id);
          should.exist(d.status.created);
          should.equal(d.status.status, '<p>test</p>\n');
          should.equal(d.status.faved, 'false');
          socket.disconnect();
          done();
        });
      });
    });
  });
});
