'use strict'

const uuid = require('uuid');
const config = require('./config');
const events = require('./events')(config);
const logger = require('./logger');

//todo: put queue name here
events.subscribe(function(msg) {
    console.log(JSON.stringify(msg.content));
});