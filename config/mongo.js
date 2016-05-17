var mongoose    = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
// var MongoClient = require('mongodb').MongoClient;
var mongoUrl    = require('../config/global').mongoUrl;
var d1 = new Date();

// mongodb connection here

mongoose.connect(mongoUrl,function(err, db){
  if(err)
    console.log(err)
  else{
    var d2 = new Date();
    console.log("time taken to connect  db is " + (d2-d1))
  }
});


// collections

exports.Users = mongoose.model('Users',{
  'username'  : String,
  'password'  : String,
  'picUrl'    : String,
  'firstName' : String,
  'lastName'  : String,
  'status'    : String,
  'description' :String
},'Users');

/*scocu table structure*/
exports.UserToken = mongoose.model('UserToken',{
  'username': String,
  'user_id' : String,
  'token' : String,
  'status_id': String
},'UserToken');

exports.UserContacts = mongoose.model('UserContacts',{
  'userId' : ObjectId,
  'contactId' : [{ type: Schema.Types.ObjectId, ref: 'Users' }]
},'UserContacts');

/*scocu table structure*/
exports.UserGroups = mongoose.model('UserGroups',{
  'userId'  : [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  'groupId' : [{ type: Schema.Types.ObjectId, ref: 'Groups' }],
  'isAdmin' : Boolean
},'UserGroups');
/*scocu table structure*/
exports.Groups = mongoose.model('Groups',{
      "customId": String,
      "picUrl": String,
      "name": String,
      "type": String
},'Groups');

const userObj= {
      "toUser": String,
      "toUser_id":  [{ type: Schema.Types.ObjectId, ref: 'Users' }],
      "fromUser_id":  [{ type: Schema.Types.ObjectId, ref: 'Users' }],
      "fromUser": String, 
      "timestamp": Date, 
      "isVideo": Boolean, 
      "isAudio": Boolean, 
      "isFileTransfer": Boolean, 
      "isMedia": Boolean, 
      "type": String, 
      "msg": String ,
      "msgId": String, 
      "isSent": Boolean , 
      "isDelivered": Boolean , 
      "isRead": Boolean
     };
exports.OfflineMsgs = mongoose.model('OfflineMsgs' , userObj,"OfflineMsgs");

exports.Messages = mongoose.model('Messages' , userObj,"Messages");

const groupObj = {
      "groupId": String,
      "group_id":  [{ type: Schema.Types.ObjectId, ref: 'Groups' }],
      "toUser_id": [{ type: Schema.Types.ObjectId, ref: 'Users' }],
      "fromUser_id": [{ type: Schema.Types.ObjectId , ref: 'Users'}],
      "toUser": String, 
      "fromUser": String, 
      "timestamp": Date, 
      "isVideo": Boolean, 
      "isAudio": Boolean, 
      "isFileTransfer": Boolean, 
      "isMedia": Boolean, 
      "type": String, 
      "msg": String ,
      "msgId": String, 
      "isSent": Boolean , 
      "isDelivered": Boolean , 
      "isRead": Boolean
     };
exports.GroupMessages = mongoose.model('GroupMessages' , groupObj,"GroupMessages");
exports.OfflineGroupMsgs = mongoose.model('OfflineGroupMsgs' , groupObj,"OfflineGroupMsgs");


