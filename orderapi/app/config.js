// fixme: provide environmental overrides here -- gotta work with docker, c9 and local deployments...
const config = {};
config.port = 8080;
config.exchange = 'test_exchange';
config.exchangeType = 'fanout';
config.amqpHost = process.env.RABBIT_URI || 'amqp://localhost';
config.logLevel = process.env.LOG_LEVEL || 'warn';
config.replayBufferSize = 20;
config.replayWindowSize = 10000;
config.healthcheckInterval = 5000;
config.healthcheckWaitTime = 500;
module.exports = config;