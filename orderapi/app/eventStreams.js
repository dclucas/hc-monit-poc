'use strict'

const Rx = require('rx');

module.exports.errorSubject = new Rx.Subject();
module.exports.orderSubject = new Rx.Subject();
module.exports.systemSubject = new Rx.Subject();
