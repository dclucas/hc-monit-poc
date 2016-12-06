'use strict'

const bunyan = require('bunyan');
const p = require('../package');
const events = require('./eventStreams');
const config = require('./config');
const logger = bunyan.createLogger({name: `${p.name}:${p.version}`, level: config.logLevel});

events.systemSubject.doOnNext(function (x) { logger[x.level || 'fatal'](x); });

events.orderSubject.subscribe(
    function (x) { logger.trace({ msg: 'New event'}, x); },
    function (e) { logger.fatal({ msg: 'Error on event stream' }, e); },
    function () { });

module.exports = logger;