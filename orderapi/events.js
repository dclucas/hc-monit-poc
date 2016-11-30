'use strict'

module.exports = function(config) {
    const RxAmqpLib = require('rx-amqplib');
    const R = require('ramda');
    const Package = require('./package');
    
    return {
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
            console.log('pushing event data');
            RxAmqpLib.newConnection(config.host)
              .flatMap(connection => connection
                .createChannel()
                .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
                .doOnNext(exchange => exchange.channel.publish(config.exchange, '', new Buffer(JSON.stringify((eventData)))))
                .flatMap(exchange => exchange.channel.close())
                .flatMap(() => connection.close())
              )
              .subscribe(() => {}, console.error, () => console.log('Messages sent'));            
        }
    }
}
