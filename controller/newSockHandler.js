// var chatModule = require('../model/chat').chatModule;
var globals 	= require('../config/global');
var extend 		= require('extend');
module.exports = function(io, app, utils ,scocu, redis, ioEmitter)
{
	function removeSocketId(username){
		redis.delete(username);
	}
    function getSocketId(username,callback){
    	redis.get(username,callback);
	}
	function setSocketId(username,id){
		redis.set(username, id);
	}
	function emitToUser(eventType, data, sockid){
		if (io.sockets.connected[sockid])
			io.sockets.connected[sockid].emit(eventType, data);
	}
	function emitGroupMsg(groupId, groupMsg, eventType){
		 io.sockets.broadcast.to(groupId).emit(eventType, groupMsg);
	}
	function emitMsg(username, data, eventName, callback){
		var isPresent = false,i = 0;
		 function loop(i){
		 	getSocketId ( globals.devList[i]+'_'+username, function (sockid)
		 	{
				if( sockid != undefined ){
					emitToUser(eventName, data , sockid);
					isPresent = true;
				}
				if (i == (globals.devList.length - 1)) {
		 			callback(isPresent);
			 	}else{
			 		loop(++i);
			 	}
			});
		 }loop(i);
	}
	function sendUpdate(data, list, eventName){
		/* list is [{username:'x'}] */
		for (var i = 0; i < list.length; i++) {
			console.log('emit msg to '+list[i].username);
			emitMsg(list[i].USERNAME,data,eventName,function(flag){
				console.log( ' is available ? : '+flag);
			});
		};
	}
	

	function updatePresence(data, list, eventName){
		sendUpdate(data, list, eventName);
	}

	io.on('connection', function (socket){
		socket.on('subscribe',function (data, callback){
			if (data.username != null && data.devType != null && data.username != undefined && data.devType != undefined) {
				console.log('subscribe: '+data.devType+'_'+data.username);
				setSocketId(data.devType+'_'+data.username,socket.id);
				socket.username = data.devType+'_'+data.username,socket.id;
				/*adding all users to main room*/
				socket.join("allXenChatUsers");
				callback({success:true, status:"success"})
			}
			else
				callback({success:false, status:"error"})
			
		});

		socket.on('sendpresence',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					var presence = {"user" : {"user_id" : doc.user_id, "presence" : data.status}}					
					scocu.senddata("comservusers/presence", "POST", presence, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							if(data.list != null && data.list.length > 0){
								var presence = {"status": data.status, username:doc.username};
								sendUpdate(presence, data.list, "presence");
							}
							callback({success:true, data:result})
						}	
					});
				}
			});
		});

		/* Add Contact*/	
		socket.on('sendContactreq',function (data, callback){
			utils.getUserData(data.userdetails.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					var obj = { "contact_user_id1": doc.user_id, "contact_user_id2":data.contactid, "user_id1_Removing":false, 
					"user_id2_removing":false, "user_id1_blocking":false, "user_id2_blocking":false, "waiting_approval":true};
					var contactreq = {"contact":obj};
					var url = "comserv/contacts";
					scocu.senddata(url, 'POST', contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var response = JSON.parse(result);
							if(response.status == 'success'){
								var contact = {
			                        "FIRSTNAME":data.userdetails.firstname,
			                        "LASTNAME":data.userdetails.lastname,
			                        "USERNAME":data.userdetails.username,
			                        "EMAIL":data.userdetails.email,
			                        "ID":response.data.id,
			                        "CONTACT_USER_ID1":response.data.contact_user_id1.$oid,
			                        "CONTACT_USER_ID2":response.data.contact_user_id2.$oid,
			                        "WAITING_APPROVAL":response.data.waiting_approval,
			                        "PRESENCE":"offline",
			                        "PICTURE_URL":"",
			                        "incomingreq":true
			                    };
								emitMsg(data.toname, contact, "contactreq", function(flag){
									console.log( ' is available ? : '+flag);
								});
							}							
							callback({success:true, data:result})
						}
					});					
				}
			});
		});

		/* Delete Contact*/
		socket.on('delContact',function (data,callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var obj = {"waiting_approval":false};
					var contactreq = {"contact":obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							callback({success:true, data:result})
						}
					});
				}
			});
		});

		/* Block Contact*/
		socket.on('blockContact',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var obj = {"waiting_approval":false};
					var contactreq = {"contact":obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							callback({success:true, data:result})
						}
					});
				}
			});
		});

		socket.on('acceptContactreq',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var obj = {"WAITING_APPROVAL":false};
					var contactreq = {"contact":obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = {recid:data.recid, WAITING_APPROVAL:false};
							emitMsg(data.toname, resp, "acceptcontactreq", function(flag){
								console.log( ' is available ? : '+flag);
							});
							callback({success:true, data:resp});
						}
					});
				}
			});
		});

		socket.on('privateChat',function (data, callback)
		{
			utils.getUserData(data.fromuser, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var msgobj = {
						"message":data.message, 
						"isoffline":false,
						"from_user_id":data.from_user_id, 
						"to_user_id":data.to_user_id,
						"type":data.type,
						"video":data.video,
						"media":data.media,
						"sent":true,
						"delivered":data.delivered,
						"read":data.read,
						"audio":data.audio,
						"file_transfer":data.file_transfer,
						"timestamp":data.timestamp,
						"message_id":data.message_id
					};

					data.sent = true;
					callback({success:true, data:msgobj});
					getSocketId(data.devType+'_'+data.touser, function(sockid){
						if(sockid)
							emitToUser("privateChat", data, sockid);
						else
							msgobj.offline = true;

						var message = {message:msgobj};

						scocu.senddata('comserv/'+doc.user_id+'/messages', 'POST', message, doc.token, function(err, result){
							console.log(result);
							// callback({success:true, data:result});
						});
					});
				}
			});
		});

		socket.on('chatack',function (data, callback){
			utils.getUserData(data.fromuser, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					getSocketId(data.devType+'_'+data.touser, function(sockid)
					{
						if(sockid)
							emitToUser("chatack", data, sockid);

						var ackobj = {delivered:data.delivered, offline:data.offlin}
						var message = {message:ackobj};

						setTimeout(function () {
							var url = 'comserv/messages/'+data.message_id;
							scocu.senddata(url, 'PUT', message, doc.token, 
								function(err, result){
								console.log(result);
							});
						}, 5000)						
					});
					
				}
			});
		});

		socket.on('addMembers',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"})
				}

				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"and":[{"and": [{"field": "user_id","cond": "eq","val": doc.user_id}, 
							{"field": "group_id","cond": "eq","val": data.groupid}]}]
						}
					}
					scocu.search('usersingroups', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							if(rsp.data[0].isadmin == "True"){
								for(var i = 0; i < data.mList.length; i++){
									var useringroup = {"isadmin":false, "user_id":data.mList[i], "group_id":res.data.id};
									var userobj = {"formName":"usersingroup", "data":useringroup};
									scocu.createRecord("usersingroups", userobj, doc.token, function(err, resp){
										callback(resp);
									});
								}
							}
						}else{
							callback({status:"error"});
						}
					});
				}
			});
		});

		socket.on('groupChat',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"})
				}
				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"and":[{"and": [{"field": "user_id","cond": "eq","val": doc.user_id}, 
							{"field": "group_id","cond": "eq","val": data.groupid}]}]
						}
					}
					scocu.search('usersingroups', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							var groupMsgObj = {  "message":data.message, 
									"from_user_id":data.from_user_id, 
									"group_id":data.groupid
							};
							emitGroupMsg(data.groupId, groupMsgObj, "groupChat");
							var obj = {"formName":"groupmsg", "data":groupMsgObj};

							scocu.createRecord("groupmsgs", obj, doc.token, function(err, resp){
								var res = JSON.parse(resp);
								if(res.status == "success")
								{
								}
							});
							callback(data);
						}else{
							callback({status:"error"});
						}
					});
				}
			});
			
		});

		socket.on('unicastGroupChat',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null ){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"})
				}
				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"and":[{"and": [{"field": "user_id","cond": "eq","val": doc.user_id}, 
							{"field": "group_id","cond": "eq","val": data.groupid},
							{"field": "isadmin","cond": "eq","val": "True"}]}]
						}
					}
					scocu.search('usersingroups', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success" && rsp.data.length > 0)
						{
							var groupMsgObj = {  "message":data.message, 
									"from_user_id":data.from_user_id, 
									"group_id":data.groupid
							};
							emitGroupMsg(data.groupId, groupMsgObj, "unicastGroupChat");
							var obj = {"formName":"groupmsg", "data":groupMsgObj};

							scocu.createRecord("groupmsgs", obj, doc.token, function(err, resp){
								var res = JSON.parse(resp);
								if(res.status == "success")
								{
								}
							});
							callback(data);
						}else{
							callback({status:"error"});
						}
					});
				}
			});
			
		});
	
		socket.on('getOfflineMsgs',function (data,callback){	
		});

		socket.on('getOfflineGroupMessage',function (data,callback){
		});

		socket.on('deletemessages',function (data,callback){
		});

		socket.on('disconnect', function (data) {
			/* {'username':'','devType':''} */
			removeSocketId(socket.username);
	       	socket.disconnect();
	    });

	});
}