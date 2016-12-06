'use strict';

const Joi = require('joi');
const systemSubject = require('./eventStreams').systemSubject;
const logger = require('./logger');
const RxAmqpLib = require('rx-amqplib');
const Rx = require('rx');
const config = require('./config');
const R = require('ramda');


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

function mergeStatuses(acc, payload, current) {
    const details = R.concat(payload.details, acc.details);
    if (payload.status === 'green') {
        if (acc.status !== 'green') {
            return { status: 'yellow', reason: 'recent errors occurred', time: payload.time, details };
        }
    }

    return R.assoc('details', details,payload);
}

function getStatus(acc, current) {
    logger.trace(current);
    const mapping = {
        error: (x) => ({ status: 'red', reason: 'error!', time: x.time, details: [x] }),
        success: (x) => ({ status: 'green', reason: 'ok!', time: x.time, details: [x] }),
        warning: (x) => ({ status: 'yellow', reason: 'warning!', time: x.time, details: [x] })
    };
    const payload = mapping[current.result](current);
    return mergeStatuses(acc, payload, current);
}

module.exports.configureEndpoint = function(server) {
    server.route({
        method: 'GET',
        path: '/healthcheck',
        handler: (request, reply) => {
            systemSubject
            .takeUntilWithTime(config.healthcheckWaitTime)
            .reduce(getStatus, { status: 'green', reason: 'No issues found', details: [] })
            .subscribeOnNext(x => reply(x).code(x.status === 'red'? 500 : 200));
        },
        config: {
            tags: ['api'],
            response: { schema: {
                status: Joi.string().valid(['green', 'yellow', 'red']),
                reason: Joi.string(),
                details: Joi.array(),
                time: Joi.date()
            }}
        },
    });
};

