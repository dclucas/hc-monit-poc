'use strict'
const logger = require('./logger');
const events = require('./events');
const healthcheck = require('./healthcheck');
const uuid = require('uuid');
const R = require('ramda');

function report(err, msg, level) {
    const id = uuid.v4();
    const payload = { errorId: id, msg };
    logger[level](payload, err);
    // todo: push to an Observable and move logging and publishing out of here
    return payload;
}

module.exports.report = report;
