// "use strict";
var globals 				= require('../config/global');
var multipart       		= require('connect-multiparty');
var multipartMiddleware    	= multipart();
var externalip				= require('externalip');
var UAParser 				= require('ua-parser-js');
var crypto 					= require('crypto');
var underscore 				= require("underscore");
var async					= require("async");
module.exports 		= function(io, app, dbutils, scocu, utils){
	var extend 		= require('extend');
	var parser 		= new UAParser();	

	app.post('/login', function(req, res){		
		if(req.body.username == "" || req.body.password == "" || 
			req.body.username == undefined || req.body.password == undefined){
			res.send({success: false, data: "Invalid Details"})
		}

		var ua = req.headers['user-agent'];
		var browserName = parser.setUA(ua).getBrowser().name;
    	var fullBrowserVersion = parser.setUA(ua).getBrowser().version;
    	var browserVersion = fullBrowserVersion.split(".",1).toString();
   	 	var browserVersionNumber = Number(browserVersion);

		console.log('POST /login username:'+req.body.username);
		var url  = "app_users/login";
		var data = {"username":req.body.username, "password":req.body.password, "user_ip":"216.117.56.68"}; //"216.117.56.68"};
		scocu.senddata(url, "POST", data, null, function(err, user){
			if(err){
				console.log('login error : '+err);
				res.send(err.body)
			}
			else{
				console.log('user : '+user);
				user = JSON.parse(user); 
				if(user.status == "success"){
					// externalip(function (err, ip) {
					// });
					var generate_key = function() {
						var sha = crypto.createHash('sha256');
					    sha.update(Math.random().toString());
					    return sha.digest('hex');
					};

					var sessiontoken = generate_key();

					dbutils.setUserData(user.data.username, user.data.id, user.data.token, sessiontoken, ua);
					var usermap = {
						'firstname' 	: user.data.firstname,
						'lastname' 		: user.data.lastname,
						'phonenumber' 	: user.data.phonenumber,
						'username' 		: user.data.username,
						'email' 		: user.data.email,
						'description' 	: user.data.description,
						'picUrl' 		: user.data.picUrl,
						'user_id'		: user.data.id,
						'sessiontoken'	: sessiontoken
					};
					res.send({status: "success", data: usermap});
				}
				else{
					res.send({success:false, data:user.data});
				}
			}
		});
	});

	app.post('/logout', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				if(err)
					res.send({success: false, data: err.body});
				else
					res.send({success: false, data: "No Token"});
			}
			else
			{

				scocu.senddata('app_users/logout', 'POST',  null, doc.token, function(err,data){
					if(err)
						res.send({success: false, data: err.body});
					else{
						// externalip(function (err, ip) {
						// });
						dbutils.deleteUserData(req.body.username, req.body.sessiontoken);
						data = JSON.parse(data);
						if(data.status == "success"){
							// delete io.sockets.sockets[req.body.devType + '_' + req.body.username]
							res.send({success: true});
						}else{
							res.send({success: false});
						}
					}
				});
			}
		})
	});

	app.post("/searchuser", function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({status:"error"})
			}
			else{
				scocu.senddata("users/search/"+req.body.searchname, "GET", null, doc.token, function(err, result){
					if(err)
						res.send({success: false, data: err.body});
					else{
						var resp = JSON.parse(result);
						if(resp.status == "success"){
							res.send({success: true, list:resp});
						}else{
							res.send({success: false});
						}							
					}
				});
			}
		});
	});

	app.post("/search", function(req, res){
        dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
            if(err || doc == null){
                console.log('err @ getToken : '+err);
                err = "Invalid ID";
                res.send({success:false, data:err})
            }
            else{
                async.parallel([
                    function(callback){
                        scocu.senddata("comserv/groups/"+req.body.query+"/search", "GET", null, doc.token, function(err, result){
                            if (result) 
                            {
                                result = JSON.parse(result);
                                var groups = underscore.filter(result.data, function(data){
									if(data.invitation == 'instant')
										return true;

									return false;
								})
								callback(err, groups);
                            }
                            else
                            	callback(err,result);
                        });
                    },
                    function(callback){
                        scocu.senddata("users/search/"+req.body.query, "GET", null, doc.token, function(err, result){
                            if (result) {
                                result = JSON.parse(result);
                            }
                            callback(err, result.data);
                        });
                    }],
                    function(err,docs){
                        if (err) {
                            res.send({success: false, data: err.body});
                        }else{
                        	var list = [];
                        	list = docs[0].concat(list);
                        	list = docs[1].concat(list);
                            res.send({success: true, data:list});
                        }
                })
            }
        });
    });

	app.post("/getcontacts", function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var url = "comserv/contacts/"+doc.user_id;
				scocu.senddata(url, "GET", null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						var resp = JSON.parse(result);
						if(resp.status == "success"){
							var contacts = underscore.filter(resp.data, function(data){
								if(data.USERID1_REMOVING == true || data.USERID2_REMOVING == true)
									return false;
								else if(data.USERID1_BLOCKING == true || data.USERID2_BLOCKING == true || data.WAITING_APPROVAL == true){
									data.PRESENCE 	 = 'offline'
								}
								else if(data.WAITING_APPROVAL == false){
									data.incomingreq = false;
								}

								if(data.PRESENCE == null)
									data.PRESENCE = 'offline'

								if(data.CONTACT_USER_ID1 == doc.user_id && data.WAITING_APPROVAL == true)
									data.incomingreq = false;
								else if(data.CONTACT_USER_ID2 == doc.user_id && data.WAITING_APPROVAL == true)
									data.incomingreq = true;

								if(data.CONTACT_USER1_UMCOUNT == null)
									data.CONTACT_USER1_UMCOUNT = 0;
								if(data.CONTACT_USER2_UMCOUNT == null)
									data.CONTACT_USER2_UMCOUNT = 0;

								data.nCount = 0;
								return true;
							})

							res.send({success:true, data:JSON.stringify(contacts)})
						}
						else
							res.send({success:false, data:result})
					}
				});
			}
		});
	});

	app.post("/getchathistory", function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var url = "comserv/"+req.body.fromid+"/messages/"+req.body.toid+"?limit=30&offset="+req.body.offset;
				scocu.senddata(url, "GET", null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		});
	});

	app.post("/fileupload", multipartMiddleware, function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				for(file in req.files){
					file = req.files[file];
				}

				if(file == null){
					res.send({success:false, data:"File Not Found"})
				}else{
					scocu.fileupload(file, function(err, result){
						if(err){
							res.send({success:false, data:err.body})
						}
						else{
							res.send({success:true, data:result})
						}
					});	
				}			
			}
		});		
	});

	app.post("/getfileurl", function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var url = 'files/asset_url/'+req.body.fileid;
				scocu.senddata(url, "GET", null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		});	
	});


	app.post("/creategroup", function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({status:"error"},{data:err})
			}
			else{
				var groupreq = {"name":req.body.details.groupname, 
								"description":req.body.details.description, 
								"category":req.body.details.category, 
								"expire_date":req.body.details.expdate, 
								"type":req.body.details.type, 								
								"invitation":req.body.details.invitation,
								"notification": req.body.details.notification, 
								"joingroup":req.body.details.joingroup,
								"maxlimit":req.body.details.maxlimit
								};

				var group = {group:groupreq};

				scocu.senddata('comserv/groups', 'POST', group, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						var resp = JSON.parse(result);
						if(resp.status == 'success')
						{
							if(req.body.groupmembers == undefined){
								var list = [{user_id:doc.user_id, admin:true, exit:false, is_delete:false}];
								var groupuser = {data:list}
								scocu.senddata('comserv/groups/'+resp.data.id+'/users', 'POST', groupuser, doc.token, function(err, users)
								{
									var result1 = JSON.parse(users);
									if(result1.status == 'success'){
										var groupobj = {"NAME":resp.data.name, "GROUP_ID":resp.data.id, "ADMIN":true, "TYPE":resp.data.type, 
										"IS_DELETE":false, "EXIT":false, "EXPIRE_DATE":resp.data.expire_date, "NOTIFICATION":resp.data.notification, 
										"CATEGORY":req.body.details.category, "JOINGROUP":resp.data.joingroup, "INVITATION":resp.data.invitation, "MAXLIMIT":resp.data.maxlimit};
										res.send({success:true, data:JSON.stringify(groupobj)});
									}else{
										res.send({success:false, data:'Unable to join'});
									}
								});
							}
							else if(req.body.groupmembers != undefined && req.body.groupmembers.length > 0)
							{
								var groupmembers = {data:req.body.groupmembers}
								scocu.senddata('comserv/groups/'+resp.data.id+'/users', 'POST', groupmembers, doc.token, function(err, result)
								{
									if(err){
										res.send({success:false, data:'Unable to join'});
									}
									else
									{
										var resp1 = JSON.parse(result);
										if(resp1.status == 'success')
										{
											var groupobj = {"NAME":resp.data.name, "GROUP_ID":resp.data.id, "ADMIN":true, "TYPE":resp.data.type, 
											"IS_DELETE":false, "EXIT":false, "EXPIRE_DATE":resp.data.expire_date, "NOTIFICATION":resp.data.notification, 
											"CATEGORY":req.body.details.category, "JOINGROUP":resp.data.joingroup, "INVITATION":resp.data.invitation, 
											"MAXLIMIT":resp.data.maxlimit};
											res.send({success:true, data:JSON.stringify(groupobj)});
											for (var i = 0; i < req.body.groupmembers.length; i++) 
											{
												groupobj['USER_ID'] = req.body.groupmembers[i].user_id
												utils.emitMsg(io,req.body.groupmembers[i].username, groupobj, 'updategroup');
												utils.joinGroup(io,req.body.groupmembers[i].username, resp.data.id)
												if(req.body.messages != undefined){
													var groupmsg = {"from_user_id":req.body.messages.fromuserid, "username":req.body.messages.from, "group_id":resp.data.id, 
													"type":req.body.messages.type, "media":req.body.messages.media, "video":req.body.messages.video, "audio":req.body.messages.audio, 
													"file_transfer":req.body.messages.filetransfer, "message":req.body.messages.message, "message_id":req.body.messages.message_id, 
													"file_name":req.body.messages.file_name};

													var groupmessage = {group_message:groupmsg}
													scocu.senddata('comserv/'+resp.data.id+'/groupmessages', 'POST', groupmessage, doc.token, function(err, result1){
														console.log(result1);
													})
												}
											}
										}
										else{
											res.send({success:false, data:'Unable to join'});
										}
									}
								});
							}
						}
						else{
							res.send({success:false, data:result});
						}
						
					}
				})
			}
		});
	});

	app.post('/updategroupname', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var group = {"group" : req.body.details}
				scocu.senddata('comserv/groups/'+req.body.details.GROUP_ID, 'PUT', group, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err})
					}
					else{
						var resp = JSON.parse(result);
						if(resp.status == 'success'){
							// res.send({success: true, data: result})
							if(req.body.groupmembers != undefined && req.body.groupmembers.length > 0){
								var groupobj = {data:req.body.groupmembers}
								scocu.senddata('comserv/groups/'+req.body.details.GROUP_ID+'/users', 'POST', groupobj, doc.token, function(err, result1){
									if(err){
										res.send({success:false, data:err.body})
									}
									else{
										var resp1 = JSON.parse(result1);
										if(resp1.status == 'success'){
											scocu.senddata('comserv/groups/'+req.body.details.GROUP_ID+'/users', 'GET', null, doc.token, function(err, result2){
												if(err){
													res.send({success:false, data:err.body})
												}
												else
												{
													var resp2 = JSON.parse(result2);
													if(resp2.status == 'success'){
														var filter = resp2.data.filter(function(item){
															return (item.EXIT == false && item.IS_DELETE == false)
														});
														res.send({success:true, data:filter})
														io.sockets.in(req.body.details.GROUP_ID).emit('addmemberstogroup', filter);
														for (var i = 0; i < req.body.groupmembers.length; i++) {
															var groupmembersobj = {GROUP_ID:req.body.details.GROUP_ID, ADMIN:false, EXIT:false, IS_DELETE:false, 
																USER_ID:req.body.groupmembers[i].user_id, NAME:req.body.details.NAME, EXPIRE_DATE:req.body.details.EXPIRE_DATE, 
																INVITATION:req.body.details.INVITATION, JOINGROUP:req.body.details.JOINGROUP, 
																NOTIFICATION:req.body.details.NOTIFICATION, TYPE:req.body.details.TYPE, MAXLIMIT:req.body.details.MAXLIMIT};
															// utils.emitMsg(io,req.body.groupmembers[i].username, groupmembersobj, 'updategroup');		
															utils.joinGroup(io, req.body.groupmembers[i].username, req.body.details.GROUP_ID);
														}
													}
													else
														res.send({success:false, data:result2})
												}
											});
										}
									}
								});
							}

						}
						else
							res.send({success: false, data: result})
					}
				});
			}
		});
	})

	// Delete list of memebers in a group
	app.post("/deleteGroup", function(req, res){
		var data = req.body;
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({status:"error"},{data:err})
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
					if(rsp.status == "success")
					{
						var obj = {"formName":"usersingroup", "data":{isdelete: true}};
						scocu.update("usersingroups", obj, rsp.data[0].id, doc.token, function(err, rsp){
							res.send(err, rsp);	
						});
					}
				});
			}
		});
	});

	app.post('/getgroupmembers', function(req, res){
		var data = req.body;
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc)
		{
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				utils.getGroupmembers(scocu, req.body.groupid, doc.token, function(result){
					res.send(result);
				});
			}
		})
	});

	app.post('/grouphistory', function(req, res){
		var data = req.body;
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				scocu.senddata('comserv/'+data.group_id+'/groupmessages?limit=30&offset='+req.body.offset, 'GET', null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		})
	});

	app.post('/updateumcount', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				utils.updateUmcount(scocu, doc.user_id, doc.token, req.body.obj, function(result){
					res.send(result);
				})
			}
		});
	})

	app.post('/calllog', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/greetings', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/blockextornum', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/tts', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/getMedia', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{

			}
		})
	});

	app.post('/deleteMessage', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/createCategory', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/getCategories', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/deleteCategories', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/changepassword', function(req, res){
		var data = req.body;
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var data = {"app_user": {"current_password": req.body.currpass, "password":req.body.newpass, "password_confirmation": req.body.cnfpass}}
				scocu.senddata('app_users/passwordreset', 'POST', data, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		})
	});

	app.post('/getFiles', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				scocu.senddata('comserv/'+doc.user_id+'/messages/'+req.body.toid+'?filetransfer=true', 'GET', null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		})
	});
	app.post('/getGroupFiles', function(req, res){
		dbutils.getUserData(req.body.username, req.body.sessiontoken, function(err,doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}else{
				scocu.senddata('comserv/'+req.body.groupid+'/groupmessages/filesearch', 'GET', null, doc.token, function(err, result){
					if(err){
						res.send({success:false, data:err.body})
					}
					else{
						res.send({success:true, data:result})
					}
				});
			}
		})
	});
}
