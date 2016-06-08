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
				setSocketId(data.devType+'_'+data.username, socket.id);
				io.sockets.sockets[data.devType+'_'+data.username] = socket.id;
				socket.username = data.devType+'_'+data.username;
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
					scocu.senddata("comserv/users/"+doc.user_id+"/presence", "POST", presence, doc.token, function(err, result){
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
		socket.on('deletecontact',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var contactreq = {"contact":data.obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = {obj:data.obj, recid:data.recid};
							getSocketId(data.devType+'_'+data.touser, function(sockid){
								if(sockid)
									emitToUser("deletecontact", resp, sockid);
							});
							callback({success:true, data:resp})
						}
					});
				}
			});
		});

		/* Block Contact*/
		socket.on('blockcontact',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var contactreq = {"contact":data.obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = {obj:data.obj, recid:data.recid};
							getSocketId(data.devType+'_'+data.touser, function(sockid){
								if(sockid)
									emitToUser("blockcontact", resp, sockid);
							});
							callback({success:true, data:resp})
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
								var resp = {recid:data.recid, WAITING_APPROVAL:false, status:data.status};
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
						"message_id":data.message_id,
						"file_name":data.file_name
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
			utils.getUserData(data.touser, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					getSocketId(data.devType+'_'+data.fromuser, function(sockid)
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

		socket.on('isTyping', function(data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"})
				}
				else{
					getSocketId(data.devType+'_'+data.touser, function(sockid){
						if(sockid)
							emitToUser("isTyping", data, sockid);
					});
				}
			});
		})

		socket.on('getjoinedgroups', function(data, callback){
			utils.getUserData(data.username, function(err,doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					scocu.senddata("comserv/groups/users/"+doc.user_id, 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result)
							if(resp.status == "success"){
								var filter = resp.data.filter(function(item){
									return (item.EXIT == false && item.IS_DELETE == false)
								});

								for(var i =0; i < filter.length; i++){
									socket.join(resp.data[i].GROUP_ID);
								}
							}
							callback({success:true, data:filter})
						}
					});
				}
			})
		});

		socket.on('subscribegroups', function(data, callback){
			utils.getUserData(data.username, function(err,doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					res.send({success:false, data:err})
				}
				else{
					for(var i =0; i < data.list.length; i++){
						socket.join(data.list[i].GROUP_ID);
					}
				}
			})
		})

		socket.on('addmemberstogroup',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					scocu.senddata("comserv/groups/"+data.groupid+"/users", 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result);
							var admin = false;
							if(resp.status == "success"){
								console.log(resp.data);
								for(var i = 0; i < resp.data.length; i++){
									if(resp.data[i].USERNAME == data.username &&  resp.data[i].ADMIN == true){
										admin = true;
										break;
									}
								}
								if(admin == true){
									var groupobj = {data:data.list}
									scocu.senddata('comserv/groups/'+data.groupid+'/users', 'POST', groupobj, doc.token, function(err, result1){
										if(err){
											callback({success:false, data:err.body})
										}
										else{
											var resp1 = JSON.parse(result1);
											if(resp1.status == 'success'){
												callback({success:true, data:result1});	
												socket.broadcast.to(data.groupid).emit('addmemberstogroup', data);
												var groupobj = {GROUP_ID:data.groupid, NAME:data.groupname}
												for (var i = 0; i < data.list.length; i++) {
													emitMsg(data.list[i].username, groupobj, 'updategroup',function(flag){
														console.log( ' is available ? : '+flag);
													});										
													var sockid = io.sockets.sockets[data.devType+'_'+data.list[i].username];
													io.sockets.connected[sockid].join(data.groupid);
												}	
											}else{												
												callback({success:false, data:result1});	
											}
										}
									});
								}
								else
									callback({success:false, data:"You Dont have enough permissinos"})
							}
							else{
								callback({success:false, data:result})
							}
						}
					});
				}
			});
		});

		socket.on('instantadd', function(data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					scocu.senddata("comserv/groups/"+data.groupid, 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result);
							if(resp.status == "success"){
								if(resp.data.invitation == 'instant'){
									var groupobj = {data:data.list}
									scocu.senddata('comserv/groups/'+data.groupid+'/users', 'POST', groupobj, doc.token, function(err, result1){
										if(err){
											callback({success:false, data:err.body})
										}
										else{
											var resp1 = JSON.parse(result1);
											if(resp1.status == 'success'){
												callback({success:true, data:result1});	
												socket.broadcast.to(data.groupid).emit('addmemberstogroup', data);
												for (var i = 0; i < data.list.length; i++) {
													var groupobj = {GROUP_ID:data.groupid, NAME:data.groupname}
													emitMsg(data.list[i].username, groupobj, 'updategroup',function(flag){
														console.log( ' is available ? : '+flag);
													});
													socket.join(data.groupid);
												}
											}else{												
												callback({success:false, data:result1});	
											}
										}
									});
								}
							}
							else{
								callback({success:false, data:result})
							}
						}
					});
				}
			});
		});

		socket.on('delmembersfromgroup',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					scocu.senddata("comserv/groups/"+data.groupid+"/users", 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result);
							var admin = false;
							if(resp.status == "success"){
								console.log(resp.data);
								for(var i = 0; i < resp.data.length; i++){
									if(resp.data[i].USERNAME == data.username &&  resp.data[i].ADMIN == true){
										admin = true;
										break;
									}
								}
								if(admin == true){
									updategroupmembers(data, doc.token, function(result1){
										if(result1.success == true){
											socket.broadcast.to(data.groupid).emit('delmembersfromgroup', data);
											for(var i = 0; i < data.list.length; i++){
												var sockid = io.sockets.sockets[data.devType+'_'+data.list[i].USERNAME];
												// io.sockets.connected[sockid].emit('delmembersfromgroup', data)
												io.sockets.connected[sockid].leave(data.groupid);
											}											
											callback({success:true, data:result1})											
										}
										else{
											callback({success:false, data:result1});	
										}
									});
								}
							}
						}
					});
				}
			});
		});

		socket.on('exitgroup',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					scocu.senddata("comserv/groups/"+data.groupid+"/users", 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result);
							var admin = false;
							var anotheradmin = false;
							if(resp.status == "success"){
								console.log(resp.data);
								for(var i = 0; i < resp.data.length; i++){
									if(resp.data[i].USERNAME == data.username && resp.data[i].ADMIN == true){
										admin = true;
									}
									else if(resp.data[i].ADMIN == true){
										anotheradmin = true;
										break;
									}
								}
								if(anotheradmin == true || resp.data.length == 1){
									updategroupmembers(data, doc.token, function(result1){
										callback({success:true, data:result1})
										socket.broadcast.to(data.groupid).emit('exitgroup', data);	
									});
									
								}
								else
									callback({success:false, data:"make another person admin to the group"})
							}
							else{
								callback({success:false, data:result})
							}
						}
					});		
				}
			});
		});

		socket.on('groupchat',function (data, callback){
			utils.getUserData(data.USERNAME, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{

					scocu.senddata("comserv/groups/"+data.group_id, 'GET', null, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							var resp = JSON.parse(result);
							if(resp.status == 'success'){
								var groupmsg = {"from_user_id":doc.user_id, "username":data.USERNAME, "group_id":data.group_id, "type":data.type, "media":data.media, 
								"video":data.video, "audio":data.audio, "file_transfer":data.file_transfer, "message":data.MESSAGE, "message_id":data.message_id, 
								"file_name":data.file_name, "file_ext":data.file_ext};

								if(resp.data.type == 'multicast'){
									var groupMsgObj = {"MESSAGE":data.message, "USERNAME":data.USERNAME, "group_id":data.group_id, "time":data.time};
									var groupmessage = {group_message:groupmsg}
									socket.broadcast.to(data.group_id).emit('groupchat', groupMsgObj)
									scocu.senddata('comserv/'+data.group_id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
										console.log(result1);
									})
								}
								else if(resp.data.type == 'unicast' && resp.data.created_by == data.USERNAME){
									var groupMsgObj = {"MESSAGE":data.message, "USERNAME":data.USERNAME, "group_id":data.group_id, "time":data.time};
									var groupmessage = {group_message:groupmsg}
									socket.broadcast.to(data.group_id).emit('groupchat', groupMsgObj)
									scocu.senddata('comserv/'+data.group_id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
										console.log(result1);
									})
								}								
							}
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

	    function updategroupmembers(data, token, callback){
    		var groupuser = {data:data.list}
    		scocu.senddata('comserv/groups/'+data.groupid+'/users', 'PUT', groupuser, token, function(err, result){
    			if(err){
					callback({success:false, data:err.body})
				}
				else{			
					callback({success:true, data:result});
				}
    		});
	    }
	});
}