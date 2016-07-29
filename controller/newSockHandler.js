"use strict";
var globals 	= require('../config/global');
var extend 		= require('extend');
var ntp 		= require('socket-kinda-ntp');
module.exports = function(io, app, dbutils, scocu, utils)
{
	function sendUpdate(data, list, eventName){
		for (var i = 0; i < list.length; i++) {
			console.log('emit msg to '+list[i].username);
			utils.emitMsg(io,list[i].USERNAME,data,eventName);
		};
	}

	io.on('connection', function (socket){
		ntp.init(socket);
		socket.on('subscribe',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					console.log('subscribe: '+data.sessiontoken+'_'+data.username);
					utils.setSocketId(io, data.sessiontoken+'_'+data.username, socket.id);
					socket.username = data.sessiontoken+'_'+data.username;
					/*adding all users to main room*/
					socket.join("allXenChatUsers");
					callback({success:true, status:"success"})
				}
			});
		});

		socket.on('sendpresence',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					sendPresenceFunc(doc,data,function(obj){
						callback(obj);
					});
				}
			});
		});

		function sendPresenceFunc(doc,data,callback){
			var presence = {"user" : {"user_id" : doc.user_id, "presence" : data.status}}
			scocu.senddata("comserv/users/"+doc.user_id+"/presence", "POST", presence, doc.token, function(err, result){
				if(err){
					callback({success:false, data:err.body})
				}
				else{
					if(data.list != null && data.list.length > 0){
						var filter  = data.list.filter(function(contact){
			                if(contact.USERID1_BLOCKING == true || contact.USERID2_BLOCKING == true || contact.WAITING_APPROVAL == true)
			                    return;

			                return contact;
			            });            
						var presence = {"status": data.status, username:doc.username, picture_url:"sample"};
						sendUpdate(presence, filter, "presence");
					}
					callback({success:true, data:result})
				}	
			});
		}
		/* Add Contact*/	
		socket.on('sendContactreq',function (data, callback){
			dbutils.getUserData(data.userdetails.username, data.userdetails.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					sendContactReqFunc(data,doc,function(obj){
						callback(obj);
					});				
				}
			});
		});

		function sendContactReqFunc(data,doc,callback){
			var obj = { "contact_user_id1": doc.user_id, "contact_user_id2":data.contactid, "user_id1_Removing":false, 
					"user_id2_removing":false, "user_id1_blocking":false, "user_id2_blocking":false, "waiting_approval":true, "picture_url":"sample"};
					var contactreq = {"contact":obj};
					scocu.senddata("comserv/contacts", 'POST', contactreq, doc.token, function(err, result){
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
			                        "CONTACT_USER_ID1":response.data.contact_user_id1,
			                        "CONTACT_USER_ID2":response.data.contact_user_id2,
			                        "WAITING_APPROVAL":response.data.waiting_approval,
			                        "PRESENCE":"offline",
			                        "PICTURE_URL":"",
			                        "incomingreq":true,
			                        "CONTACT_USER1_UMCOUNT": 0,
			                        "CONTACT_USER2_UMCOUNT": 0

			                    };

								utils.emitMsg(io,data.toname, contact, "contactreq");
							}							
							callback({success:true, data:result})
						}
					});	
		}

		/* Delete Contact*/
		socket.on('deletecontact',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
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
							utils.emitMsg(io, data.touser, resp, 'deletecontact');
							callback({success:true, data:resp})
						}
					});
				}
			});
		});

		/* Block Contact*/
		socket.on('blockcontact',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
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
							var obj = {success:true, data:resp};
							utils.emitMsg(io, data.touser, obj, "blockcontact");
							callback({success:true, data:resp})
						}
					});
				}
			});
		});

		/* Unblock Contact*/
		socket.on('unblockcontact',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var contactreq = {"contact":data.obj.obj};
					var url = "comserv/contacts/"+data.recid
					scocu.senddata(url, "PUT", contactreq, doc.token, function(err, result){
						if(err){
							callback({success:false, data:err.body})
						}
						else{
							unblockContactFunc(data,doc,function(obj){
								callback(obj);
							});							
						}
					});
				}
			});
		});

		function unblockContactFunc(data,doc,callback){
			scocu.senddata('comserv/contacts/users/presence', 'POST', data.obj.list, doc.token, function(err, result1){
				if(err)
					callback({success:false, data:err.body});
				else{
					var resp1 = JSON.parse(result1);
					if(resp1.status == 'success'){
						for(var i = 0; i < resp1.data.length; i++){
							var resp = {obj:data.obj.obj, recid:data.recid, list:resp1.data};
							var obj = {success:true, data:resp};
							if(resp1.data[i].USER_ID.toLowerCase() == doc.user_id){
								callback({success:true, data:obj})
							}else{
								utils.emitMsg(io, data.touser, obj, "unblockcontact")
								callback({success:true, data:obj})
							}
						}
					}
				}									
			});
		}
		socket.on('acceptContactreq',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
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

							utils.emitMsg(io, data.toname, resp, "acceptcontactreq");
							callback({success:true, data:resp});
						}
					});
				}
			});
		});

		/* Reject Contact*/
		socket.on('declinecontact',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
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
							callback({success:true, data:resp})
						}
					});
				}
			});
		});

		socket.on('privateChat',function (data, callback)
		{
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					var msgobj = {
						"message"		: data.chatobj.message, 
						"isoffline"		: false,
						"from_user_id"	: data.chatobj.from_user_id, 
						"to_user_id"	: data.chatobj.to_user_id,
						"type"			: data.chatobj.type,
						"video"			: data.chatobj.video,
						"media"			: data.chatobj.media,
						"sent"			: true,
						"delivered"		: data.chatobj.delivered,
						"read"			: data.chatobj.read,
						"audio"			: data.chatobj.audio,
						"file_transfer"	: data.chatobj.file_transfer,
						"timestamp"		: data.chatobj.timestamp,
						"message_id"	: data.chatobj.message_id,
						"file_name"		: data.chatobj.file_name
					};

					data.sent = true;
					callback({success:true, data:msgobj});
					utils.emitMsg(io, data.chatobj.touser,  data.chatobj, "privateChat",function(flag){                        
                        msgobj.offline = !flag;
                        var message = {message:msgobj};
                        scocu.senddata('comserv/'+doc.user_id+'/messages', 'POST', message, doc.token, function(err, result){
                            console.log(result);
                        });
                    });
				}
			});
		});

		socket.on('chatack',function (data, callback){
			dbutils.getUserData(data.touser, data.sessiontoken, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err.body})
				}
				else{
					utils.emitMsg(io, data.fromuser,  data, "chatack");
					utils.updatechatack(scocu, data, doc.user_id, doc.token, function(result){
						console.log(result);
					})
				}
			});
		});

		socket.on('isTyping', function(data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"})
				}
				else{

					utils.emitMsg(io, data.touser,  data, "isTyping");
				}
			});
		})

		socket.on('getjoinedgroups', function(data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err,doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getJoinedgroups(scocu, doc.user_id, doc.token, function(result){
						callback(result);
						if(result.success){
							for(var i = 0; i < result.data.length; i++){
								socket.join(result.data[i].GROUP_ID);
							}
						}
					});
				}
			})
		});

		socket.on('subscribegroups', function(data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err,doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else if(data != null){					
					for(var i = 0; i < data.list.length; i++){
						socket.join(data.list[i].GROUP_ID);
					}
				}
			})
		})

		socket.on('addmemberstogroup',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}	
				else{
					utils.getGroupmembers(scocu, data.groupobj.GROUP_ID, doc.token, function(result){
						if(result.success){
							for(var i = 0; i < result.data.length; i++){
								if(result.data[i].USERNAME == data.username &&  result.data[i].ADMIN == true){
									admin = true;
									break;
								}
							}
							if(admin){
								utils.addMemberstoGroup(scocu, data.groupobj.GROUP_ID, doc.token, {data:data.list}, function(result){
									if(result.success){
										utils.getGroupmembers(scocu, data.groupobj.GROUP_ID, doc.token, function(result){
											callback(result);
											if(result.success){
												socket.broadcast.to(data.groupobj.GROUP_ID).emit('addmemberstogroup', data);
												for (var i = 0; i < result.data.length; i++) 
												{
													var groupmembersobj = {GROUP_ID:data.groupobj.GROUP_ID, ADMIN:false, EXIT:false, IS_DELETE:false, 
													USER_ID:result.data[i].user_id, NAME:data.groupobj.NAME, EXPIRE_DATE:data.groupobj.EXPIRE_DATE, 
													INVITATION:data.groupobj.INVITATION, JOINGROUP:data.groupobj.JOINGROUP, 
													NOTIFICATION:data.groupobj.NOTIFICATION, TYPE:data.groupobj.TYPE};
													

													utils.emitMsg(io, result.data[i].username, groupmembersobj, 'updategroup');
													utils.joinGroup(io, result.data[i].username, data.groupobj.GROUP_ID);
												}
											}												
										})
									}
									else
										callback(result);
								})
							}
							else
								callback({success:false, data:"You Dont have enough permissinos"})	

						}
						else{
							callback(result);
						}
					})
				}
			});
		});
		socket.on('instantadd', function(data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getGroupinfo(scocu, data.groupid, doc.token, function(result){
						if(result.success && result.data.status == "success"){
							if(result.data.data.invitation == 'instant')
							{
								utils.addMemberstoGroup(scocu, data.groupid, doc.token, {data:data.list}, function(result1){
									if(result.success){
										var resp = JSON.parse(result1.data);
										if(resp.status == 'success'){
											var groupobj = {GROUP_ID:data.groupid, ADMIN:false, EXIT:false, IS_DELETE:false, 
												USER_ID:doc.user_id, NAME:result.data.data.name, EXPIRE_DATE:result.data.data.expire_date, 
												INVITATION:result.data.data.invitation, JOINGROUP:result.data.data.joingroup, 
												NOTIFICATION:result.data.data.notification, TYPE:result.data.data.type};

											callback({success:true, data:groupobj});
											socket.broadcast.to(data.groupid).emit('addmemberstogroup', data);
											socket.join(data.groupid);
										}
									}
									else
										callback(result);
								})
							}
						}
						else
							callback(result);
					})
				}
			});
			
		});

		socket.on('delmembersfromgroup',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getGroupmembers(data.groupid, doc.token, function(result){
						if(result.success){
							var resp = JSON.parse(result.data);
							var admin = false;
							if(resp.status == "success"){
								console.log(resp.data);
								for(var i = 0; i < resp.data.length; i++){
									if(resp.data[i].USERNAME == data.username &&  resp.data[i].ADMIN == true){
										admin = true;
										break;
									}
								}
								if(admin){
									utils.updateGroupMemebers(scocu, data.groupid, doc.token, {data:data.list}, function(result){
										if(result.success == true){
											socket.broadcast.to(data.groupid).emit('delmembersfromgroup', data);
											utils.leaveGroup(data.list, data.sessiontoken, data.groupid)
										}
										else
											callback(result);
									})
								}
							}
						}
						else
							callback({success:false, data:result});
					});				
				}
			});
		});

		socket.on('exitgroup',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getGroupmembers(scocu, data.groupid, doc.token, function(result)
					{
						if (result.success) {
							var admin = false;
							var anotheradmin = false;
							for(var i = 0; i < result.data.length; i++){
								if(result.data[i].USERNAME == data.username && result.data[i].ADMIN){
									admin = true;
								}
								else if(result.data[i].ADMIN){
									anotheradmin = true;
									break;
								}
							}
							if(anotheradmin || result.data.length == 1){
								utils.updateGroupMemebers(scocu, data.groupid, doc.token, {data:data.list}, function(result){
									callback(result)
									socket.broadcast.to(data.groupid).emit('exitgroup', data);
									var sockid = io.sockets.sockets[data.sessiontoken+'_'+data.username];
									if(sockid)
										io.sockets.connected[sockid].leave(data.groupid);
								});
								
							}
							else
								callback({success:false, data:"make another person admin to the group"})
							
						}else{
							callback(result)
						}
					})		
				}
			});
		});

		socket.on('groupchat',function (data, callback){
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getGroupinfo(scocu, data.group_id, doc.token, function(result){
						if (result.success && result.data.status == "success") 
						{
								var groupmsg = {"from_user_id":doc.user_id, "username":data.username, "group_id":data.group_id, "type":data.type, "media":data.media, 
								"video":data.video, "audio":data.audio, "file_transfer":data.file_transfer, "message":data.message, "message_id":data.message_id, 
								"file_name":data.file_name, "file_ext":data.file_ext};
								var groupmessage = {group_message:groupmsg}

								if(result.data.data.type == 'multicast')
								{
									// switch(result.data.multicasttype){
									// 	case 'Anyone':
									// 		socket.broadcast.to(data.group_id).emit('groupchat', groupmsg)
									// 		scocu.senddata('comserv/'+data.group_id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
									// 			console.log(result1);
									// 		})	
									// 	break;

									// 	case 'Reply to Admin':
									// 		if(data.to == null && data.to.length == 0)
									// 			callback({success:false, result: "No Users"});

									// 		sendUpdate(data.to, groupchat, groupmsg);
									// 	break;

									// 	case 'Reply to Member':
									// 		if(data.to == null && data.to.length == 0)
									// 			callback({success:false, result: "No Users"});
									// 		sendUpdate(data.to, groupchat, groupmsg);
									// 	break;
									// }

									socket.broadcast.to(data.group_id).emit('groupchat', groupmsg)
									scocu.senddata('comserv/'+data.group_id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
										console.log(result1);
									})
								}
								else if(result.data.data.type == 'unicast' && result.data.data.created_by == data.username){
									socket.broadcast.to(data.group_id).emit('groupchat', groupmsg)
									scocu.senddata('comserv/'+data.group_id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
										console.log(result1);
									})
								}								
							
						}else{
							callback(result);
						}
					})				
				}
			});
		});

		socket.on('makeadmin',function (data,callback){	
			dbutils.getUserData(data.username, data.sessiontoken, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({success:false, data:err})
				}
				else{
					utils.getGroupmembers(scocu, data.groupid, doc.token, function(result){
						if(result.success){
							var admin = false;
							for(var i = 0; i < resp.data.length; i++){
								if(result.data[i].USERNAME == data.username && result.data[i].ADMIN == true){
									admin = true;
									break;
								}
							}
							if(admin){
								utils.updateGroupMemebers(scocu, data.groupid, doc.token, {data:data.list}, function(result){
									callback(result)
								});
							}
						}else{
							callback(result);
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

			var user = socket.username.split('_');
	       	socket.disconnect();
	    });
	});
}