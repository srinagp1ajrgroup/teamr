function util(mongo){
	this.getUserContacts = function(userId,callback){
		mongo.UserContacts.find({'userId':userId}).populate('contactId').exec(function(err,doc){
    		if (err || doc == null) {
    			console.log('error @ getUserContacts : '+err);
    			return callback([]);
    		}else{
    			var list = doc.map(function(obj){
    				var objx = obj.contactId[0];
    				var userMap = {
    					"username"	:objx.username,
			            "picUrl"	:objx.picUrl,
			            "firstName"	:objx.firstName,
			            "lastName"	:objx.lastName,
			            "status"	:objx.status,
			            "description" : objx.description || "Hello world !"
    				};
    				return userMap;
    			});
    			return callback(list);
    		}
    	});

    	// 	mongo.UserContacts.find({'userId':id},{'contactId':1,'_id':0},function(err,doc){
    	// 		if (err || doc == null) {
					// console.log('error @ getUserContacts 1 :: '+err);
    	// 			callback([]);
    	// 		}else{
    	// 			var list = doc.map(function(obj){
	    // 				return obj.contactId;
	    // 			});
					// mongo.Users.find({ '_id' : { $in : list } },conditionObj,function (err,docs){
					// 	if (err || docs == null) {
					// 		console.log('err @ getUserContacts 2 :: '+err);
					// 		callback([]);
					// 	}else{
					// 		callback(docs);
					// 	}
					// });
    	// 		}
    	// 	})
	}
	this.getUserData = function(username,callback){
		mongo.Users.findOne({'username':username},function (err,doc){
			return callback(err,doc);
		});
	}

	this.authenticate = function(username, password, callback){
		mongo.Users.findOne({'username':username, 'password': password},function (err,doc){
			return callback(err,doc);
		});
	}

	this.getUserGroups = function (userId,callback){
		mongo.UserGroups.find({'userId':userId}).populate('groupId').exec(function(err,doc){
    		if (err || doc == null) {
    			console.log('error @ getUserGroups : '+err);
    			return callback([]);
    		}else{
    			var list = doc.map(function(obj){
    				var objx = obj.groupId[0];
					var GroupMap = {
						"group_id"	:objx._id,
    					"name"		:objx.name,
			            "picUrl"	:objx.picUrl,
			            "customId"	:objx.customId
    				};
    				return GroupMap;
    			});
    			return callback(list);
    		}
    	});
		// mongo.UserGroups.find({'userId':id},{'groupId':1,'_id':0}).exec(function(err,doc){
		// 	if (err || doc == null) {
		// 		console.log('error @ getUserGroups 1 :: '+err);
		// 		callback([]);
		// 	}else{
  //   			var list = doc.map(function(obj){
  //   				return obj.groupId;
  //   			});
		// 		mongo.Groups.find({ '_id' : { $in : list } },{'_id':0},function (err,groupsList){
		// 			if (err || groupsList == null) {
		// 				console.log('err @ getUserGroups 2 :: '+err);
		// 				callback([]);
		// 			}else{
		// 				callback(groupsList)
		// 			}
		// 		})
		// 	}
		// })
	}
	this.getGroupMemebers = function (groupId,callback){
		mongo.UserGroups.find({'groupId':groupId}).populate('userId').exec(function(err,doc){
    		if (err || doc == null) {
    			console.log('error @ getGroupMemebers : '+err);
    			return callback([]);
    		}else{
    			 var list = doc.map(function(obj){
    				var objx = obj.userId[0];
    				var userMap = {
    					"user_id"	:objx._id,
    					"username"	:objx.username,
			            "picUrl"	:objx.picUrl,
			            "firstName"	:objx.firstName,
			            "lastName"	:objx.lastName,
			            "status"	:objx.status,
			            "isAdmin"	:obj.isAdmin,
			            "isModifier":obj.isModifier
    				};
    				return userMap;
    			});
    			return callback(list);
    		}
    	});
		// mongo.UserGroups.find({'groupId':groupId},{'_id':0},function(err,gData){
		// 	if (err || gData == null) {
		// 		console.log('err @ getGroupMemebers 1 ::'+err);
		// 		callback([]);
		// 	}else{
		// 		var list = gData.map(function(obj){
		// 			mongo.Users.findOne({'_id':obj._id},{'_id':0},function (err,doc){
		// 				if(err || doc == null){
		// 					console.log('err @ getGroupMemebers 2 :: '+err);
		// 				}else{
		// 					doc['isAdmin'] = obj.isAdmin;
		// 					doc['isModifier'] = obj.isModifier;
		// 					return doc;
		// 				}
		// 			});
		// 		});
		// 		callback(list);
		// 	}
		// })
	}
	this.getGroupData = function (customId,callback){
		mongo.Groups.findOne({'customId':customId},function(err,doc){
				return callback(err,doc);
		});
	}
	this.saveOfflineMessage = function (data){
		new mongo.OfflineMsgs(data).save(function (err,doc){
			if (err) {
				console.log('err @ saveOfflineMessage :: '+err);
			}
		});
	}
	this.saveMessages = function (data){
		new mongo.Messages(data).save(function (err,doc){
			if (err) {
				console.log('err @ saveMessages :: '+err);
			}
		});
	}
	this.saveOfflineGroupMessage = function (data){
		new mongo.OfflineGroupMsgs(data).save(function (err,doc){
			if (err) {
				console.log('err @ saveOfflineGroupMessage :: '+err);
			}
		});
	}
	this.saveGroupMessage = function (data){
		new mongo.GroupMessages(data).save(function (err,doc){
			if (err) {
				console.log('err @ saveGroupMessage :: '+err);
			}
		});
	}
	this.createGroup = function (data ,callback){
		new mongo.Groups(data).save(function (err,doc){
			callback(err,doc);
		});
	}
	this.createGroupMembers = function(gData,list){
		list.forEach(function(obj,index,ary){
			var xObj = {
					"userId" : null,
					"groupId" : gData._id,
					"isAdmin" : obj.isAdmin,
					"isModifier" : obj.isModifier
				}
			insertUserIntoUsergroups(xObj,obj.username,function (objx){
				if (obj != null) {
					new mongo.UserGroups(objx).save(function (err,doc){
						if (err) {
							console.log(obj.username+' err @ createGroupMembers ::'+err );
						}
					})
				}
			});
		})
	}
	this.deleteGroup = function(userId,groupId,callback){
		mongo.Groups.remove({'userId':userId,'groupId':groupId,'isAdmin':true,'isModifier':true},function (err,doc){
			return callback(err,doc);
		})
	}
	this.deleteGroupMembers = function (groupId){
		mongo.UserGroups.remove({'groupId':groupId},function(err,doc){
			if (err) {
				console.log('error @ deleteGroupMembers '+err);
			};
		})
	}
	this.exitGroup = function (userId,groupId,callback){
		mongo.UserGroups.remove({'userId':userId,'groupId':groupId,'isAdmin':false,'isModifier':false},function (err,doc){
			return callback(err,doc);
		})
	}
	this.getOfflineMessage = function(userId,callback){
		var conditionObj = {
			'_id':0,
			"toUser": 1,
			"toUser_id":  0,
			"fromUser_id":  0,
			"fromUser": 1, 
			"timestamp": 1, 
			"isVideo": 1, 
			"isAudio": 1, 
			"isFileTransfer": 1, 
			"isMedia": 1, 
			"type": 1, 
			"msg": 1 ,
			"msgId": 1, 
			"isSent": 1 , 
			"isDelivered": 1 , 
			"isRead": 1
		};
		mongo.OfflineMsgs.find({'toUser_id':userId}).select(conditionObj).exec(function (err,doc){
			return callback(err,doc);
		});
	}
	this.removeOfflineMessage = function (userId){
		mongo.OfflineMsgs.remove({'toUser_id':userId});
	}
	this.getOfflineGroupMsgs = function (userId,callback){
		var  conditionObj = {
			"_id":0,
			"groupId": 1,
			"group_id": 0,
			"toUser": 1,
			"toUser_id":0, 
			"fromUser": 1,
			"fromUser_id": 0, 
			"timestamp": 1, 
			"isVideo": 1, 
			"isAudio": 1, 
			"isFileTransfer": 1, 
			"isMedia": 1, 
			"type": 1, 
			"msg": 1 ,
			"msgId": 1, 
			"isSent": 1 
		}
		mongo.OfflineGroupMsgs.find({'toUser_id':userId}).select(conditionObj).exec(function (err,doc){
			return callback(err ,doc);
		});
	}
	this.removeOfflineGroupMsgs = function (userId){
		mongo.OfflineGroupMsgs.remove({'toUser_id':userId});
	}
	function insertUserIntoUsergroups(obj,username,callback){
		mongo.Users.findOne({'username':username},function (err,doc){
			if (err || doc == null) {
				console.log(username+' :: err @ insertUserIntoUsergroups :: '+err);
				return callback(null);
			}else{
				obj.userId = doc._id;
				return callback(obj);
			}
		})
	}

	this.checkgroup = function(groupname){

	}
	this.setUserData = function (username, id, token){
		mongo.UserToken.update({"username": username},{$set:{"token":token ,'user_id':id }},{'upsert':true}).exec(function (err, doc){
			if(err)
				console.log(err);
			else{
				console.log('setUserData done : '+JSON.stringify(doc));
			}
		});
	}

	this.setStatusid = function (id, statusId){
		mongo.UserToken.update({"user_id": id},{$set:{'status_id': statusId}}).exec(function (err, doc){
			if(err)
				console.log(err);
			else{
				console.log('setUserData done : '+JSON.stringify(doc));
			}
		});
	}

	this.getUserData = function(username, callback){
		mongo.UserToken.findOne({"username": username}, function(err, user){
			if(err){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
			}
			callback(err, user);
		});
	}

	this.deleteUserData = function(username){
		mongo.UserToken.remove({"username":username}, function(err,doc){
			console.log(err +' -- '+doc);
		});
	}

/*	this.setCollectionRowId = function(collectionId,collectionName,rowId){
		mongo.collectionrowids.update({"collectionId": collectionId ,"collectionName":collectionName },{$set:{"rowId":rowId}},{'upsert':true})
		.exec(function (err, doc){
			if(err)
				console.log(err);
			else{
				console.log('setCollectionRowId done : '+JSON.stringify(doc));
			}
		});
	}

	this.getCollectionRowId = function(collectionId,collectionName,callback){
		mongo.collectionrowids.findOne({'collectionId':collectionId,'collectionName':collectionName })
			.exec(function (err,doc){
				if(err)
					err = "unable to get the rowId err:"+err;
				callback(err,doc);
		})
	}

	this.removeCollectionRowId = function(collectionId,collectionName){
		mongo.collectionrowids.remove({'collectionId':collectionId,'collectionName':collectionName })
			.exec(function (err,doc){
				if(err)
					console.log('unable to remove rowId error:'+err);
		})
	}*/

}
module.exports.util = util;
