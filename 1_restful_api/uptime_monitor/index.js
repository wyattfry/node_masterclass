/*
* this is the primary file for the API
*
*/

// dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// server should respond to all requests with a string
const server = http.createServer((req, res) => {

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
            res.writeHead(statusCode);
            res.end(serializedPayload);
            console.log(`Request: ${method.toUpperCase()} ${trimmedPath}`);
            console.log(`Response:`, statusCode, serializedPayload);
        });
    });
});

const PORT = 2113;

// start server on port 3000
server.listen(PORT, () => {
    console.log(`The server is listening on port ${PORT}`);
});


// handlers
const handlers = {};

handlers.sample = (data, callback) => {
    // callback takes http status code & payload object
    callback(200, {'message': 'looks good.'});
};

handlers.notfound = (data, callback) => {
    callback(404);
};


// request router
const router = {
    'sample': handlers.sample
}