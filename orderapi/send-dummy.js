'use strict'

const uuid = require('uuid');
const config = require('./app/config');
const events = require('./app/events')(config);

events.publish({ customerId: uuid.v4() });