'use strict'

module.exports = function(config) {
    const RxAmqpLib = require('rx-amqplib');
    
    return {
        publish: function(eventData) {
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
