'use strict'

const uuid = require('uuid');
const config = require('./config');
const events = require('./events')(config);
const healthcheck = require('./healthcheck');
const errorHandler = require('./errors');
const logger = require('./logger');
const eventStreams = require('./eventStreams');
const Hapi = require('hapi');
const Hoek = require('hoek');
const Joi = require('joi');
const HapiSwagger = require('hapi-swagger');
const Inert = require('inert');
const Vision = require('vision');
const R = require('ramda');

const server = new Hapi.Server();
server.connection({ port: config.port });

healthcheck.configureEndpoint(server);

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
server.route({
    method: 'POST',
    path: '/orders',
    handler: (request, reply) => {
        const payload = enrichPayload(request.payload);
        eventStreams.orderSubject.onNext(payload);
        events.publish(events.fromResource(payload, 'orders.submitted'))
        .subscribe(
            () => {}, 
            (err) => handleInternalError(reply, 'Failed to broadcast order creation', err, 'fatal'),
            () => {
                healthcheck.resetStatus();
                reply(payload).code(202);
            }
        );
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

module.exports = new Promise(function(resolve, reject) {
    server.register([
        Inert,
        Vision,
        { 'register': HapiSwagger }
        ],
    (err) => {
        if (err) {
            reject(err);
        }
        server.start((err) => {
            if (err) {
                reject(err)
            }
            console.log(`Server started at ${server.info.uri}`);
            events.checkChannel()
            .subscribe(
                () => {}, 
                (err) => {
                    healthcheck.changeStatus('red', 'Cannot connect to channel');
                },
                () => {}
            );

            resolve(server);
        });
    });
})
.catch(err => { console.error(err); throw err; });