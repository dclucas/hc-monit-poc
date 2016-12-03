'use strict'

import test from 'ava';
import * as got from 'got';
import * as config from '../app/config';

test.before(t => {
    return require('../index.js');
})

test('Send order', t => {
    return got.post(`http://localhost:${config.port}/orders`, {
        body: JSON.stringify({
                "data": {
                    "type": "orders",
                    "attributes": {
                        "items": [
                            {"productId": "8130a0c2-e374-4135-b630-2087e305c090", "quantity":1}
                        ]
                    }       
                }
            }),
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