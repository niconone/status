'use strict';

const db = require('./db').set();
const utils = require('./utils');

exports.update = function(socket, data) {
  utils.getOrSetID(function(err, id) {
    if (id) {
      let account = {
        id: id,
        name: data.account.name,
        bio: data.account.bio
      };

      db.put('profile', account);

      console.log('updated account');
      socket.emit('accountack', {
        type: 'account.update',
        account: account
      });
    }
  });
};

exports.get = function(socket) {
  db.get('profile', function(err, account) {
    console.log('getting account ', account);
    if (account) {
      console.log('getting account');
      socket.emit('accountack', {
        type: 'account.get',
        account: account
      });
    }
  });
};
