'use strict'

import test from 'ava';
import * as got from 'got';
import * as config from '../app/config';
import * as eventStreams from '../app/eventStreams';
import * as appStart from '../app/index';
const logger = require('../app/logger');

test.before((t) => {
    //logger.debug({ t }, 'before');
    //const app = require('../app/index')(config, eventStreams);
    //t.context = { app };
    //return app;
});

//test.serial('Health check: red status (serial test)', () => console.log('serial 1'));
//test.serial(() => console.log('serial 2'));

function checkResponse(t, response) {
    t.true((response.statusCode >= 200 && response.statusCode < 300), 
        `Unexpected status code: ${response.statusCode}`);
}

function testHttp(t, verb, uri, body, validateResponse = checkResponse) {
    logger.debug(`Running a ${verb} against ${uri}. Body: ${body}`);
    return got[verb](uri, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }})
    .then((response) => {
        return validateResponse(t, response)
    })
    .catch((err) => { logger.error(err); throw err; });
}

test('Send order', t =>
    testHttp(
        t,
        'post',
        `http://localhost:${config.port}/orders`,
        {
            "data": {
                "type": "orders",
                "attributes": {
                    "items": [
                        {"productId": "8130a0c2-e374-4135-b630-2087e305c090", "quantity":1}
                    ]
                }       
            }
        }
    )
);

test('Green health', t => testHttp(t, 'get', `http://localhost:${config.port}/healthcheck`, null));
