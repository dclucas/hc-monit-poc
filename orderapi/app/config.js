// fixme: provide environmental overrides here -- gotta work with docker, c9 and local deployments...
const config = {};
config.port = 8080;
config.exchange = 'test_exchange';
config.exchangeType = 'fanout';
config.amqpHost = process.env.RABBIT_URI || 'amqp://localhost';
//config.amqpHost = 'amqp://admin:admin@localhost:5672';
config.logLevel = 'trace';
module.exports = config;