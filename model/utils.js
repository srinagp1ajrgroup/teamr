"use strict";
var dbutil			= require('./dbutil').dbutil;
var mongo           = require('../config/mongo');
var dbutils 		= new dbutil(mongo);
var underscore 		= require("underscore");
function globFunc() {};

globFunc.prototype.removeSocketId = function(io, username) {
	delete io.sockets.sockets[username]
};
globFunc.prototype.getSocketId = function(io, username) {
	return io.sockets.sockets[username];
};
globFunc.prototype.setSocketId = function(io,username,id) {
	io.sockets.sockets[username] = id;
};
globFunc.prototype.emitToUser = function(io,eventType, data, sockid) {
	if (io.sockets.connected[sockid])
		io.sockets.connected[sockid].emit(eventType, data);
};
globFunc.prototype.emitGroupMsg = function(io,groupId, groupMsg, eventType) {
	io.sockets.broadcast.to(groupId).emit(eventType, groupMsg);
};
globFunc.prototype.emitMsg = function(io,username, data, eventName, callback)
{
	var self = this;
	var flag = false;
	dbutils.getUserSessions(username,function(err,docs){
		if (!err && docs) {
			for (var i = 0; i < docs.length; i++) {
				var sockid = self.getSocketId(io,docs[i].sessiontoken+"_"+username);
				if(sockid){
					self.emitToUser(io,eventName, data, sockid);
					flag = true;
				}
			}
		}

		if(callback)
		 	callback(flag);
	});
}

globFunc.prototype.getusercontacts = function(userid, token, callback)
{
	scocu.senddata( "comserv/contacts/"+userid, "GET", null, token, function(err, result){
		if(err){
			callback({success:false, data:err.body})
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

					data.nCount = 0;
					return true;
				})

				res.send({success:true, data:JSON.stringify(contacts)})
			}
			else
				res.send({success:false, data:result})
		}
	})
}

globFunc.prototype.joinGroup = function(io, username, groupid)
{
	var self = this;
	dbutils.getUserSessions(username,function(err,docs){
		if (!err && docs) {
			for (var i = 0; i < docs.length; i++) {
				var sockid = self.getSocketId(io, docs[i].sessiontoken+"_"+username);
				if(sockid)
					io.sockets.connected[sockid].join(groupid);
			}
		}
	});
}

globFunc.prototype.leaveGroup = function(io, sessiontoken, list, groupid)
{
	for(var i = 0; i < list.length; i++){
		var sockid = io.sockets.sockets[sessiontoken+'_'+list[i].USERNAME];
		if(sockid)
			io.sockets.connected[sockid].leave(groupid);
	}											
}

globFunc.prototype.getJoinedgroups = function(scocu, userid, token, callback){
	scocu.senddata("comserv/groups/users/"+userid, 'GET', null, token, function(err, result)
	{
		if(err){
			callback({success:false, data:err.body})
		}
		else
		{
			var resp = JSON.parse(result)
			if(resp.status == "success")
			{
				var filter = resp.data.filter(function(item){
					return (item.EXIT == false && item.IS_DELETE == false)
				});
				callback({success:true, data:filter})
			}
		}
	});
}

globFunc.prototype.getGroupinfo = function(scocu, groupid, token, callback){
	scocu.senddata("comserv/groups/"+groupid, 'GET', null, token, function(err, result){
		if(err)
			callback({success:false, data:err.body})
		else
			callback({success:true, data:JSON.parse(result)})
	});
}

globFunc.prototype.getGroupmembers = function(scocu, groupid, token, callback){
	scocu.senddata("comserv/groups/"+groupid+"/users", 'GET', null, token, function(err, result){
		if(err){
			callback({success:false, data:err.body})
		}
		else
		{
			var resp = JSON.parse(result);
			if(resp.status == "success"){
				var filter = resp.data.filter(function(item){
					return (item.EXIT == false && item.IS_DELETE == false)
				});
				callback({success:true, data:filter})
			}
			else
				callback({success:false, data:result})
		}
	});
}

globFunc.prototype.addMemberstoGroup = function(scocu, groupid, token, list, callback){
	scocu.senddata('comserv/groups/'+groupid+'/users', 'POST', list, token, function(err, result){
		if(err){
			callback({success:false, data:err.body})
		}
		else
		{
			var resp = JSON.parse(result);
			if(resp.status == 'success')
				callback({success:true, data:result});
			else
				callback({success:false, data:result});
		}
	});
}

globFunc.prototype.updateGroupMemebers = function(scocu, groupid, token, list, callback){
	scocu.senddata('comserv/groups/'+data.groupid+'/users', 'PUT', groupuser, token, function(err, result){
		if(err)
			callback({success:false, data:err.body});
		else
			callback({success:false, data:result});
	});
}

globFunc.prototype.updatechatack = function(scocu, data, userid, token, callback){
	setTimeout(function () 
	{
		scocu.senddata('comserv/messages/'+data.message_id, 'PUT', {message:{delivered:data.delivered, offline:data.offline}}, token, function(err, result){
			if(err)
				callback({success:false, data:err.body});
			else
				callback({success:false, data:result});
		});
	}, 5000);
}

globFunc.prototype.updatepresence = function(scocu, userid, token, callback)
{
	var presence = {"user" : {"user_id" : userid, "presence" : 'offline'}}
	scocu.senddata("comserv/users/"+doc.user_id+"/presence", "POST", presence, token, function(err, result){
		if(err)
			callback({success:false, data:err.body});
		else
			callback({success:false, data:result});
	});
}

globFunc.prototype.updateUmcount = function(scocu, userid, token, rec)
{	
	scocu.senddata("comserv/contacts/"+rec.ID, "PUT", {"contact":rec}, token, function(err, result){
		if(err)
			console.log(err)
		else
			console.log(result)
	});
}

module.exports = new globFunc();