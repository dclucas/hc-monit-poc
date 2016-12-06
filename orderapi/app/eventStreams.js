'use strict'

const Rx = require('rx');
const R = require('ramda');
const uuid = require('uuid');

const config = require('./config');

const subjects = {
    order: new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize),
    system: new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize)
}

subjects.system.onNextError = function(error, payload = {}) {
    subjects.system.onNext(R.merge({
        error,
        id: uuid.v4(),
        level: 'error',
        result: 'error',
        time: new Date()
    }, payload));
}

subjects.system.onNextSuccess = function(payload = {}) {
    subjects.system.onNext(R.merge({
        id: uuid.v4(),
        level: 'info',
        result: 'success',
        time: new Date()
    }, payload));
}

//todo: create onNextError and onNextSuccess for systemSubject
module.exports.orderSubject = subjects.order;//new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize);
module.exports.systemSubject = subjects.system;//new Rx.ReplaySubject(config.replayBufferSize, config.replayWindowSize);
