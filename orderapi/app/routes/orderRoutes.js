'use strict'

const Hapi = require('hapi');
const Hoek = require('hoek');
const Joi = require('joi');
const HapiSwagger = require('hapi-swagger');
const Inert = require('inert');
const Vision = require('vision');
const R = require('ramda');
const uuid = require('uuid');

const config = require('../config');
const events = require('../events')(config);
const healthcheck = require('../healthcheck');
const errorHandler = require('../errors');
const logger = require('../logger');
const eventStreams = require('../eventStreams');
const orderRoutes = require('../routes/orderRoutes');

function deepMerge(a, b) {
  return (R.is(Object, a) && R.is(Object, b)) ? R.mergeWith(deepMerge, a, b) : b;
}

function addTotals(payload) {
    const items = R.map(x => {
        const price = Math.floor(Math.random() * 100000) / 100;
        return R.merge(x, { price: price, total: x.quantity * price });
    }, payload.data.attributes.items);
    
    const data = {
        data: {
            attributes: {
                total: R.sum(R.map((x) => x.total, items)),
                items: items
            }
        }
    }
    return deepMerge(payload, data);
}

function handleInternalError(reply, msg = 'Internal Server Error', err = undefined, level = 'error') {
    const payload = errorHandler.report(err, msg, level);
    healthcheck.changeStatus('red', msg);
    reply(payload).code(500);
}

function enrichPayload(payload) {
    const now = new Date();
    const defaultData = { 
        data: {
            id: uuid.v4(),
            attributes: { 
                createdOn: now,
                updatedOn: now
            }
        }
    };
    return addTotals(deepMerge(payload, defaultData));    
}

module.exports.configureEndpoint = function(server) {
    server.route({
        method: 'POST',
        path: '/orders',
        handler: (request, reply) => {
            const payload = enrichPayload(request.payload);
            events.broadcast(payload)
            .then(() => reply(payload).code(202))
            .catch((err) => reply({ msg: 'Error!', err: err }).code(500));
        },
        config: {
            tags: ['api'],
            validate: {
                payload: {
                    data: Joi.object({
                        id: Joi.string().guid(),
                        type: Joi.string().valid(['orders']).required(),
                        attributes: Joi.object({
                            createdOn : Joi.date().forbidden(),
                            updatedOn : Joi.date().forbidden(),
                            total: Joi.number().forbidden(),
                            items: Joi.array().items({
                                productId: Joi.string().guid().required(),
                                quantity: Joi.number().integer().required(),
                                price: Joi.number().forbidden(),
                                total: Joi.number().forbidden()
                            }).required().min(1)
                        }).required()
                    })
                }
            }
        }
    });

    return server;
}