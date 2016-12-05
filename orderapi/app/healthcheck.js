'use strict'

const Joi = require('joi');
const eventStreams = require('./eventStreams');
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

function resetStatus() {
    // fixme: this code is very frail from a concurrency standpoint. Introduce
    // a time-based semaphor to control status reset.
    status = defaultStatus;
    reason = defaultReason;
    updatedOn = new Date();
}

function checkChannel () {
    return RxAmqpLib.newConnection(config.amqpHost)
      .flatMap(connection => connection
        .createChannel()
        .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
        .flatMap(exchange => exchange.channel.close())
        .flatMap(() => connection.close())
      )
      .subscribe(
        () => eventStreams.systemSubject.onNext({ result: 'success'}),
        () => eventStreams.systemSubject.onNext({ result: 'error'}),
        // todo: review this -- it should never happen
        () => eventStreams.systemSubject.onNext({ result: 'completed'})
        );
}


Rx.Observable.timer(0, config.healthcheckInterval)
    .subscribeOnNext(() => checkChannel());

resetStatus();

module.exports.resetStatus = resetStatus;
function changeStatus(newStatus, newReason) {
    status = newStatus;
    reason = newReason;
    updatedOn = new Date();
}

function getStatus(acc, current) {
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
            eventStreams.systemSubject
            .take(10)
            .reduce(getStatus, { status: 'green', reason: 'No issues found' })
            .subscribe(
            function (x) {
                console.log('Next: ' + x.toString());
                reply({ 
                    status: 'red', 
                    reason,
                    updatedOn
                }).code(200)
            },
            function (err) {
                console.log('Error: ' + err);
                // reply({ 
                //     status: 'red', 
                //     reason,
                //     updatedOn
                // }).code(200)
            },
            function () {
                console.log('Completed');
                // reply({ 
                //     status: 'red', 
                //     reason,
                //     updatedOn
                // }).code(200)
            }
                );
            /*eventStreams.systemSubject.subscribe(
            function (x) {
                console.log('Next: ' + x.toString());
                reply({ 
                    status: 'red', 
                    reason,
                    updatedOn
                }).code(200)
            },
            function (err) {
                console.log('Error: ' + err);
                // reply({ 
                //     status: 'red', 
                //     reason,
                //     updatedOn
                // }).code(200)
            },
            function () {
                console.log('Completed');
                // reply({ 
                //     status: 'red', 
                //     reason,
                //     updatedOn
                // }).code(200)
            });
*/
            /*
            eventStreams.systemSubject
            //.where((event) => errors.isErrorEvent(event))
            .subscribeOnNext(() => {
                reply({ 
                    status: 'red', 
                    reason,
                    updatedOn
                }).code(200)
            });
            */
            /*
            reply({ 
                status: 'green', 
                reason,
                updatedOn
            }).code(200);
            */
        },
        config: {
            tags: ['api'],
            response: { schema: {
                status: Joi.string().valid(['green', 'yellow', 'red']),
                reason: Joi.string(),
                updatedOn: Joi.date()
            }}
        },
    });
}

