"use strict";
var assert = require('assert');
function mongoDB(db){
	this.insertRecord = function(collectionName,data,callback){
	   db.collection(collectionName).insertOne(data, function(err, result) {
	   		if(err){
	   			console.log('error ::\n' +err+ '\t @ '+collectionName);
	   		}
		    assert.equal(err, null);
		    console.log("Inserted a document into the restaurants collection.");
		    callback(err,result);
	   });
	}
	this.findRecord = function(collectionName,condition,callback){
      var cursor =db.collection(collectionName).find(condition);
	   cursor.each(function(err, doc) {
	      assert.equal(err, null);
	      if (doc != null) {
	         console.dir(doc);
	      } else {
	         callback();
	      }
	   });
	}
}
module.exports.mongoDB = mongoDB;