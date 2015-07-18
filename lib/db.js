'use strict';

const level = require('level');

const conf = require('nconf');

conf.argv().env().file({ file: 'config.json' });

let db = level(conf.get('db'), {
  valueEncoding: 'json'
});

exports.set = function() {
  return db;
};
