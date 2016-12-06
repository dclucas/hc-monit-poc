'use strict'

const Joi = require('joi');
const systemSubject = require('./eventStreams').systemSubject;
const errors = require('./errors');
const logger = require('./logger');
const RxAmqpLib = require('rx-amqplib');
const Rx = require('rx');
const config = require('./config');

const defaultStatus = 'green';
const defaultReason = 'no issues found';

var status;
var reason;
var updatedOn;

function checkChannel () {
    return RxAmqpLib.newConnection(config.amqpHost)
      .flatMap(connection => connection
        .createChannel()
        .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
        .flatMap(exchange => exchange.channel.close())
        .flatMap(() => connection.close())
      )
      .subscribe(
        (x) => systemSubject.onNextSuccess({ process: 'healthcheck' }),
        (x) => systemSubject.onNextError({ process: 'healthcheck' }),
        () => {});
}


Rx.Observable.timer(0, config.healthcheckInterval).subscribeOnNext(checkChannel);

function getStatus(acc, current) {
    console.log(current);
    if (errors.isErrorEvent(current)) {
        return { status: 'red', reason: 'error!' }
    }
    return acc;
}

module.exports.configureEndpoint = function(server) {
    server.route({
        method: 'GET',
        path: '/healthcheck',
        handler: (request, reply) => {
            systemSubject
            .takeUntilWithTime(config.healthcheckWaitTime)
            .reduce(getStatus, { status: 'green', reason: 'No issues found' })
            .subscribeOnNext(x => reply(x).code(x.status === 'red'? 500 : 200));
        },
        config: {
            tags: ['api'],
            response: { schema: {
                status: Joi.string().valid(['green', 'yellow', 'red']),
                reason: Joi.string(),
                time: Joi.date()
            }}
        },
    });
}

