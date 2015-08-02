'use strict';

const level = require('level');

const conf = require('nconf');

if (process.env.NODE_ENV === 'test') {
  conf.argv().env().file({ file: 'test/config.json' });
} else {
  conf.argv().env().file({ file: 'config.json' });
}

let db = level(conf.get('db'), {
  valueEncoding: 'json'
});

exports.set = function() {
  return db;
};
