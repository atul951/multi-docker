const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
    if(index < 2) return 1;
    return fib(n-1) + fib(n-2);
}

sub.on('messgae', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(index)));
});

sub.subscribe('insert');
