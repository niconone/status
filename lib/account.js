'use strict';

const db = require('./db').set();
const utils = require('./utils');
const connections = require('./connections');

exports.update = function(socket, data) {
  utils.getOrSetID(function(err, id) {
    console.log(err, id)
    if (id) {
      let account = {
        id: id,
        name: data.name,
        bio: data.bio
      };

      db.put('profile', account);

      // Broadcast changes to followers
      console.log('updated account')
      socket.emit('accountack', account);
    }
  });
};
