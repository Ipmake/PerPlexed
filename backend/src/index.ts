import axios, { AxiosRequestConfig } from 'axios';
import express from 'express';
import http from 'http';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import { PerPlexed } from './types';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { CheckPlexUser } from './common/plex';

/* 
 * ENVIRONMENT VARIABLES
    *
    * PLEX_SERVER: The URL of the Plex server that the frontend will connect to
    * PROXY_PLEX_SERVER?: The URL of the Plex server to proxy requests to
    * DISABLE_PROXY?: If set to true, the proxy will be disabled and all requests go directly to the Plex server from the frontend (NOT RECOMMENDED)
    * DISABLE_TLS_VERIFY?: If set to true, the proxy will not check any https ssl certificates
    * DISABLE_PERPLEXED_SYNC?: If set to true, perplexed sync (watch together) will be disabled
    * DISABLE_REQUEST_LOGGING?: If set to true, the server will not log any requests
**/
const deploymentID = randomBytes(8).toString('hex');

const status: PerPlexed.Status = {
    ready: false,
    error: false,
    message: 'Server is starting up...',
}

const app = express();
const prisma = new PrismaClient();


app.use(express.json());

(async () => {
    if (!process.env.PLEX_SERVER) {
        status.error = true;
        status.message = 'PLEX_SERVER environment variable not set';
        console.error('PLEX_SERVER environment variable not set');
        return;
    }

    if (!process.env.PROXY_PLEX_SERVER && process.env.DISABLE_PROXY !== 'true') process.env.PROXY_PLEX_SERVER = process.env.PLEX_SERVER

    if (process.env.PLEX_SERVER) {
        // check if the PLEX_SERVER environment variable is a valid URL, the URL must not end with a /
        if (!process.env.PLEX_SERVER.match(/^https?:\/\/[^\/]+$/)) {
            status.error = true;
            status.message = 'Invalid PLEX_SERVER environment variable. The URL must start with http:// or https:// and must not end with a /';
            console.error('Invalid PLEX_SERVER environment variable. The URL must start with http:// or https:// and must not end with a /');
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


    // if(!status.error) {
    //     let checkAllows = false;
    //     const fetchStatus = async () => {
    //         try {
    //             const res = await axios.get(`${process.env.PROXY_PLEX_SERVER}/`, {
    //                 timeout: 2500,
    //             });

    //             const m = res.data.MediaContainer;

    //             if(
    //                 !m.transcoderAudio ||
    //                 !m.transcoderSubtitles ||
    //                 !m.transcoderVideo
    //             ) {
    //                 status.error = true;
    //                 status.message = `PLEX_SERVER ${m.friendlyName} does not allow transcoding`;
    //                 console.error(`PLEX_SERVER ${m.friendlyName} does not allow transcoding`);
    //                 return;
    //             }

    //             checkAllows = true;
    //             status.error = false;

    //         } catch (error: any) {
    //             status.error = true;
    //             status.message = 'Server cannot reach PLEX_SERVER' + error.message;
    //             console.error('Server cannot reach PLEX_SERVER ' + error.message);
    //         }
    //     }

    //     await new Promise<void>((resolve) => {
    //         setTimeout(() => {
    //             if(checkAllows) return resolve();
    //             fetchStatus();
    //         }, 5000);
    //     })
    // }


    if(status.error) return;
    status.ready = true;
    status.message = 'OK';
})();

app.use((req, res, next) => {
    if (process.env.DISABLE_REQUEST_LOGGING != "true") console.log(`[${new Date().toISOString()}] [${req.method}] ${req.url}`);
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
        PLEX_SERVER: process.env.PLEX_SERVER,
        DEPLOYMENTID: deploymentID,
        CONFIG: {
            DISABLE_PROXY: process.env.DISABLE_PROXY === 'true',
            DISABLE_PERPLEXED_SYNC: process.env.DISABLE_PERPLEXED_SYNC === 'true',
        }
    });
});

app.get('/user/options', async (req, res) => {
    if(!req.headers['X-Plex-Token']) return res.status(401).send('Unauthorized');

    const user = await CheckPlexUser(req.headers['X-Plex-Token'] as string);
    if(!user) return res.status(401).send('Unauthorized');

    const options = await prisma.userOption.findMany({
        where: {
            userUid: user.uuid,
        }
    }).catch(() => {
        res.status(500).send('Internal server error');
        return null;
    });
    if(!options) return;

    res.send(options);
});

app.post('/user/options', async (req, res) => {
    if(!req.headers['X-Plex-Token']) return res.status(401).send('Unauthorized');

    const user = await CheckPlexUser(req.headers['X-Plex-Token'] as string);
    if(!user) return res.status(401).send('Unauthorized');

    const { key, value } = req.body;

    if(!key || !value) return res.status(400).send('Bad request');

    const option = await prisma.userOption.upsert({
        where: {
            userUid_key: {
                userUid: user.uuid,
                key,
            }
        },
        update: {
            value,
        },
        create: {
            userUid: user.uuid,
            key,
            value,
        }
    }).catch(() => {
        res.status(500).send('Internal server error');
        return null;
    });
    if(!option) return;

    res.send(option);
});

app.use(express.static('www'));

app.post('/proxy', (req, res) => {
    if (process.env.DISABLE_PROXY === 'true') return res.status(400).send('Proxy is disabled');

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

app.use((req, res, next) => {
    if(req.url.startsWith('/socket.io')) return next();
    res.sendFile('index.html', { root: 'www' });
});

const server = app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

let io = (process.env.DISABLE_PERPLEXED_SYNC === 'true') ? null : new SocketIOServer(server, {
    cors: {
        origin: '*',
    },
});

export { app, server, io, deploymentID, prisma };

import './common/sync';
import { features } from 'process';
