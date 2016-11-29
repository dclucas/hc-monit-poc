'use strict'

const uuid = require('uuid');
const config = require('./config');
const events = require('./events')(config);

events.publish({ customerId: uuid.v4() });