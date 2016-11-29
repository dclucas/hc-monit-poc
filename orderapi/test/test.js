'use strict'

import test from 'ava';
import * as got from 'got';

var server;

test.before(t => {
    return require('../app.js')
    .then(s => server = s);
})

test('Send order', t => {
    return got.post(`${server.info.uri}/orders`, {
        body: JSON.stringify({ data: { 
            type: 'orders'
        } }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(r => {
        t.true(r.statusCode >= 200 && r.statusCode < 300, `Unexpected status code: ${r.statusCode}`);
        return r;
    })
    .catch((err) => {
        console.error(JSON.stringify(err));
        throw err;
    });
})