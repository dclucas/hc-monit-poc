'use strict'

const config = require('./app/config');
const eventStreams = require('./app/eventStreams');
const app = require('./app/index')(config, eventStreams);
