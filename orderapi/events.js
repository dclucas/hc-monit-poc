'use strict'

module.exports = function(config) {
    const RxAmqpLib = require('rx-amqplib');
    const R = require('ramda');
    const Package = require('./package');
    const logger = require('./logger');
    const errorHandler = require('./errors');
    
    return {
        checkChannel: function() {
            
        },
        fromResource: function(resource, eventType) {
            return {
                createdOn: new Date(),
                resourceId: resource.data.id,
                source: `${Package.name}:${Package.json}`,
                eventType: eventType,
                payload: resource
            }
        },
        publish: function(eventData) {
            logger.trace('Publishing event', eventData);
            var str = RxAmqpLib.newConnection(config.host)
              .flatMap(connection => connection
                .createChannel()
                .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
                .doOnNext(exchange => exchange.channel.publish(config.exchange, '', new Buffer(JSON.stringify((eventData)))))
                .flatMap(exchange => exchange.channel.close())
                .flatMap(() => connection.close())
              );
            //str.subscribe(() => {}, err => errorHandler.report(err, 'Failed to publish event', 'fatal'), () => console.log('Messages sent'));
            return str;
        }
    }
}
