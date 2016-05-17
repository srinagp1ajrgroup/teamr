// var chatModule = require('../model/chat').chatModule;
var globals = require('../config/global');
module.exports = function(io, app, utils ,scocu){
	/* function definitions */
	function removeSocketId(username){
		delete io.sockets.sockets[username];
	}
    function getSocketId(username,callback){
		callback (io.sockets.sockets[username]);
	}
	function setSocketId(username){
		io.sockets.sockets[username] = socket.id;
	}
	function emitToUser(eventType, data, sockid){
		if (io.sockets.connected[sockid])
			io.sockets.connected[sockid].emit(eventType, data);
	}
	function presenceUpdate(username,status,list){
		var data = {'username':username ,'status': status};
		sendUpdate(data,list,"presence");
	}
	function emitMsg(username,data,eventName){
		for(var j = 0 ; j < globals.devList.length ; j++ ){
			getSocketId ( globals.devList[j] + '_' + username, function (sockid){
				if( sockid != undefined ){
					emitToUser(eventName, data , sockid);
				}
			});
		};
	}
	/* send msg to all devices using sendupdate */
	function sendUpdate(data,list,eventName){
		/* list is [{username:'x'}] */
		for (var i = 0; i < list.length; i++) {
			emitMsg(list[i].username,data,eventName);
		};
	}
	function sendGroupMessage(data,list){
		sendUpdate(data,list,"groupChat");
	}
	function addingGroupMembers(data,obj){
		
	}
	/* client connection established here*/
	io.on('connection', function (socket){
		/*client subscribe socket here*/
		socket.on('subscribe',function (data){
			console.log('user agent ----------:'+socket.request.headers['user-agent']);
			/* {'username':'abc','devType':'m/w/t'} */
			console.log('subscribe: '+data.devType+'_'+data.username);
			setSocketId(data.devType+'_'+data.username);
			/*adding all users to main room*/
			socket.join("allXenChatUsers");
		});
		/* client presence here*/
		socket.on('presence',function (data,callback){
			/* {'username':'abc' , 'status':'online/offline/away/sleep','devType':'m/w/t'} */
			utils.getUserData(data.username,function (err,doc){
				if(err || doc == null){
					/*get user id based on username from scocu */
					console.log('error @ contactslist :: '+err);
					callback({'status':'error','data':[]});
				}else{
					var presence = {"user" : {"user_id" : doc.user_id, "presence" : data.status, "picture_url" : ""}}
					scocu.updateCollectionData(presence, doc.user_id, doc.token, function(err, body){
						console.log(err, body);
					});
				}
			});

			callback({'status':'success'});
		});
		/* client getcontacts socket here*/
		socket.on('contactslist',function (data,callback){
			/* {'username':'abc','devType':'m/w/t'} */
			utils.getUserData(data.username,function (err,doc){
				if(err || doc == null){
					/*get user id based on username from scocu */
					console.log('error @ contactslist :: '+err);
					callback({'status':'error','data':[]});
				}else{
					var collectionData = {
							    "fields": {
							        "only": [
							            "_id"
							        ],
							        "related":  ["username","firstname","lastname"],
							        "relation" : "contactid"
							    },
							   "filters": [{
							        "field": "userid",
							        "cond": "eq",
							        "val": doc.user_id
							    }]
							};
					scocu.relationQuery("newusercontacts", "users",collectionData, doc.token ,function (err,sData){
						if(err){
							console.log('error @ contactslist :::: '+err);
							callback({'status':'error','data':[]});
						}
						else{
							if(sData.status == "success" && sData.data.length > 0){
								var list = sData.data.map(function (obj){
								   var rObj = {
								   	'username':obj.username,
								   	'firstname':obj.firstname,
								   	'lastname':obj.lastname,
								   	'picUrl': 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSFvKRxrpfWqFli7me5tYx06MrZpu6UJ3_HcCrDXk4ieQL0HaiV1w',
								   	'status':'offline',
								   	'description':'Hello world!'
								   };
								   return rObj;
								});
								/*presence update to all conatcts*/
								presenceUpdate(data.username,'online',sData.data);
								/*callback formatted data*/
								callback({'status':sData.status,'data':list});
							}else{
								callback({'status':sData.status,'data':[]});
							}
						}
					})
				}
			});


		});
		/* client getcontacts socket here*/
		socket.on('groupslist',function (data,callback){
			/* {'username':'abc','devType':'m/w/t'} */
			utils.getUserData(data.username , function (err,doc){
				if(err){
					console.log('error @ groupslist '+err);
				}else{
					var collectionData = {
							    "fields": {
							        "only": [
							            "_id"
							        ],
							        "related":  ["groupid"],
							        "relation" : "userid"
							    },
							   "filters": [{
							        "field": "userid",
							        "cond": "eq",
							        "val": doc.user_id
							    }]
							};
				}
			})


		});
		/*individual chat*/
		socket.on('privateChat',function (data,callback){
			/*data = {
		      "toUser": String, 
		      "fromUser": String, 
		      "timestamp": Date, 
		      "isvideo": Boolean, 
		      "isAudio": Boolean, 
		      "isFileTransfer": Boolean, 
		      "isMedia": Boolean, 
		      "type": String, 
		      "msg": String ,
		      "msgId": String, 
		      "isSent": Boolean , 
		      "isDelivered": Boolean , 
		      "isRead": Boolean
		    }*/
			console.log('privateChat with callback:'+JSON.stringify(data));
			data.isSent = true;
			var isPresent = false;
			/*checking for all type device sockets*/
			for(var i = 0 ; i < globals.devList.length ; i++ ){
				getSocketId ( globals.devList[j] + '_' + list[i].username ,function (sockid){
					if( sockid != undefined ){
						emitToUser('privateChat', data, sockid);
						isPresent = true;
					}
				});
				if(i == globals.devList.length - 1){
					if(!isPresent){
						utils.getUserData(data.fromUser,function (err,doc){
							if ( err || doc == null ) {
								console.log('err@privateChat save msg :: '+err);
							}else{
								// scocu.saveOfflineMessage("OfflineMessages",data,token);
							}
						})
					}
				}
			};
			
			callback(data);
		});
		/* chat acknowledgement */
		socket.on('chatAck',function (data,callback){
			/*data = {
		      "toUser": String, 
		      "fromUser": String, 
		      "timestamp": Date, 
		      "isvideo": Boolean, 
		      "isAudio": Boolean, 
		      "isFileTransfer": Boolean, 
		      "isMedia": Boolean, 
		      "type": String, // type 'msg' or 'ack'
		      "msg": String ,
		      "msgId": String, 
		      "isSent": Boolean , 
		      "isDelivered": Boolean , 
		      "isRead": Boolean
		    }*/
			console.log('chatAck with callback:'+JSON.stringify(data));
			data.isSent = true;
			var isPresent = false;
			/*checking for all type device sockets*/
			for(var i = 0 ; i < globals.devList.length ; i++ ){
				getSocketId ( globals.devList[j] + '_' + list[i].username ,function (sockid){
					if( sockid != undefined ){
						emitToUser('chatAck', data, sockid);
						isPresent = true;
					}
				});
				if(i == globals.devList.length - 1){
					if(!isPresent){
						utils.getUserData(data.fromUser,function (err,doc){
							if ( err || doc == null ) {
								console.log('err@chatAck save msg :: '+err);
							}else{
								// scocu.saveOfflineMessage("OfflineMessages",data,token);
							}
						})
					}
				}
			};
			callback(data);
		});

		/*group chat*/
		socket.on('groupChat',function (data,callback){
			/*data = {
		      "groupId": String,
		      "fromUser": String, 
		      "timestamp": Date, 
		      "isvideo": Boolean, 
		      "isAudio": Boolean, 
		      "isFileTransfer": Boolean, 
		      "isMedia": Boolean,
		      "type": String, 
		      "msg": String ,
		      "msgId": String, 
		      "isSent": Boolean
		     }*/
			console.log('groupChat with callback:'+JSON.stringify(data));
			data.isSent = true;
			utils.getUserData(data.fromUser,function (err,doc){
				if(err || doc == null){
					/*get user id based on username from scocu */
					console.log('error @ contactslist :: '+err);
					callback({'status':'error','data':[]});
				}else{
					var collectionData = {
						    "fields": {
						        "only": [
						            "_id"
						        ]
						    },
						   "filters": {
						        "field": "customid",
						        "cond": "eq",
						        "val": data.groupId
						    }
						};
						/* get groups data */
					scocu.search("groups", collectionData, doc.token ,function (err,resData){
						if (err) {
							console.log('error @ group search '+err);
						}else{
							if(resData.status == "success"){
								var collectionData = {
									    "fields": {
									        "only": [
									            "_id"
									        ],
									        "related":  ["username"],
									        "relation" : "userid"
									    },
									   "filters": [{
									        "field": "groupid",
									        "cond": "eq",
									        "val": resData.id
									    }]
									};
								/* get group members username */
								scocu.relationQuery("usergroups", "users",collectionData, doc.token ,function (err,sData){
									if(err){
										console.log('error @ groupChat :::: '+err);
									}
									else{
										if(sData.status == "success" && sData.data.length > 0){
											sendGroupMessage(data,sData.data);
											}
									}
								})
							}
						}
					});
					
				}
			});
			/*checking for all type device sockets*/
			
			callback(data);
		});
		/* createGroup socket*/
		socket.on('createGroup',function (data,callback){
			/* {
			  "username": String,
		      "groupId": String,
		      "picUrl": String,
		      "name": String,
		      "members": [] // {'username':'','isAdmin':true/false,'isModifier':true/false}
			} */
			utils.getUserData(data.username,function (err,doc){
				if ( err || doc == null ) {
					console.log('err @ createGroup :: '+err);
					callback({'status':'error'});
				}else{
					var obj = {
						'customId':data.groupId,
						'name':data.name,
						'picUrl':data.picUrl
					};
					scocu.createGroup(obj,token,function (err,sData){
						if(err){
							console.log('error @ createGroup :: '+err);
							callback({'status':'error'});
						}else{
							if(sData.status == "success"){
								addingGroupMembers(data,sData.data)
								callback({'status':'success'});
							}else{
								callback({'status':'error'});
							}
						}
					});
				}
			})
			
		});
		socket.on('deleteGroup',function (data,callback){
			/* {
			  "username": String,
		      "groupId": String
			} */
			utils.getUserData(data.username,function (err,doc){
				if ( err || doc == null ) {
					console.log('err @ createGroup :: '+err);
					callback({'status':'error'});
				}else{
					var collectionData = {
						    "fields": {
						        "only": [
						            "_id"
						        ]
						    },
						   "filters": {
						        "field": "customid",
						        "cond": "eq",
						        "val": data.groupId
						    }
						};
						/* get groups data */
					scocu.search("groups", collectionData, doc.token ,function (err,resData){
						if (err) {
							console.log('error @ group search '+err);
						}else{
							if(resData.status == "success"){
								/*now we have doc.user_id,resData.data.id now remove */
							}
						}
					});
					
				}
				
			})
			
		});


		socket.on('exitGroup',function (data,callback){
			/* {
			  "username": String,
		      "groupId": String
			} */
			utils.getUserData(data.username,function (err,doc){
				if ( err || doc == null ) {
					console.log('err @ createGroup :: '+err);
					callback({'status':'error'});
				}else{
					var collectionData = {
						    "fields": {
						        "only": [
						            "_id"
						        ]
						    },
						   "filters": {
						        "field": "customid",
						        "cond": "eq",
						        "val": data.groupId
						    }
						};
						/* get groups data */
					scocu.search("groups", collectionData, doc.token ,function (err,resData){
						if (err) {
							console.log('error @ group search '+err);
						}else{
							if(resData.status == "success"){
								/*now we have doc.user_id,resData.data.id now remove remove that record from table */
							}
						}
					});
					
				}
				
			})
			
		});

		/* socket disconnect*/
		socket.on('disconnect', function (data) {
			/* {'username':'','devType':''} */
			removeSocketId ( data.devType + '_' + data.username ) ;
	       	socket.disconnect();
	       	utils.getUserData(data.username ,function (err,doc){
	       		if(err || doc == null){
	       			console.log('error @ disconnect getUserData :: '+err);
	       		}else{
	       			/* update user status offline*/
	       		}
	       	})
	    });
		

	});


}