let request = require('request');
let http = require('http');
let path = require('path');
let fs = require('fs');
let url = require('url');

// Set a the default value for --host to 127.0.0.1
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv;

let logPath = argv.log && path.join(__dirname, argv.log);
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout;

// Build the destinationUrl using the --host value
// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80);
let destinationUrl = argv.url || url.format({
  protocol: 'http',
  host: argv.host,
  port
});
console.log("\n Destination url :: " + destinationUrl + "\n port = " +port);
/**
 * Proxy server
 */
http.createServer((req, res) => {
  console.log(`\n\n Proxying request to: ${destinationUrl + req.url}`);
  logStream.write("\n\n\n Proxy request ::  " + JSON.stringify(req.headers));
  // Proxy code
  let options = {
      headers: req.headers,
      url: `http://127.0.0.1:8000/{req.url}`,
      method: req.method
  };

  // Log the proxy request headers and content in the **server callback**
  let outboundResponse = request(options);
  req.pipe(outboundResponse);
  logStream.write("\n\n outboundResponse = " + JSON.stringify(outboundResponse.headers));
  outboundResponse.pipe(res);
}).listen(8001);

/**
 * Destination server
 */
http.createServer((req, res) => {
  logStream.write("\n\n\n Destination server request headers ::  " + JSON.stringify(req.headers));
  for (let header in req.headers) {
    res.setHeader(header, req.headers[header]);
  }
  req.pipe(res);
}).listen(8000);
