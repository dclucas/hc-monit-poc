'use strict'

const bunyan = require('bunyan');
const p = require('./package');

module.exports = bunyan.createLogger({name: `${p.name}:${p.version}`});