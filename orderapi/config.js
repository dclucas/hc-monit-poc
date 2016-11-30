const config = {};
config.port = 8080;
config.exchange = 'test_exchange';
config.exchangeType = 'fanout';
config.host = 'amqp://localhost';
module.exports = config;