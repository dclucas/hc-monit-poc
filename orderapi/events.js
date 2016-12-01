'use strict'

module.exports = function(config) {
    const RxAmqpLib = require('rx-amqplib');
    const Rx = require('rx');
    const R = require('ramda');
    const Package = require('./package');
    const logger = require('./logger');
    const errorHandler = require('./errors');
    const eventStreams = require('./eventStreams');
    
    return {
        checkChannel: function() {
            return RxAmqpLib.newConnection(config.amqpHost)
              .flatMap(connection => connection
                .createChannel()
                .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
                .flatMap(exchange => exchange.channel.close())
                .flatMap(() => connection.close())
              );
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
            //logger.trace('Publishing event', eventData);
            eventStreams.orderSubject.onNext(eventData);
            return RxAmqpLib.newConnection(config.amqpHost)
              .flatMap(connection => connection
                .createChannel()
                .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
                .doOnNext(exchange => exchange.channel.publish(config.exchange, '', new Buffer(JSON.stringify((eventData)))))
                .flatMap(exchange => exchange.channel.close())
                .flatMap(() => connection.close())
              );
        }
    }
}
