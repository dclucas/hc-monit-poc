'use strict'

import test from 'ava';
import * as got from 'got';
import * as config from '../app/config';
import * as eventStreams from '../app/eventStreams';
import * as appStart from '../app/index';
const logger = require('../app/logger');

test.before((t) => {
    const app = require('../app/index')(config, eventStreams);
    return app;
});

function getUrl(route) {
    return `http://localhost:${config.port}${route}`;
}

test.serial('Health check: red/yellow status', 
    (t) => {
        eventStreams.systemSubject.onNextError('Fake Error!');
        return testHttp(t, 'get', getUrl('/healthcheck'), null, (t, r) => { 
            const body = JSON.parse(r.body);
            if (r.statusCode === 500) {
                t.true(body.status === 'red', 'A 500 healthcheck response should have status red');
                t.true(body.details[0].result === 'error', 'A 500 healthcheck response should have an error on its stack top');
            } else {
                t.true(r.statusCode === 200, 'A healthcheck response status should be either 500 or 200');
                t.true(body.status === 'yellow', 'The recently introduced error should have caused the hc response to turn red or yelow');
                t.true(body.details[0].result === 'success', 'A yellow status should have a succes on top of its stack');
            }
        });
    }
);
//test.serial(() => console.log('serial 2'));

function checkResponse(t, response) {
    t.true((response.statusCode >= 200 && response.statusCode < 300), 
        `Unexpected status code: ${response.statusCode}`);
}

function testHttp(t, verb, uri, body, validateResponse = checkResponse) {
    logger.debug(`Running a ${verb} against ${uri}. Body: ${body}`);
    return got[verb](uri, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }})
    .then((response) => {
        logger.debug({ body: response.body, statusCode: response.statusCode }, 'Got response');
        return validateResponse(t, response);
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

//todo: consider validating the payload as well
test('Green health', t => testHttp(t, 'get', `http://localhost:${config.port}/healthcheck`, null));
