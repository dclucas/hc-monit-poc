'use strict'

const RxAmqpLib = require('rx-amqplib');
const Rx = require('rx');
const R = require('ramda');
const orderSubject = new Rx.Subject();
const errorSubject = new Rx.Subject();

module.exports.errorSubject = errorSubject;
module.exports.orderSubject = orderSubject;