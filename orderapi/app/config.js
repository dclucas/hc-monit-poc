// fixme: provide environmental overrides here -- gotta work with docker, c9 and local deployments...
const config = {};
config.port = 8080;
config.exchange = 'test_exchange';
config.exchangeType = 'fanout';
config.amqpHost = process.env.RABBIT_URI || 'amqp://localhost';
config.logLevel = 'warn';
config.replayBufferSize = 5;
config.replayWindowSize = 5000;
config.healthcheckInterval = 1000;
module.exports = config;