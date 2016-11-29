'use strict'

const uuid = require('uuid');
const config = require('./config');
const events = require('./events')(config);
const Hapi = require('hapi');
const Hoek = require('hoek');
const Joi = require('joi');
const HapiSwagger = require('hapi-swagger');
const Inert = require('inert');
const Vision = require('vision');

const server = new Hapi.Server();
server.connection({ port: config.port });

server.route({
    method: 'POST',
    path: '/orders',
    handler: (request, reply) => {
        reply('').code(202);
    },
    config: {
        tags: ['api'],
        validate: {
            payload: {
                data: {
                    id: Joi.string().guid(),
                    type: Joi.string().valid(['orders']).required()
                }
            }
        }
    }
});

var serverP = new Promise(function(resolve, reject) {
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
            resolve(server);
        });
    });
})
.catch(err => { console.error(err); throw err; })
/*
var serverP = new Promise(function(resolve, reject) {
        server.start((err) => {
            if (err) {
                reject(err)
            }
            console.log(`Server started at ${server.info.uri}`);
            resolve(server);
        });
})
*/
module.exports = serverP;