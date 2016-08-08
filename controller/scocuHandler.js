"use strict";
var globals         = require('../config/global');
var requestify               = require('requestify'); 
var request         = require('request');
var FormData        = require('form-data');
var fs              = require('fs');
function scocu(){
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

    this.fileupload = function(file, callback){
        var asset = {};
        var req = request.post('https://brisol.net/ss2-d/api/files', function (err, resp, body) {
            if (err) {
                console.log('Error!');
                callback(err, body);
            } 
            else{
                callback(err, body);
            }
        });
        var form = req.form();
        form.append('file', fs.createReadStream(file.path), {
            file: file.name,
            'content-Type': 'multipart/form-data',
        });
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
