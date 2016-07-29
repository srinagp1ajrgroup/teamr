"use strict";
var User = require('../model/User').User;
function userRoutes(app,db){
	var user = new User(db);
}
module.exports.userRoutes = userRoutes;