"use strict";
var sio 			= require('socket.io');
var requestify 		= require("requestify");
var http            = require('https');
var routeHandler 	= require('../controller/routeHandler');
var newSockHandler 	= require('../controller/newSockHandler');
var scocuHandler 	= require('../controller/scocuHandler').scocu;
var dbutil			= require('../model/dbutil').dbutil;
var utils			= require('../model/utils');
var globals			= require('./global');
var cluster 		= require('cluster');
var os				= require('os');
var fs 				= require('fs');
//var sticky          = require('socketio-sticky-session');

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

	var options = {
		key: fs.readFileSync('certs/new1.pem'),
		cert: fs.readFileSync('certs/17586483repl_2.crt')
	};
	var server 		= http.createServer(options, app).listen(globals.appConfig.port, function() {
		console.log('server started on port : '+globals.appConfig.port);
	});
	
	var io 			= sio.listen(server);
	var dbutils 		= new dbutil(mongo);
	var scocu 		= new scocuHandler(requestify, utils);
	// io.adapter(redisSock(globals.redisConfig));
	routeHandler(io, app, dbutils, scocu, utils);
	// socketHandler(io, app, utils, scocu);
	newSockHandler(io, app, dbutils, scocu, utils);

	// sticky(function() {
		
		// return server;
		// }).listen(globals.appConfig.port, function() {
		//	console.log('server started on port : '+globals.appConfig.port);
		// });


}



