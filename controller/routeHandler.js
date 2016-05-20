var globals 		= require('../config/global');
var multipart       = require('connect-multiparty');
var multipartMiddleware    = multipart();
module.exports 		= function(app, utils, scocu, redis){
	var extend 			= require('extend');
	app.post('/login', function(req, res){
		if(req.body.username == "" || req.body.password == "" || 
			req.body.username == undefined || req.body.password == undefined){
			res.send({success: false, data: "Invalid Details"})
		}
		console.log('POST /login username:'+req.body.username);
		var url  = "app_users/login";
		var data = {"username":req.body.username, "password":req.body.password, "user_ip":"183.82.99.194"};
		scocu.senddata(url, "POST", data, null, function(err, user){
			if(err){
				console.log('login error : '+err);
				res.send(err.body)
			}
			else{
				user = JSON.parse(user); 
				if(user.status == "success"){
					utils.setUserData(user.data.username, user.data.id, user.data.token);
					var usermap = {
						'firstname' 	: user.data.firstname, 
						'lastname' 		: user.data.lastname, 
						'phonenumber' 	: user.data.phonenumber, 
						'username' 		: user.data.username, 
						'email' 		: user.data.email,
						'description' 	: user.data.description,
						'picUrl' 		: user.data.picUrl,
						'user_id'		: user.data.id
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
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({success: false, data: err.body});
			else{
				scocu.senddata('app_users/logout', 'POST',  null, doc.token, function(err,data){
					if(err)
						res.send({success: false, data: err.body});
					else{
						utils.deleteUserData(req.body.username);
						data = JSON.parse(data);
						if(data.status == "success"){
							// removeSocketId ( req.body.devType + '_' + req.body.username ) ;
							redis.delete(req.body.devType + '_' + req.body.username);
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
		utils.getUserData(req.body.username, function(err, doc){
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

	app.post("/getcontacts", function(req, res){
		utils.getUserData(req.body.username, function(err, doc){
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
						res.send({success:true, data:result})
					}
				});
			}
		});
	});

	app.post("/getchathistory", function(req, res){
		utils.getUserData(req.body.username, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({success:false, data:err})
			}
			else{
				var url = "comserv/"+req.body.fromid+"/messages/"+req.body.toid;
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
		utils.getUserData(req.body.username, function(err, doc){
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
		utils.getUserData(req.body.username, function(err, doc){
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


	app.post("/createGroup", function(req, res){
		var data = req.body;
		utils.getUserData(data.username, function(err, doc){
			if(err || doc == null){
				console.log('err @ getToken : '+err);
				err = "Invalid ID";
				res.send({status:"error"},{data:err})
			}
			else{
				var groupreq = {"name":data.groupname, "type":data.grouptype, "expiredate":data.expirydate, 
				"notification":data.notification, "category":data.category, "joingroup":data.joingroup, "invitation":data.invitation};
				var obj = {"formName":"group", "data":groupreq};
				scocu.createRecord("groups", obj, doc.token, function(err, resp){
					if(err){
						res.send(err, resp);
					}
					else{
						var rsp = JSON.parse(resp);
						if(rsp.status == "success"){
							var useringroup = {"isadmin":true, "user_id":doc.user_id, "group_id":rsp.data.id};
							var userobj = {"formName":"usersingroup", "data":useringroup};
							scocu.createRecord("usersingroups", userobj, doc.token, function(err, resp){
								res.send(err, resp);
							});
						}
						else{
							res.send(err, resp);
						}
					}
				});
			}
		});
	});

	app.post("/exitGroup", function(req, res){
		var data = req.body;
		utils.getUserData(data.username, function(err, doc){
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
						{"field": "group_id","cond": "eq","val": data.groupid}]}]
					}
				}
				scocu.search('usersingroups', filter, doc.token, function(err, resp){
					var rsp = JSON.parse(resp);
					if(rsp.status == "success"){
						var obj = {"formName":"usersingroup", "data":{isexit: true}};
						scocu.update("usersingroups", obj, rsp.data[0].id, doc.token, function(err, rsp){
							res.send(err, rsp);	
						});
					}
				});
			}
		});
	});

	// Delete list of memebers in a group
	app.post("/deleteGroup", function(req, res){
		var data = req.body;
		utils.getUserData(data.username, function(err, doc){
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

	app.post('/getJoinedgroups', function(req, res){
		var data = req.body;
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
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
						res.status(200).send(resp);						
					}
				});
			}
		})
	});

	app.post('/getGroupMembers', function(req, res){
		var data = req.body;
		utils.getUserData(data.username, function(err, doc){
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
						"and":{"field": "group_id","cond": "eq","val": data.groupId}
					}
				}

				scocu.search('usersingroups', filter, doc.token, function(err, resp){
					res.send(err, resp)
				});
			}
		});
	});

	app.post('/makeAdmin', function(req, res){
		var data = req.body;
		utils.getUserData(data.username, function(err, doc){
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
							scocu.search('usersingroups', filter, doc.token, function(err, rsp){
								var re = JSON.parse(rsp);
								if(re.status == success && re.data.length > 0){
									var useringroup = {"isadmin":true};
									var obj = {"formName":"usersingroup", "data":useringroup};
									scocu.update("usersingroups", obj, re.data[0].id, doc.token, function(err, re){
										res.send(err, re);	
									});
								}
							});
						}
					}else{
						res.send({status:"error"},{data:err});
					}
				});
			}
		});
	});	

	app.post('/calllog', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/greetings', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/blockextornum', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/tts', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/getMedia', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{

			}
		})
	});

	app.post('/deleteMessage', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/createCategory', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/getCategories', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});

	app.post('/deleteCategories', function(req, res){
		utils.getUserData(req.body.username, function(err,doc){
			if(err)
				res.send({'status':'error'});
			else{
			}
		})
	});
}