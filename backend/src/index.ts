import axios, { AxiosRequestConfig } from 'axios';
import express from 'express';
import https from 'https';
import { PerPlexed } from './types';
import { randomBytes } from 'crypto';

/* 
 * ENVIRONMENT VARIABLES
    *
    * PLEX_SERVERS: A comma separated list of Plex servers the frontend can connect to
    * PROXY_PLEX_SERVER: The URL of the Plex server to proxy requests to
    * FRONTEND_SERVER_CHECK_TIMEOUT?: The timeout in milliseconds for the proxy to check if the frontend server is reachable (default: 2000)
    * DISABLE_PROXY?: If set to true, the proxy will be disabled and all requests go directly to the Plex server from the frontend (NOT RECOMMENDED)
    * DISABLE_TLS_VERIFY?: If set to true, the proxy will not check any https ssl certificates
**/
const deploymentID = randomBytes(8).toString('hex');

const status: PerPlexed.Status = {
    ready: false,
    error: false,
    message: 'Server is starting up...',
}

const app = express();

app.use(express.json());

(async () => {
    if (process.env.PLEX_SERVER) {
        status.error = true;
        status.message = 'PLEX_SERVER has changed to PLEX_SERVERS. Please view the upgrade guide in the 1.0.0 release notes on github. https://github.com/Ipmake/PerPlexed/releases/tag/v1.0.0';
        return;
    }

    if (!process.env.PLEX_SERVERS) {
        status.error = true;
        status.message = 'PLEX_SERVERS environment variable not set';
        console.error('PLEX_SERVER environment variable not set');
        return;
    }

    if (!process.env.PROXY_PLEX_SERVER && process.env.DISABLE_PROXY !== 'true') {
        status.error = true;
        status.message = 'PROXY_PLEX_SERVER environment variable not set. Please view the upgrade guide in the 1.0.0 release notes on github. https://github.com/Ipmake/PerPlexed/releases/tag/v1.0.0';
        console.error('PROXY_PLEX_SERVER environment variable not set');
        return;
    }

    if (process.env.PLEX_SERVERS) {
        // check if the PLEX_SERVERS environment variable is a comma separated list and whether each server is a valid URL, the URL must not end with a /
        const servers = process.env.PLEX_SERVERS.split(',');
        const invalidServers = servers.filter((server) => !server.trim().match(/^https?:\/\/[^\/]+$/));

        if (invalidServers.length > 0) {
            status.error = true;
            status.message = 'Invalid PLEX_SERVERS environment variable. The URL must start with http:// or https:// and must not end with a /';
            console.error('Invalid PLEX_SERVERS environment variable. The URL must start with http:// or https:// and must not end with a /');
            return;
        } 
    }

    if (process.env.PROXY_PLEX_SERVER && process.env.DISABLE_PROXY !== 'true') {
        // check if the PROXY_PLEX_SERVER environment variable is a valid URL, the URL must not end with a /
        if (!process.env.PROXY_PLEX_SERVER.match(/^https?:\/\/[^\/]+$/)) {
            status.error = true;
            status.message = 'Invalid PROXY_PLEX_SERVER environment variable. The URL must start with http:// or https:// and must not end with a /';
            console.error('Invalid PROXY_PLEX_SERVER environment variable. The URL must start with http:// or https:// and must not end with a /');
            return;
        }

        // check whether the PROXY_PLEX_SERVER is reachable
        try {
            await axios.get(`${process.env.PROXY_PLEX_SERVER}/identity`, {
                timeout: 5000,
            });
        } catch (error) {
            status.error = true;
            status.message = 'Proxy cannot reach PROXY_PLEX_SERVER';
            console.error('Proxy cannot reach PROXY_PLEX_SERVER');
            return;
        }
    }

    status.ready = true;
    status.message = 'OK';
})();

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', '*'); // Add this line
    next();
});

app.get('/status', (req, res) => {
    res.send(status);
});

app.get('/config', (req, res) => {
    res.send({
        PLEX_SERVERS: (process.env.PLEX_SERVERS as string).split(",").map((server) => server.trim()),
        DEPLOYMENTID: deploymentID,
        CONFIG: {
            DISABLE_PROXY: process.env.DISABLE_PROXY === 'true',
            FRONTEND_SERVER_CHECK_TIMEOUT: parseInt(process.env.FRONTEND_SERVER_CHECK_TIMEOUT || '2000'),
        }
    });
});

app.use(express.static('www'));

app.post('/proxy', (req, res) => {
    if(process.env.DISABLE_PROXY === 'true') return res.status(400).send('Proxy is disabled');

    const { url, method, headers, data } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // the url must start with a / to prevent the server from making requests to external servers
    if (!url || !url.startsWith('/')) return res.status(400).send('Invalid URL');

    // check that the url doesn't include any harmful characters that could be used for directory traversal
    if (url.match(/\.\./)) return res.status(400).send('Invalid URL');

    // the method must be one of the allowed methods [GET, POST, PUT]
    if (!method || !['GET', 'POST', 'PUT'].includes(method)) return res.status(400).send('Invalid method');

    const config: AxiosRequestConfig = {
        url: `${process.env.PROXY_PLEX_SERVER}${url}`,
        method,
        headers: {
            ...headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'X-Fowarded-For': ip,
        },
        data,
        ...(process.env.DISABLE_TLS_VERIFY === "true" && {
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