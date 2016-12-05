'use strict'

const Rx = require('rx');
const orderSubject = new Rx.Subject();
const errorSubject = new Rx.Subject();

module.exports.errorSubject = errorSubject;
module.exports.orderSubject = orderSubject;