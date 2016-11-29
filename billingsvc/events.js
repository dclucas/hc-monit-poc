'use strict'

module.exports = function(config) {
    const R = require('ramda');
    const RxAmqpLib = require('rx-amqplib');
    
    return {
        publish: function(eventData) {
            const payload = R.merge(eventData, {
                created_on: new Date()
            });
            RxAmqpLib.newConnection(config.host)
              .flatMap(connection => connection
                .createChannel()
                .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, {durable: false}))
                .doOnNext(exchange => exchange.channel.publish(config.exchange, '', new Buffer(JSON.stringify((eventData)))))
                .flatMap(exchange => exchange.channel.close())
                .flatMap(() => connection.close())
              )
              .subscribe(() => {}, console.error, () => console.log('Messages sent'));            
        },
        
        subscribe: function(cb) {
            RxAmqpLib.newConnection(config.host)
              .flatMap(connection => connection.createChannel())
              .flatMap(channel => channel.assertExchange(config.exchange, config.exchangeType, { durable: false }))
              .flatMap(exchange => exchange.channel.assertQueue('billingsvc_q', { exclusive: true }))
              .flatMap(queue => queue.channel
                .bindQueue(queue.queue, config.exchange, '')
                .flatMap(queue.channel.consume(queue.queue, { noAck: true }))
              )
              //.subscribe(message => cb, console.error);
              //.subscribe(message => console.log(message.content.toString()), console.error);
              .subscribe(message => cb(message), console.error);
        }
    }
}
