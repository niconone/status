'use strict';

const db = require('./db').set();
const utils = require('./utils');
const connections = require('./connections');

exports.update = function(socket, data) {
  utils.getOrSetID = function(err, id) {
    if (id) {
      db.put('profile', {
        id: id,
        name: data.name,
        bio: data.bio
      });

      // Broadcast changes to followers
    }
  };
};
