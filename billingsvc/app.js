'use strict'

const uuid = require('uuid');
const config = require('./config');
const events = require('./events')(config);

//todo: put queue name here
events.subscribe(function(msg) {
    console.log(msg);
});