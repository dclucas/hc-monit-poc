'use strict'

const Joi = require('joi');
const eventStreams = require('./eventStreams');
const errors = require('./errors');

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

eventStreams.systemSubject
    .where((event) => !errors.isErrorEvent(event))
    .subscribeOnNext(() => changeStatus('green', 'success'));

eventStreams.systemSubject
    .where((event) => errors.isErrorEvent(event))
    .subscribeOnNext(() => changeStatus('red', 'reason!'));

resetStatus();

module.exports.resetStatus = resetStatus;
function changeStatus(newStatus, newReason) {
    status = newStatus;
    reason = newReason;
    updatedOn = new Date();
}

module.exports.configureEndpoint = function(server) {
    server.route({
        method: 'GET',
        path: '/healthcheck',
        handler: (request, reply) => {
            reply({ 
                status, 
                reason,
                updatedOn
            }).code(200);
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

