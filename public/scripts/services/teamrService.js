xenApp.factory('teamrService', function($rootScope) {
    var teamrService = {};
    var comser = new ComSer();

    teamrService.login = function (credentials, logincallback) {
        comser.login(credentials, logincallback);
    };

    teamrService.connect = function () {
        comser.connect();
    }

    teamrService.subscribe = function (data, callback) {
        comser.subscribe(data, callback);
    }

    teamrService.sendpresence = function (username, presence, cList, callback) {
        comser.sendpresence(username, presence, cList, callback);
    }

    teamrService.getcontacts = function (username, callback) {
        comser.getcontacts(username, callback);
    }

    teamrService.searchcontact = function (username, searchname, callback) {
        comser.searchuser(username, searchname, callback);
    }

    teamrService.getchathistory = function (username, fromid, toid, callback) {
        comser.chathistory(username, fromid, toid, callback);
    }

    teamrService.disconnect = function (username) {
        comser.disconnect(username);
    }

    teamrService.fileupload = function (username, formdata, callback) {
        comser.fileupload(username, formdata, callback);
    }

    teamrService.getfileurl = function (username, msg, callback) {
        comser.getfileurl(username, msg, callback);
    }

    teamrService.addcontact = function (from, toname, toid, callback) {
        comser.sendContactreq(from, toname, toid, callback);
    }

    teamrService.acceptContactreq = function (username, toname, recid, callback) {
        comser.acceptContactreq(username, toname, recid, callback);
    }

    teamrService.blockcontact = function (from, touser, recid, obj, callback) {
        comser.blockcontact(from, touser, recid, obj, callback);
    }

    teamrService.deletecontact = function (from, touser, recid, obj, callback) {
        comser.deletecontact(from, touser, recid, obj, callback);
    }

    teamrService.createGroup = function (groupname, grouptype, expirydate, sendnotify, category, joingroup, invitationType, from, callback) {
        comser.creategroup(groupname, grouptype, expirydate, sendnotify, category, joingroup, invitationType, from, callback)
    }

    teamrService.getjoinedgroups = function (from, callback) {
        comser.getjoinedgroups(from, callback)
    }

    teamrService.getgroupmemebers = function (groupname, from, callback) {
        comser.getgroupmemebers(groupname, from, callback)
    }

    teamrService.exitgroup = function (groupname, from, callback) {
        comser.exitgroup(groupname, from, callback)
    }

    teamrService.makeadmin = function (groupname, from, contact, callback) {
        comser.makeadmin(groupname, from, contact, callback)
    }

    teamrService.deletegroup = function (groupname, from, callback) {
        comser.getgroupmemebers(groupname, from, callback)
    }

    teamrService.listen = function()
    {
       
        comser.listen(function(eventType, obj){
            switch(eventType)
            {
                case 'presence':
                {
                    $rootScope.$broadcast('updatepresence', obj);
                }
                break;
                case 'privateChat':
                {
                    $rootScope.$broadcast('updateChat', obj);
                }
                break;
                case 'videochat':
                {
                    $rootScope.$broadcast('videochat', obj);
                }
                break;
                case 'chatack':
                {
                    $rootScope.$broadcast('chatack', obj);
                }
                break;
                case 'contactreq':
                {                    
                    $rootScope.$broadcast('updatecontact', obj);
                }
                break;
                case 'acceptcontactreq':
                {
                    $rootScope.$broadcast('acceptcontactreq', obj);
                }
                break;
                case 'isTyping':
                {
                    $rootScope.$broadcast('isTyping', obj);
                }
                break;
                case 'blockcontact':
                {
                    $rootScope.$broadcast('blockcontact', obj);
                }
                break;
                case 'deletecontact':
                {
                    // $rootScope.$broadcast('deletecontact', obj);
                }
                break;
            }
        });
    }

    teamrService.sendreq = function (event, obj) {
        comser.emit(event, obj);
    }
    teamrService.sendreqwithcallback = function (event, obj ,callback) {
        comser.emitwithcallback(event, obj , callback);
    }

    teamrService.sendmessage = function (obj, callback) {
        comser.sendMessage(obj, callback);
    }

    teamrService.notifyuser = function (username, touser, callback) {
        comser.notifyuser(username, touser, callback);
    }

    teamrService.logout = function (username, callback) 
    {
        comser.logout(username, callback);
    }

    teamrService.removeAllListeners = function () {
        comser.removeAllListeners();
    }

    return teamrService;
});
