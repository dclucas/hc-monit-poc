'use strict'

const config = require('./config');
const events = require('./events')(config);
const healthcheck = require('./healthcheck');
const logger = require('./logger');
const orderRoutes = require('./routes/orderRoutes');
const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({ port: config.port });

healthcheck.configureEndpoint(server);
orderRoutes.configureEndpoint(server);

module.exports = new Promise(function(resolve, reject) {
    server.register([
        require('inert'),
        require('vision'),
        { 'register': require('hapi-swagger') } // todo: add options
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
.catch(err => { logger.fatal(err); throw err; });