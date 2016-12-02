'use strict'

module.exports = function(config) {
    const RxAmqpLib = require('rx-amqplib');
    const Rx = require('rx');
    const R = require('ramda');
    const Package = require('./package');
    const logger = require('./logger');
    const errorHandler = require('./errors');
    const eventStreams = require('./eventStreams');
    const amqp = require('amqplib');
    
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
        },

        broadcast: function(eventData) {
            const pubPromise = amqp.connect(config.amqpHost)
            .tap((conn) => 
                conn.createChannel()
                .tap((ch) => ch.assertExchange(config.exchange, config.exchangeType, { durable: false }) )
                .tap((ch) => ch.publish(config.exchange, '', new Buffer(JSON.stringify((eventData)))))
                // fixme: publish event to stream instead of logging
                .catch((err) => logger.fatal(err))
                //todo: consider using finally instead of then here
                .then((ch) => ch.close())
            )
            .catch((err) => logger.fatal(err))
            //todo: consider using finally instead of then here
            .then((conn) => conn.close());

            return pubPromise;
        }
    }
}
