var express = require('express');
var cluster = require('express-cluster');
var cache = require('express-redis-cache')({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  expire: 60
});
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');

var parseServerConfig = {
  databaseURI: process.env.PARSE_DATABASE_URI || 'mongodb://localhost:27017/dev', // Don't forget to add ?authSource=admin when using admin
  masterKey: process.env.PARSE_MASTER_KEY || '', // Keep it secret!
  serverURL: process.env.PARSE_SERVER_URL || 'http://localhost:8080/parse',  // Don't forget to change to https if needed
  appId: process.env.PARSE_APP_ID || 'myAppId',
  cloud: process.env.PARSE_CLOUD || __dirname + '/cloud/main.js',
  allowClientClassCreation: false,
  enableAnonymousUsers: false
  //verbose: true,
}

var parseDashboardConfig = {
  "trustProxy": 1, // change to false if not behind proxy
  'useEncryptedPasswords': false, // if true use: https://bcrypt-generator.com/
  "apps": [
    {
      "serverURL": process.env.PARSE_DASHBOARD_SERVER_URL || process.env.PARSE_SERVER_URL || 'http://localhost:8080/parse', // Don't forget to change to https if needed
      "appId": process.env.PARSE_APP_ID || 'myAppId',
      "masterKey": process.env.PARSE_MASTER_KEY || '',
      "appName": process.env.PARSE_APP_ID || 'myAppId'
    },
  ],
  "users": [
    {
      "user": process.env.PARSE_DASHBOARD_USER || '',
      "pass": process.env.PARSE_DASHBOARD_PASS || '',
      "apps": [{"appId": process.env.PARSE_DASHBOARD_APP_ID || process.env.PARSE_APP_ID || 'myAppId'}]
    },
  ],
}

var parseDashboardServerConfig = {
  cookieSessionSecret: process.env.PARSE_COOKIE_SESSION_SECRET || 'myCookieSessionSecret', // Must have because were in clustered environment
  allowInsecureHTTP: true, // change to false if not behind proxy
}

cache.on('message', function (message) {
  console.log("cache messege: ",message)
});

cache.on('connected', function () {
  console.log("cache connected")
});

cache.on('disconnected', function () {
  console.log("cache disconnected")
});

cluster(function (worker) {

  var app = express();

  // Serve the Parse API on the /parse URL prefix
  app.use('/parse', new ParseServer(parseServerConfig));

  // make the Parse Dashboard available at /dashboard
  app.use('/dashboard', new ParseDashboard(parseDashboardConfig, parseDashboardServerConfig));
  
  // Serve all other routes with cache enabled
  app.get('/', cache.route(), function (req, res) {
    res.send('Hello World from worker #' + worker.id + "! We are shipping Nodejs-Version: " + process.version);
  });


  var port = process.env.PORT || 8080;

  var httpServer = require('http').createServer(app);

  httpServer.listen(port, function() {
    console.log('Worker #' + worker.id + ' listening on port:' + (process.env.PORT || 8080));
  });

  // This will enable the parse Live Query real-time server
  // ParseServer.createLiveQueryServer(httpServer);

}, {
    //verbose: true,
});
