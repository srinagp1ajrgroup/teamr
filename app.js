"use strict";
var express         = require('express')
var expressSession  = require('express-session');
var bodyParser      = require("body-parser");
var MongoStore      = require('connect-mongo')(expressSession);
var mongoose 		= require('mongoose');
var routes			= require('./config/routes');
var mongo           = require('./config/mongo');
var globals			= require('./config/global');
var requestIp 		= require('request-ip');

var http 			= require('http');

var app = express();

var ipMiddleware = function(req, res, next) {
    var clientIp = requestIp.getClientIp(req); 
    next();
};

var httpServer = http.createServer(app);
httpServer.listen(8080);

function ensureSecure(req, res, next){
  if(req.secure){
    return next();
  };
  res.redirect('https://'+req.host+':' + 8081 + req.url);
};

app.all('*', ensureSecure);

app.use(requestIp.mw())

var session = expressSession({
	secret: globals.secret,
	resave: true,
	saveUninitialized:true,
	store: new MongoStore({ mongooseConnection: mongoose.connection })
})

app.use(session);
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

routes(app, mongo);
