xenApp.factory('teamrService', function($state, $rootScope, localStorageService) {
    var teamrService = {};
    var comser      = new ComSer();
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
        });
    }

    teamrService.changepassword = function (details, callback) {
        comser.changepassword(details, callback);
    };

    teamrService.sendpresence = function (username, presence, cList, callback) {
        comser.sendpresence(username, presence, cList, callback);
    }

    teamrService.getcontacts = function (username, callback) {
        comser.getcontacts(username, callback);
    }

    teamrService.searchcontact = function (username, searchname, callback) {
        comser.searchuser(username, searchname, callback);
    }

    teamrService.search = function (searchname, callback) {
        comser.search(searchname, callback);
    }

    teamrService.getchathistory = function (username, fromid, toid, offset, callback) {
        comser.chathistory(username, fromid, toid, offset, callback);
    }

    teamrService.disconnect = function (username) {
        comser.disconnect(username);
    }

    teamrService.fileupload = function (username, formdata, callback, progresscallback) {
        return comser.fileupload(username, formdata, callback, progresscallback);
    }

    teamrService.cancelxmlreq = function (callback) {
        comser.cancelxmlreq(callback);
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

    teamrService.rejectContactreq = function (username, toname, recid, obj, callback){
        comser.rejectContactreq(username, toname, recid, obj, callback);
    }

    teamrService.blockcontact = function (from, touser, recid, obj, callback) {
        comser.blockcontact(from, touser, recid, obj, callback);
    }

    teamrService.unblockcontact = function (from, touser, recid, obj, callback) {
        comser.unblockcontact(from, touser, recid, obj, callback);
    }

    teamrService.deletecontact = function (from, touser, recid, obj, callback) {
        comser.deletecontact(from, touser, recid, obj, callback);
    }

    teamrService.creategroup = function (username, details, callback) {
        return comser.creategroup(username, details, callback);
    }

    teamrService.createdirectteam = function (groupname, groupmembers, message, callback) {
        return comser.createdirectteam(groupname, groupmembers, message, callback);
    }

    teamrService.updategroupname = function (groupobj, groupmembers, callback) {
        return comser.updategroupname(groupobj, groupmembers, callback);
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

    teamrService.getgrouphistory = function (username, group_id, offset, callback) {
        comser.getgrouphistory(username, group_id, offset, callback)
    }

    teamrService.addmemberstogroup = function (username, groupobj, list, callback) {
        comser.addmemberstogroup(username, groupobj, list, callback)
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

    teamrService.makeadmin = function (username, groupid, list, callback) {
        comser.makeadmin(username, groupid, list, callback)
    }

    teamrService.deletegroup = function (groupname, from, callback) {
        comser.getgroupmemebers(groupname, from, callback)
    }

    teamrService.subscribegroups = function (username, list) {
        comser.subscribegroups(username, list)
    }

    teamrService.getsharedfiles= function (username, id, callback) {
        comser.getsharedfiles(username, id, callback)
    }

    teamrService.getgroupsharedfiles = function (groupid, callback) {
        comser.getgroupsharedfiles(groupid, callback);
    }

    teamrService.updateumcount = function (obj, callback) {
        comser.updateumcount(obj, callback)
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
                    if($state.is('home.chatview') == true)
                        $rootScope.$broadcast('updateChat', obj);
                    else
                        $rootScope.$broadcast('privatechatupdate', obj);
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
                    $rootScope.$broadcast('acceptcontactrequpdate', obj);
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
                    if($state.is('home.chatview') == true){
                        $rootScope.$broadcast('blockcontact', obj);
                    }
                    else if($state.is('home') == true)
                        $rootScope.$broadcast('updatecontact', obj);
                }
                break;
                case 'unblockcontact':
                {
                    if($state.is('home.chatview') == true){
                        $rootScope.$broadcast('unblockcontact', obj);
                    }
                    else if($state.is('home') == true)
                        $rootScope.$broadcast('updatecontact', obj);
                }
                break;

                case 'deletecontact':
                {
                    if($state.is('home.chatview') == true){
                        $rootScope.$broadcast('deletecontact', obj);
                    }
                    else if($state.is('home') == true)
                        $rootScope.$broadcast('updatecontact', obj);
                }
                break;
                case 'updategroup':
                {
                    $rootScope.$broadcast('updategroup', obj);
                }
                break;
                case 'groupchat':
                {
                    if($state.is('home.groupchatview') == true)
                        $rootScope.$broadcast('groupchat', obj);
                    else
                        $rootScope.$broadcast('groupchatupdate', obj);
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
                case 'videocall':
                {
                    $rootScope.$broadcast('videocall', obj);
                }
                break;
                case 'disconnectvideocall':
                {
                    var url = $state.href('video', {}, {absolute: true})
                    $rootScope.ref.postMessage('wewfwff', url)
                    // localStorageService.set('closevideocall', true);
                    // $scope.$emit('$messageOutgoing',angular.toJson({"response":"hi"}));
                    // $rootScope.$broadcast('closevideocall', obj);
                }
                break;
            }
        });
    }

    teamrService.outboundvideocall = function (touser, roomid, callback) {
        comser.videocall(touser, roomid, callback);
    }

    teamrService.disconnectvideocall = function (fromuser, roomid) {
        comser.disconnectvideocall(fromuser, roomid);
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

    teamrService.getservertime = function (callback) {
        return comser.getservertime(callback);
    }

    teamrService.removeAllListeners = function () {
        comser.removeAllListeners();
    }    

    return teamrService;
});
