/*
* this is the primary file for the API
*
*/

// dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');

const config = require('./config');

// instantiate the http server
const httpServer = http.createServer(unifiedServer);

// start server
httpServer.listen(config.httpPort, () => {
    console.log(`The http server is listening on port ${config.httpPort}`);
});

const httpsServerOptions = {
    'key': fs.readFileSync(`${__dirname}/https/key.pem`),
    'cert': fs.readFileSync(`${__dirname}/https/cert.pem`),
};

// instantiate the https server
const httpsServer = https.createServer(httpsServerOptions, unifiedServer);

// start the https server
httpsServer.listen(config.httpsPort, () => {
    console.log(`The https server is listening on port ${config.httpsPort}`)
})

function unifiedServer(req, res) {

    // get url and parse
    const parsedUrl = url.parse(req.url, true);

    // get path from parsed url
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // get query string as obj
    const queryStringObject = parsedUrl.query;

    // get request method (e.g. get, post, put, delete etc)
    const method = req.method.toLowerCase();

    // get headers as object
    const header = req.headers;

    // get payload / body if exists
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        // console.log('data', data.length);
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // choose handler
        const handler = typeof(router[trimmedPath]) !== 'undefined' ?  router[trimmedPath] : handlers.notfound;
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            header,
            'payload': buffer,
        }
        handler(data, (statusCode = 200, payload = {}) => {
            serializedPayload = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(serializedPayload);
            console.log(`Request: ${method.toUpperCase()} ${trimmedPath}`);
            console.log(`Response:`, statusCode, serializedPayload);
        });
    });
}

// handlers
const handlers = {};

handlers.notfound = (data, callback) => {
    callback(404);
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

// request router
const router = {
    'ping': handlers.ping
}