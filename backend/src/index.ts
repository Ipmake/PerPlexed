import axios, { AxiosRequestConfig } from 'axios';
import express from 'express';
import https from 'https';

/* 
 * ENVIRONMENT VARIABLES
    *
    * PLEX_SERVER: The URL of the Plex server to proxy requests to
    * DISABLE_PROXY: If set to true, the proxy will be disabled and all requests go directly to the Plex server from the frontend (NOT RECOMMENDED)
    * DISABLE_TLS_VERIFY: If set to true, the proxy will not check any https ssl certificates
**/

const app = express();

app.use(express.json());

if (!process.env.PLEX_SERVER) {
    console.error('PLEX_SERVER environment variable not set');
    process.exit(1);
}

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*'); // Add this line
    next();
});

app.get('/config', (req, res) => {
    res.send({
        PLEX_SERVER: process.env.PLEX_SERVER,
        CONFIG: {
            DISABLE_PROXY: process.env.DISABLE_PROXY === 'true',
        }
    });
});

app.use(express.static('www'));

app.post('/proxy', (req, res) => {
    const { url, method, headers, data } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // the url must start with a / to prevent the server from making requests to external servers
    if (!url || !url.startsWith('/')) return res.status(400).send('Invalid URL');

    // the method must be one of the allowed methods [GET, POST, PUT]
    if (!method || !['GET', 'POST', 'PUT'].includes(method)) return res.status(400).send('Invalid method');

    const config: AxiosRequestConfig = {
        url: `${process.env.PLEX_SERVER}${url}`,
        method,
        headers: {
            ...headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'X-Fowarded-For': ip,
        },
        data,
        ...(process.env.DISABLE_TLS_VERIFY && {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        })
    };

    console.log(`PROXY [${new Date().toISOString()}] [${ip}] [${method}] [${url}]`)

    axios(config)
        .then((response) => {
            res.send(response.data);
        })
        .catch((error) => {
            res.status(error.response?.status || 500).send(error.response?.data || 'Proxy error');
        });
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*');
    res.send();
});

app.use((req, res) => {
    console.log(req.url);
    res.sendFile('index.html', { root: 'www' });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});