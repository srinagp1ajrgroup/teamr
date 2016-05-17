// var chatModule = require('../model/chat').chatModule;
var globals = require('../config/global');
var extend 			= require('extend');
module.exports = function(io, app, utils ,scocu, redis, ioEmitter){
	/* function definitions */
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
		
	    // io.to(sockid).emit(eventType, data);
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
	/* send msg to all devices using sendupdate */
	function sendUpdate(data, list, eventName){
		/* list is [{username:'x'}] */
		for (var i = 0; i < list.length; i++) {
			console.log('emit msg to '+list[i].username);
			emitMsg(list[i].username,data,eventName,function(flag){
				console.log( ' is available ? : '+flag);
			});
		};
	}

	function blockorremovecontact(data, callback, eventType){
    	utils.getUserData(data.username, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
			}
			var filter = {
				"fields": {
					"only": []
				},
				"filters":{
					"and":[{"or": [{"field": "contact_user_id1","cond": "eq","val": doc.user_id}, 
					{"field": "contact_user_id2","cond": "eq","val": data.contact}]},

					{"or": [{"field": "contact_user_id1","cond": "eq","val": data.contacts}, 
					{"field": "contact_user_id2","cond": "eq","val": doc.user_id}]}]
				}
			}
			scocu.search('contacts', filter, doc.token, function(err, resp){
				var rsp = JSON.parse(resp);
				if(rsp.status == "success"){
					var block1 = false;
					var block2 = false;
					var remove1 = false;
					var remove2 = false;

					if(eventType == "block"){
						if(rsp.data[0].contact_user_id1 == doc.user_id){
							block1 = true;
						}
						else if(rsp.data[0].contact_user_id2 == doc.user_id){
							block2 = true;
						}
					}
					else if(eventType == "delete"){
						if(rsp.data[0].contact_user_id1 == doc.user_id){
							remove1 = true;
						}
						else if(rsp.data[0].contact_user_id2 == doc.user_id){
							remove2 = true;
						}
					}
					var contactreq = { "contact_user_id1": rsp.contact_user_id1, "contact_user_id2":rsp.contact_user_id2, 
					"isuserid1removing":remove1, "isuserid2removing":remove2, "isuserid1blockng":block1, "isuserid2blockng":block2, 
					"waitingapproval":false};	
					
					var obj = {"formName":"contact", "data":contactreq};
					scocu.update("contacts", obj, rsp.data[0].id, doc.token, function(err, res){
						callback({'status':'success'});	
					});
				}
			});
		});
	}

	function getcontactlist(doc, data, callback){
		var filter = {
			"fields": {
				"only": []
			},
			"filters":{
				"or":[{"or": [{"field": "contact_user_id1","cond": "eq","val": doc.user_id}, 
				{"field": "contact_user_id2","cond": "eq","val": doc.user_id}]}]
			}
		}
		scocu.search('contacts', filter, doc.token, function(err, resp){
			var res = JSON.parse(resp);
			if(res.status == "success"){
				var list = res.data;
				if(list.length > 0){
					var userids = [];
					for(var i = 0; i < list.length; i++)
					{
						var user = null;
						if(list[i].contact_user_id1 == doc.user_id)
							user = {"field": "app_user_id","cond": "eq","val": list[i].contact_user_id2}
						else if(list[i].contact_user_id2 == doc.user_id)
							user = {"field": "app_user_id","cond": "eq","val": list[i].contact_user_id1}

						userids.push(user);
					}
					var filters = {
									"fields": {"only": ["username", "status"]},
									"filters":
									{
										"or":
										{ 
											"or" :userids
										}
									}
								}
					scocu.search('users', filters, doc.token, function(err, rsp){
						var re = JSON.parse(rsp);
						if(re.status == "success")
						{
							var users = [];
							for(var i = 0; i < list.length; i++)
							{
								var user = {};
								extend(user, list[i], re.data[i]);
								if(user.waitingapproval == "True")
									user.status = "offline"
								users.push(user);
							}
							callback(err, users);
						}
					});	

				}
			}
			else{
				callback(err, res)
			}
		});
	}
	/* client connection established here*/
	io.on('connection', function (socket){
		socket.on('subscribe',function (data, callback){
			if (data.username != null && data.devType != null && data.username != undefined && data.devType != undefined) 
			{
				console.log('subscribe: '+data.devType+'_'+data.username);
				setSocketId(data.devType+'_'+data.username,socket.id);
				/*adding all users to main room*/
				socket.join("allXenChatUsers");
				callback(null, {'status':'success'});
			}else{
				callback({'status':'error'},null);
			}
		});

		socket.on('presence',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					if(doc.status_id == undefined){
						var colldata = {"fields": {"only": ["id","status"]},
							"filters": {"and" :{"field": "app_user_id","cond": "eq","val": doc.user_id}}
						}
						scocu.search('users', colldata, doc.token, function(err, resp){
							var rsp = JSON.parse(resp);
							if(rsp.status == "success"){
								var presence = {"FormName" : "user" , "Data" : {"status" : data.status}}
								utils.setStatusid(doc.user_id, rsp.data[0].id)
								scocu.update("users", presence, rsp.data[0].id, doc.token, function(err, res){
									callback(null,{'status':'success'});	
								});
							}
						})
					}
					else{
						var presence = {"FormName" : "user" , "Data" : {"status" : data.status}}
						scocu.update("users", presence, doc.status_id, doc.token, function(err, res){
							// callback(res);
							getcontactlist(doc, data, function(err, list){
								var statusObj = {'username':data.username ,'status': data.status};
								sendUpdate(statusObj, list, "presence");
								callback(null, {"status": "success"})
							});
						});
					}
				}
			});
		});

		socket.on('contactslist',function (data, callback){
			utils.getUserData(data.username, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					getcontactlist(doc, data, function(err, list){
						var statusObj = {'username':data.username ,'status': "online"};
						sendUpdate(statusObj, list, "presence");
						callback(err, list)
					});
				}
			});
		});

		/* Add Contact*/	
		socket.on('sendContactreq',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err});
				}
				else{
					var contactreq = { "contact_user_id1": doc.user_id, "contact_user_id2":data.contactid, "isuserid1removing":false, 
					"isuserid2removing":false, "isuserid1blockng":false, "isuserid2blockng":false, "waitingapproval":true};
					var obj = {"formName":"contact", "data":contactreq};
					scocu.createRecord("contacts", obj, doc.token, function(err, resp){
						callback(err, resp);
						emitMsg("vasu", resp, "contactreq", function(flag){
							console.log( ' is available ? : '+flag);
						});
					});
				}
			});
		});

		/* Delete Contact*/
		socket.on('delContact',function (data,callback){
			blockorremovecontact(data, callback, "delete");
		});

		/* Block Contact*/
		socket.on('blockContact',function (data,callback){
			blockorremovecontact(data, callback, "block");
		});

		socket.on('searchuser',function (data, callback)
		{
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
						var colldata = 
						{"fields": {"only": ["id", "username"]},
						"filters": {"and" :{"field": "username","cond": "eq","val": data.contactname}}
						}
						scocu.search('users', colldata, doc.token, function(err, resp){
							callback(err, resp);
						})
					
				}
			});
		});

		socket.on('acceptContactreq',function (data, callback){
			utils.getUserData(data.username, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"and":[{"and": [{"field": "contact_user_id1","cond": "eq","val": data.contact}, 
							{"field": "contact_user_id2","cond": "eq","val": doc.user_id},
							{"field": "waitingapproval","cond": "eq","val": "True"}]}]
						}
					}
					scocu.search('contacts', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							var contactreq = { "contact_user_id1": data.contact, "contact_user_id2":doc.user_id, "isuserid1removing":false, 
							"isuserid2removing":false, "isuserid1blockng":false, "isuserid2blockng":false, "waitingapproval":false};
							var obj = {"formName":"contact", "data":contactreq};
							scocu.update("contacts", obj, rsp.data[0].id, doc.token, function(err, res){
								callback(null,{'status':'success'});	
								getSocketId(data.contactname, function(sockid){
									emitToUser("presence", data.status, sockid);
								});
							});
						}
					});
				}
			});
		});

		/*individual chat*/
		socket.on('privateChat',function (data, callback){
			utils.getUserData(data.fromUser, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"or":[{"and": [{"field": "contact_user_id1","cond": "eq","val": doc.user_id}, 
							{"field": "contact_user_id2","cond": "eq","val": data.to_user_id}]},

							{"and": [{"field": "contact_user_id1","cond": "eq","val": data.to_user_id}, 
							{"field": "contact_user_id2","cond": "eq","val": doc.user_id}]}]
						}
					}
					scocu.search('contacts', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							if(rsp.data[0].isuserid1removing == "False" || rsp.data[0].isuserid2removing == "False" || 
								rsp.data[0].isuserid1blockng == "False" || rsp.data[0].isuserid2blockng == "False" || 
								rsp.data[0].waitingapproval == "False"){

								var msgobj = {  "message":data.message, 
									"isoffline":false, 
									"from_user_id":data.from_user_id, 
									"to_user_id":data.to_user_id, 
									"type":data.type, 
									"isvideo":data.isvideo, 
									"ismedia":data.ismedia, 
									"issent":true, 
									"isdelivered":data.isdelivered, 
									"isread":data.isread, 
									"isaudio":data.isaudio, 
									"isfiletransfer":data.isfiletransfer, 
									"timestamp":data.timestamp, 
									"messageid":data.messageid };

									data.issent = true;
									callback(err, data);

								getSocketId(data.devType+'_'+data.toUser, function(sockid){
									if(sockid)
										emitToUser("privateChat", data, sockid);
									else
										msgobj.isoffline = true;

									var obj = {"formName":"contactmsg", "data":msgobj};

									scocu.createRecord("contactmsgs", obj, doc.token, function(err, resp){
										var res = JSON.parse(resp);
										if(res.status == "success")
										{
										}
									});
								});
							}
						}
					});
					
				}
			});
		});

		/* chat acknowledgement */
		socket.on('chatAck',function (data, callback){
			utils.getUserData(data.fromUser, function(err, doc)
			{
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})				}
				else{

					getSocketId(data.devType+'_'+data.toUser, function(sockid){
						emitToUser("chatAck", data, sockid);
					});

					var filter = {
						"fields": {
							"only": ["id"]
						},
						"filters":{
							"and":{"field": "messageid","cond": "eq","val": data.messageid}
						}
					}

					scocu.search('contactmsgs', filter, doc.token, function(err, resp)
					{
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							var obj = {"formName":"contactmsg", "data":{isdelivered: true}};
							scocu.update("contactmsgs", obj, rsp.data[0].id, doc.token, function(err, res){
								callback(null,{'status':'success'});	
							});
						}
					});
				}
			});
		});



		/* createGroup socket*/
		socket.on('createGroup',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null) {
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					var groupreq = {"name":data.groupname, "type":data.grouptype, "expiredate":data.expirydate, "notification":data.notification, 
					"category":data.category, "joingroup":data.joingroup, "invitation":data.invitation};
					var obj = {"formName":"group", "data":groupreq};
					scocu.createRecord("groups", obj, doc.token, function(err, resp){
						var res = JSON.parse(resp);
						if(res.status == "success")
						{
							var useringroup = {"isadmin":true, "user_id":doc.user_id, "group_id":res.data.id};
							var userobj = {"formName":"usersingroup", "data":useringroup};
							scocu.createRecord("usersingroups", userobj, doc.token, function(err, resp){
								callback(err, resp);
							});
						}
					});
				}
			});
		});

		socket.on('deleteGroup',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
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
						var res = JSON.parse(resp);
						if(res.status == "success"){
							var obj = {"formName":"usersingroup", "data":{isdelete: true}};
							scocu.update("usersingroups", obj, rsp.data[0].id, doc.token, function(err, res){
								callback(null,{'status':'success'});	
							});
						}
						else{
							callback(err, res)
						}
					});
				}
			});
		});

		socket.on('exitGroup',function (data,callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
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
							var obj = {"formName":"usersingroup", "data":{isexit: true}};
							scocu.update("usersingroups", obj, rsp.data[0].id, doc.token, function(err, res){
								callback(null,{'status':'success'});	
							});
						}
					});
				}

			});
		});

		socket.on('getJoinedgroups',function (data,callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					var filter = {
					    "fields": {
					        "only": [
					            "name", "description", "id", "type"
					        ]
					    },
					    "filter": 
					          { "related": {"usersingroup" :[{"field": "user_id","cond": "eq","val": doc.user_id} ] } }
					}

					scocu.search('groups', filter, doc.token, function(err, resp){
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							callback(err, resp)							
						}
					});
				}
			});
		});

		socket.on('getGroupMembers',function (data,callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
				}
				else{
					var filter = {
						"fields": {
							"only": []
						},
						"filters":{
							"and":{"field": "group_id","cond": "eq","val": data.groupId}
						}
					}

					scocu.search('usersingroups', filter, doc.token, function(err, resp){
						var res = JSON.parse(resp);
						if(res.status == "success")
						{
							callback(err, res)
						}
						else{
							callback(err, res)
						}
					});
				}
			});
		});

		socket.on('addMembers',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
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
										callback(err, resp);
									});
								}
							}
						}else{
							callback({status:"error"},{data:err});
						}
					});
				}
			});
		});

		socket.on('makeAdmin',function (data, callback){
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err});
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
						if(rsp.status == "success")
						{
							if(rsp.data[0].isadmin == "True"){
								var filter = {
									"fields": {
										"only": []
									},
									"filters":{
										"and":[{"and": [{"field": "user_id","cond": "eq","val": data.contact}, 
										{"field": "group_id","cond": "eq","val": data.groupid}]}]
									}
								}
								scocu.search('usersingroups', filter, doc.token, function(err, res){
									var re = JSON.parse(res);
									if(re.status == success && re.data.length > 0){
										var useringroup = {"isadmin":true};
										var obj = {"formName":"usersingroup", "data":useringroup};
										scocu.update("usersingroups", obj, re.data[0].id, doc.token, function(err, res){
											callback({'status':'success'});	
										});
									}
								});
							}
						}else{
							callback({status:"error"},{data:err});
						}
					});
				}
			});	
		});

		/*group chat*/
		socket.on('groupChat',function (data, callback)
		{
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
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
							callback(err, data);
						}else{
							callback({status:"error"},{data:err});
						}
					});
				}
			});
			
		});

		socket.on('unicastGroupChat',function (data, callback)
		{
			utils.getUserData(data.username, function(err, doc){
				if(err || doc == null ){
					console.log('err @ getToken : '+err);
					err = "Invalid ID";
					callback({status:"error"},{data:err})
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
							callback(err, data);
						}else{
							callback({status:"error"},{data:err});
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
			removeSocketId ( data.devType + '_' + data.username ) ;
	       	socket.disconnect();
	    });
	});
}