'use strict'

const Joi = require('joi');

var status = 'green';
var reason = 'no issues found';

module.exports.changeStatus = function(newStatus, newReason) {
    status = newStatus;
    reason = newReason;
}

module.exports.configureEndpoint = function(server) {
    server.route({
        method: 'GET',
        path: '/healthcheck',
        handler: (request, reply) => {
            reply({ 
                status: status, 
                reason: reason
            }).code(200);
        },
        config: {
            tags: ['api'],
            response: { schema: {
                status: Joi.string().valid(['green', 'yellow', 'red']),
                reason: Joi.string()
            }}
        },
    });
}
