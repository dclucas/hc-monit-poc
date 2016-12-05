'use strict'

const Rx = require('rx');
const config = require('./config');

module.exports.errorSubject = new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize);
module.exports.orderSubject = new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize);
module.exports.systemSubject = new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize);
