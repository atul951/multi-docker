const keys = require('./keys')

// Express app setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PG client setup
const { Pool } = require('pg');
const pgClient = new Pool({
    database: keys.pgDatabase,
    host: keys.pgHost,
    port: keys.pgPort,
    user: keys.pgUser,
    password: keys.pgPassword
})

pgClient.on('error', () => console.log('Lost pg client connection'));

pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err));

// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redistPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();



// Express routes
app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM VALUES');

    res.send(values.rows);
})

app.get('/values/current', (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
})

app.post('/values', (req, res) => {
    const index = req.body.index;

    if(parseInt(index) > 40){
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true});
})

app.listen(5000, () => {
    console.log('Listen on port 5000');
})