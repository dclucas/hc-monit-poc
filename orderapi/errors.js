'use strict'
const logger = require('./logger');
const events = require('./events');
const uuid = require('uuid');
const R = require('ramda');

module.exports.report = function(err, msg, level) {
    const id = uuid.v4();
    const payload = { errorId: id, msg };
    logger[level](payload, err);
    return payload;
}