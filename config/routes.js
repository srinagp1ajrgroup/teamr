var sio 			= require('socket.io');
var requestify 		= require("requestify");
var http            = require('http');
var routeHandler 	= require('../controller/routeHandler');
var socketHandler 	= require('../controller/socketHandler');
var newSockHandler 	= require('../controller/newSockHandler');
var scocuHandler 	= require('../controller/scocuHandler').scocu;
var redisHandler 	= require('../controller/redisHandler').redisCli;
var util			= require('../model/util').util; 
var redisSock		= require('socket.io-redis');
var globals			= require('./global');
var redisClient 	= require('redis').createClient(globals.redisConfig);
var cluster 		= require('cluster');
var os				= require('os');
var sticky          = require('socketio-sticky-session');


module.exports = function(app, mongo, express){
	"use strict";
	/* clusterization of  app*/
// Code to run if we're in the master process

// if (cluster.isMaster) {

//     // Count the machine's CPUs
//     var cpuCount =os.cpus().length;

//     // Create a worker for each CPU
//     for (var i = 0; i < cpuCount; ++i ) {
//         cluster.fork();
//     }

//     // Listen for dying workers
//     cluster.on('exit', function (worker) {
//         console.log('Worker  died :(    : '+worker.id);
//         cluster.fork();
//     });

//  } else {
// 		sticky(function() {
// 		var server 		= http.createServer(app);
// 		var io 			= sio.listen(server);
// 		var utils 		= new util(mongo);
// 		var redisCli	= new redisHandler (redisClient);
// 		var scocu 		= new scocuHandler(requestify, utils);
// 		io.adapter(redisSock(globals.redisConfig));
// 		routeHandler(app, utils, scocu);
// 		// socketHandler(io, app, utils, scocu);
// 		redisClient.on("error", function(err) {
// 		console.error("Error connecting to redis :" + err);
// 		});
// 		newSockHandler(io, app, utils, scocu, redisCli);	 
// 		return server;
// 		}).listen(globals.appConfig.port, function() {
// 		console.log('server started on port : '+globals.appConfig.port);
// 		});

// 	}
	
	var server 		= http.createServer(app).listen(globals.appConfig.port, function() {
		console.log('server started on port : '+globals.appConfig.port);
	});
	
	var io 			= sio.listen(server);
	var utils 		= new util(mongo);
	var redisCli	= new redisHandler (redisClient);
	var scocu 		= new scocuHandler(requestify, utils);
	io.adapter(redisSock(globals.redisConfig));
	routeHandler(app, utils, scocu);
	// socketHandler(io, app, utils, scocu);
	redisClient.on("error", function(err) {
		console.error("Error connecting to redis :" + err);
	});
	newSockHandler(io, app, utils, scocu, redisCli);


	// sticky(function() {
		
		// return server;
		// }).listen(globals.appConfig.port, function() {
		//	console.log('server started on port : '+globals.appConfig.port);
		// });


}



