'use strict'

const eventStreams = require('./eventStreams');
const config = require('./config');
const events = require('./events')(config);

eventStreams.orderSubject.where(x => x.eventType == 'submitted')
.subscribe(
    (next) => {
        events.publish(events.fromResource(next.payload, 'created', 'purchase'));
    },
    (err) => {},
    () => {}
);

/*
        eventStreams.orderSubject.onNext(events.fromResource(payload, 'submitted'));
        events.publish(events.fromResource(payload, 'orders.submitted'))
        .subscribe(
            () => {}, 
            (err) => handleInternalError(reply, 'Failed to broadcast order creation', err, 'fatal'),
            () => {
                healthcheck.resetStatus();
                reply(payload).code(202);
            }
        );

*/