'use strict'
const logger = require('./logger');
const events = require('./events');
const healthcheck = require('./healthcheck');
const uuid = require('uuid');
const R = require('ramda');
const Rx = require('rx');

// fixme: invert this -- callers should directly do an onNext instead of reporting an error
const eventStreams = require('./eventStreams');

module.exports.createErrorEvent = function(error, payload = {}) {
  return R.merge({ level: 'error', result: 'error', id: uuid.v4(), error}, payload);
}

module.exports.isErrorEvent = function(payload) {
  return payload.result === 'error';
}

module.exports.isSuccessEvent = function(payload) {
  return payload.result === 'success';
}

module.exports.isWarningEvent = function(payload) {
  return payload.result === 'warning';
}

