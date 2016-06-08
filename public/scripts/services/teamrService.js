xenApp.factory('teamrService', function($rootScope, localStorageService) {
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

    teamrService.sendstatus = function(username, status){
        var contacts = localStorageService.get('user_contacts');
        var filter;
        if(contacts != null){
            filter  = contacts.filter(function(contact){
                if(contact.USERID1_BLOCKING == true || contact.USERID2_BLOCKING == true)
                    return;

                return contact;
            });            
        }

        this.sendpresence(username, status, filter, function(response){
            console.log(response);
        })
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

    teamrService.acceptContactreq = function (username, toname, recid, status, callback) {
        comser.acceptContactreq(username, toname, recid, status, callback);
    }

    teamrService.blockcontact = function (from, touser, recid, obj, callback) {
        comser.blockcontact(from, touser, recid, obj, callback);
    }

    teamrService.deletecontact = function (from, touser, recid, obj, callback) {
        comser.deletecontact(from, touser, recid, obj, callback);
    }

    teamrService.creategroup = function (username, details, callback) {
        comser.creategroup(username, details, callback)
    }

    teamrService.searchgroup = function (username, searchname, callback) {
        comser.searchgroup(username, searchname, callback);
    }

    teamrService.getjoinedgroups = function (username, callback) {
        comser.getjoinedgroups(username, callback)
    }

    teamrService.getgroupmemebers = function (username, groupid, callback) {
        comser.getgroupmemebers(username, groupid, callback)
    }

    teamrService.groupmessage = function (chat, callback) {
        comser.groupmessage(chat, callback)
    }

    teamrService.getgrouphistory = function (username, group_id, callback) {
        comser.getgrouphistory(username, group_id, callback)
    }

    teamrService.addmemberstogroup = function (username, groupid, groupname, list, callback) {
        comser.addmemberstogroup(username, groupid, groupname, list, callback)
    }

    teamrService.instantadd = function (username, groupid, groupname, list, callback) {
        comser.instantadd(username, groupid, groupname, list, callback)
    }

    teamrService.delmembersfromgroup = function (username, groupid, list, callback) {
        comser.delmembersfromgroup(username, groupid, list, callback);
    }

    teamrService.exitgroup = function (username, groupid, list, callback) {
        comser.exitgroup(username, groupid, list, callback)
    }

    teamrService.makeadmin = function (groupname, from, contact, callback) {
        comser.makeadmin(groupname, from, contact, callback)
    }

    teamrService.deletegroup = function (groupname, from, callback) {
        comser.getgroupmemebers(groupname, from, callback)
    }

    teamrService.subscribegroups = function (username, list) {
        comser.subscribegroups(username, list)
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
                case 'updategroup':
                {
                    $rootScope.$broadcast('updategroup', obj);
                }
                break;
                case 'groupchat':
                {
                    $rootScope.$broadcast('groupchat', obj);
                }
                break;
                case 'addmemberstogroup':
                {
                    $rootScope.$broadcast('addmemberstogroup', obj);
                }
                break;
                case 'delmembersfromgroup':
                {
                    $rootScope.$broadcast('delmembersfromgroup', obj);
                }
                break;
                case 'exitgroup':
                {
                    $rootScope.$broadcast('exitgroup', obj);
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
