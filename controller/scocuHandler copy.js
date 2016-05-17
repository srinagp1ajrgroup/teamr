var globals = require('../config/global');
function scocu(requestify, utils){
    var userUrl = "http://10.10.0.46/scocu.api/api/comservusers/";
    var baseUrl = "http://10.10.0.46/scocu.api/api/comserv/";
    var logUrl = "http://10.10.0.46/scocu.api/api/app_users/";
	this.authenticateUser = function (username, password, ip, callback)
	{
		var data = {};
		data["username"] = username;
		data["password"] = password;
		data["user_ip"] = "183.82.99.194";
		scocuRESTController(logUrl+"login", "POST", data, null ,callback);
	}
    this.logoutUser = function(token ,callback)
    {
        scocuRESTController(logUrl+"logout", "POST", null , token ,callback);   
    }

    this.update = function(collectionData, rowId, token, callback){
        updateCollectionData( collectionData, rowId, token, callback)
    }

    this.updatePresence = function(collectionData, rowId, token, callback){
        updateUsersData( collectionData, rowId, token, callback)
    }

    this.saveOfflineMessage = function(collectionName, collectionData, token)
    {
        setCollectionData(collectionName, collectionData, token, function(err,result){
            if (err) {
                console.log('err@saveOfflineMessage :: '+err);
            }else{
                console.log(' message save :: '+result.status);
            }
        });
    }
    this.search = function(collectionName, collectionData, token, callback){
        /* http://10.10.0.46/scocu.api/api/apps/5694e9b06e65742a5c020500/newusercontacts/search */
        var url =  baseUrl+globals.application_id+"/"+collectionName+"/search";
        scocuRESTController(url, "POST",collectionData, token ,callback);         
    }
    this.relationQuery = function(collectionName, rCollectionName, collectionData, token, callback){
        /* http://10.10.0.46/scocu.api/api/apps/5694e9b06e65742a5c020500/newusercontacts/users/search */
        var url =  baseUrl+globals.application_id+"/"+collectionName+"/"+rCollectionName+"/search";          
        scocuRESTController(url, "POST",collectionData, token ,callback);
    }

    this.createRecord = function(collectionName, data,token,callback){
        setCollectionData(collectionName, data, token, callback);
    }

    this.deleterecord = function(collectionName, rowId, token, callback){
        deleteCollectionData( collectionName, rowId, token, callback)
    }

    this.getusers = function(token, callback){
        var url =  baseUrl+globals.application_id+"/users";
        scocuRESTController(url, "GET", null, token ,callback);
    }

    this.getuserbyName = function(name, token, callback){
        var url =  "http://10.10.0.46/scocu.api/api/comserv/search/users/"+name;
        scocuRESTController(url, "GET", null, token ,callback);
    }
 
    /*CRUD REST calls*/
    function getCollectionData( collectionName, rowId, token, callback){
        var url =  baseUrl+globals.application_id+"/"+collectionName+"/"+rowId;          
        scocuRESTController(url, "GET", null, token ,callback);           
    } 

    function getCollection( collectionName, token, userid, callback){
        var url =  baseUrl+globals.application_id+"/"+collectionName+"/app_user_id/"+userid+"/search";          
        scocuRESTController(url, "GET", null, token ,callback);           
    } 

    function setCollectionData( collectionName, collectionData, token, callback){
        var url =  baseUrl+"/"+collectionName;
        scocuRESTController(url, "POST", collectionData, token ,callback);
    }    
    function updateCollectionData( collectionData, rowId, token, callback){
        // var url =  baseUrl+globals.application_id+"/"+collectionName+"/"+rowId;          
        var url = baseUrl;
        scocuRESTController(url, "PUT", collectionData, token ,callback);  
    }

    function updateUsersData( collectionData, rowId, token, callback){
        // var url =  baseUrl+globals.application_id+"/"+collectionName+"/"+rowId;          
        var url = userUrl+rowId;
        scocuRESTController(url, "PUT", collectionData, token ,callback);  
    }

    function deleteCollectionData( collectionName, rowId, token, callback){
        var url =  baseUrl+globals.application_id+"/"+collectionName+"/"+rowId;          
        scocuRESTController(url, "DELETE",null, token ,callback);                     
    }    
	function scocuRESTController(url, method, data, token, callback)
	{
        var header = {
              'application_id': globals.application_id,
              'app_user_ip': globals.app_user_ip,
              'Content-Type': "application/json",
            };
        if (token != null) {
               header['app_user_token'] = token;
            };
		requestify.request(url, {
			method: method,
			headers: header,
			body: data,
            dataType: 'json'
        }).then(function (response) 
        {
            response.getBody();
            response.getHeaders();
            response.getHeader('Accept');
            response.getCode();
            callback(null, response.body);
        }).catch(function (err){
            callback(err,null)
        });
    }	
}
module.exports.scocu = scocu;
