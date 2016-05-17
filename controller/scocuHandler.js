var globals = require('../config/global');
function scocu(requestify, utils){

    this.senddata = function(excatURL, method, data, token, callback){
        var url      = globals.baseURL+excatURL
        switch(method){
            case 'POST':{
                scocuRESTController(url, method, data, token, callback);
            }
            break;

            case 'GET':{
                scocuRESTController(url, method, null, token, callback);
            }
            break;

            case 'PUT':{
                scocuRESTController(url, method, data, token, callback);
            }
            break;

            case 'DELETE':{
                // scocuRESTController(url, method, data, token, callback);
            }
            break;
        }
    }

    function scocuRESTController(url, method, data, token, callback){
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
