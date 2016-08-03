xenApp.controller('groupchatController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, $mdToast, $notification, $log){
    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.selgroup     = $stateParams.group;
    $scope.selgroupobj  = {};
    $scope.selgroupindex = -1;    
    $scope.groupmembers = [];
    $scope.addmembers      = [];
    $scope.groupdetails = {};
    $scope.message      = '';
    $scope.groupchats   =  [];
    $scope.groupdate    =  [];
    $scope.files        =  [];
    $scope.mdToast      = $mdToast
    $scope.alert        = "";
    $scope.showprogress = false;
    $scope.progresspercent = 0;
    $scope.showmoreoptions  = false;
    $scope.isMember  = false;
    var prevdate = '';
    $scope.showSpinner = false;
    $scope.chatMessageStatus = true;
    var offset = 0;
    $scope.groups       = localStorageService.get("user_groups");
    if($scope.groups == null)
        $scope.groups = [];

    $scope.groupchatinit = function(){
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }

        $scope.topMiddleIndex = 2;
        
        for(var i = 0; i < $scope.groups.length; i++){
            if($scope.groups[i].NAME == $scope.selgroup){
                $scope.selgroupobj = $scope.groups[i]
                $scope.selgroupindex = i;
                break;
            }
        }

        if($scope.selgroup != null || $scope.selgroup != undefined){
            getgroupmemebers();
        }

        $scope.getgrouphistory();
    }

    $scope.getgrouphistory = function () {
        $scope.showSpinner = true;
        teamrService.getgrouphistory($scope.userdetails.username, $scope.selgroupobj.GROUP_ID, offset, function (response) {
            $scope.showSpinner = false;
            if(response.success == true){
                var resp = JSON.parse(response.data);
                var messages = resp.data;
                if (resp != null && resp.status == "success") {
                    if (messages.length == 0 || messages.length < 30)
                        $scope.chatMessageStatus = false;

                    for (var i = 0; i < resp.data.length; i++) {
                        if (resp.data[i].MESSAGE_ID == null || resp.data[i].MESSAGE_ID == "" || 
                            resp.data[i].MESSAGE_ID == undefined) {
                            timestamp = new Date(resp.data[i].CREATED_AT).getTime();
                        }
                        else
                            var timestamp = parseFloat(resp.data[i].MESSAGE_ID);
                       
                        updatechatui(resp.data[i].USERNAME, resp.data[i].MESSAGE, "user-chat", resp.data[i].FILE_TRANSFER, false, 
                            resp.data[i].AUDIO, resp.data[i].VIDEO, timestamp, resp.data[i].FILE_NAME);
                    }
                    $scope.$apply();
                }
            }
        });

        teamrService.getgroupsharedfiles($scope.selgroupobj.GROUP_ID, function(response){
            console.log("files:")
            console.log(response)
            if(response.success == true){
                var resp = JSON.parse(response.data);
                $scope.files = resp.data;
                $scope.files.filter(function (data) {
                    if(data.file_name != null){
                        var msgid         =   data.message_id.replace( /^\D+/g, '')
                        var timestamp     =   parseFloat(msgid);
                        if(timestamp == 0){
                            timestamp = new Date(messages[i].created_at).getTime();
                        }
                        var str = data.file_name.lastIndexOf(".");
                        data.ext = data.file_name.substr(str + 1, data.file_name.length)
                        if(data.ext == 'jpg' || data.ext == 'png' || data.ext == 'jpeg' || data.ext == 'gif')
                            data.media = true;
                        data.time = gettime(timestamp);
                        data.date = today_yesterday(timestamp);
                    }
                });

                // teamrCache.put($scope.seluser + 'files', $scope.files)                
            }
        })
        offset += 30;
    }

    $scope.readfile = function(file){
        if(file.audio == true)
            $scope.audioplayer(file.message, event)
        else if(file.video == true)
            $scope.videplayer(file.message, event)
        else
            $scope.download(file.message)
    }


    var getgroupmemebers = function(){
        teamrService.getgroupmemebers($scope.userdetails.username, $scope.selgroupobj.GROUP_ID, function(response){
            console.log(response);
            if(response.success == true){
                $scope.showmoreoptions = true;
                $scope.groupmembers = response.data; 
                $scope.$apply();
            } 
        })
    }

    $scope.$on('groupchat', function(event, obj){
        console.log(obj);

        if(obj.group_id != $scope.selgroupobj.GROUP_ID){
            $rootScope.$broadcast('groupchatupdate', obj);
            return;
        }

        updatechatui(obj.username, obj.message, "user-chat", obj.file_transfer, obj.media, obj.audio, obj.video, obj.message_id, obj.file_name);
        $scope.$apply();
    });

    function ConvertKeysToLowerCase(obj) {
        var output = {};
        for (i in obj) {
            if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
               output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
            }else if(Object.prototype.toString.apply(obj[i]) === '[object Array]'){
                output[i.toLowerCase()]=[];
                 output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
            } else {
                output[i.toLowerCase()] = obj[i];
            }
        }

        return output;
    };


    $scope.addmemberstogroup = function(ev) {

          $scope.mdDialogPopup($scope, addmemberstogroupctrl, '../../views/addmembers.html', ev)
    }
function addmemberstogroupctrl($scope, parentscope){
                $scope.addmembers           = [];
                $scope.updatedcontacts      = localStorageService.get('user_contacts');
                $scope.isSending = false;
                $scope.cancel = function(){
                    $scope.addmembers = [];
                    $mdDialog.hide();
                }

                _.filter($scope.updatedcontacts, function(contact){
                    _.filter(parentscope.groupmembers, function(groupmember){
                        if(contact.USERNAME == groupmember.USERNAME)
                            contact.existingroup = true;
                    })
                })

                $scope.addmembertogroup = function(contact)
                {   
                    var ismember = _.where($scope.addmembers, {username:contact.USERNAME})
                    if ($scope.addmembers.length >= parentscope.selgroupobj.MAXLIMIT || parentscope.groupmembers.length >= parentscope.selgroupobj.MAXLIMIT) {
                       $scope.errorpopup("sry you have reached max limit");
                       return;
                   }
                    else{
                        if(ismember.length == 0){
                            if(contact.CONTACT_USER_ID1 == parentscope.userdetails.user_id)
                                $scope.addmembers.push({admin:false, user_id:contact.CONTACT_USER_ID2, username:contact.USERNAME, exit:false, is_delete:false}) 
                            else if(contact.CONTACT_USER_ID2 == parentscope.userdetails.user_id)
                                $scope.addmembers.push({admin:false, user_id:contact.CONTACT_USER_ID1, username:contact.USERNAME, exit:false, is_delete:false})
                        }
                    }
                }

                $scope.removemember = function($index){
                    $scope.addmembers.splice($index, 1);
                }

                $scope.add = function()
                {
                   if ($scope.addmembers.length == 0 || parentscope.groupmembers.length >= parentscope.selgroupobj.MAXLIMIT) {
                       $scope.errorpopup("sry you have reached max limit");
                       return;
                    }
                    // parentscope.addmembers = $scope.addmembers;
                    // parentscope.mergechat(ev);
                    // if(parentscope.groupmembers.length > 3)
                    {
                        $scope.isSending = true;
                        teamrService.addmemberstogroup(parentscope.userdetails.username, parentscope.selgroupobj, $scope.addmembers, 
                            function(response){
                                $scope.isSending = false;
                                console.log(response);
                                if(response.success == true){
                                    parentscope.groupmembers = response.data;
                                    $mdDialog.hide();
                                }
                                else if(response.success == false){
                                    parentscope.alert = response.data;
                                    parentscope.mdToast.show({hideDelay:10000, position:'bottom right', templateUrl:'views/alert.html'});
                                    $mdDialog.hide();
                                }
                        });
                    }
                    // else if(parentscope.groupmembers.length <= 3)
                    // {
                    //     parentscope.addmembers = $scope.addmembers;
                    //     // suggestgroupname(ev);
                    //     teamrService.updategroupname(parentscope.selgroupobj, parentscope.addmembers, function(response){
                    //         console.log(response);
                    //         parentscope.groups[parentscope.selgroupindex].NAME = parentscope.selgroupobj.NAME;
                    //         $mdDialog.hide();
                    //     })
                    // }
                }
}
    $scope.showCustomToast = function() {
        $mdToast.show({
            hideDelay   : 3000,
            position    : 'top right',
            controller  : function($scope){

            },
            templateUrl : 'alert.html'
        });
    };




    $scope.delmemberstogroup = function(ev) {
            $scope.mdDialogPopup($scope, delmemberstogroupctrl, '../../views/deletemembers.html', ev);
    };

    function delmemberstogroupctrl($scope, parentscope){
                $scope.username = parentscope.userdetails.username;
                $scope.selgroup = parentscope.selgroup;
                $scope.groupmembers = parentscope.groupmembers;
                $scope.delmem = [];
                $scope.alert = '';
                $scope.isSending = false;

                $scope.addmemtoqueue = function($index){
                    console.log($scope.groupmembers[$index]);
                    $scope.groupmembers[$index].IS_DELETE = true;
                    $scope.delmem.push($scope.groupmembers[$index]);
                    $scope.groupmembers.splice($index, 1);
                }
                $scope.deletemembers = function(){
                    $scope.isSending = true;
                    teamrService.delmembersfromgroup(parentscope.userdetails.username, parentscope.selgroupobj.GROUP_ID, $scope.delmem,
                        function(response){
                            $scope.isSending = false;
                            if(response.success == true){
                            }
                            else{
                                for(var i = 0; i < $scope.delmem.length; i++){
                                    $scope.delmem[i].IS_DELETE = false;
                                    $scope.groupmembers.push($scope.delmem[i]);
                                }
                                $scope.delmem = [];            
                            }
                            $mdDialog.hide();
                            $scope.$apply();
                    });
                }
                $scope.cancel = function(){
                    for(var i = 0; i < $scope.delmem.length; i++){
                        $scope.delmem[i].IS_DELETE = false;
                        $scope.groupmembers.push($scope.delmem[i]);
                    }
                    $scope.delmem = [];            
                    $mdDialog.hide();
                }


    }






    $scope.$on('addmemberstogroup', function(event, data){
        if(data.groupid == $scope.selgroupobj.GROUP_ID){
            $scope.groupmembers = data.list;
            $scope.$apply();
        }
    });

    $scope.$on('delmembersfromgroup', function(event, data){
        if(data.groupid == $scope.selgroupobj.GROUP_ID){
            for(var i = 0; i < data.list.length; i++){
                for(var j = 0; j < $scope.groupmembers.length; j++){
                    if($scope.groupmembers[j].USERNAME == data.list[i].USERNAME)
                        $scope.groupmembers.splice(j, 1);        
                }
            }
        }

        $state.go('home')
        $scope.$apply();
    })



    $scope.exitgroup = function(ev){
        $scope.mdDialogPopup($scope, exitgroupctrl, '../../views/exitgroup.html', ev);
    }

    function exitgroupctrl($scope, parentscope){
                $scope.isSending = false;
                $scope.selgroup = parentscope.selgroup;
                $scope.cancel = function(){           
                    $mdDialog.hide();
                }
                $scope.exit = function()
                {
                    var list = [];
                    for(var i = 0 ; i < parentscope.groupmembers.length; i++){
                        if(parentscope.groupmembers[i].USERNAME == parentscope.userdetails.username){
                            parentscope.groupmembers[i].EXIT = true;
                            list.push(parentscope.groupmembers[i]);
                            break;
                        }
                    }
                    $scope.isSending = true;
                    teamrService.exitgroup(parentscope.userdetails.username, parentscope.selgroupobj.GROUP_ID, list, function(response){
                        $scope.isSending = false;
                        console.log(response);
                        if(response.success == true){
                            var usergroups = localStorageService.get('user_groups');
                            usergroups.splice(parentscope.selgroupindex, 1);
                            localStorageService.set('user_groups', usergroups);
                            $rootScope.$broadcast('updategroup');
                        }

                        $state.go('home');

                        $mdDialog.hide();
                    })
                }
    }

    $scope.$on('exitgroup', function (event, data) {
        if(data.groupid == $scope.selgroupobj.GROUP_ID){
            for(var i = 0; i < data.list.length; i++){
                for(var j = 0; j < $scope.groupmembers.length; j++){
                    if($scope.groupmembers[j].USERNAME == data.list[i].USERNAME)
                        $scope.groupmembers.splice(j, 1);        
                }
            }
        }
        $scope.$apply();        
    });

    $scope.create = function(){
        console.log($scope.groupdetails);
        $scope.groupdetails.category ="";
        teamrService.creategroup($scope.userdetails.username, $scope.groupdetails, function(response){
            console.log(response);
            if(response.success == true){
                var resp = JSON.parse(response.data);
                $rootScope.$broadcast("updategroup", resp);
                $mdDialog.cancel();
            }
        })
    }

    $scope.sendgroupMessageOnSubmit = function ($event) {
        if ($event.keyCode === 13 && !$event.shiftKey && window.navigator.onLine == true) {
            submitmessage();
            $event.preventDefault();
        }
        else if($scope.message.length > 2000){
            document.getElementById('gMessage').maxLength = 2000;
            return false;
        }
    }

    $scope.sendgroupmessage = function(){
        submitmessage();
    }

    function submitmessage(){
        // if($scope.message == '' || $scope.message == undefined)
        //     return;

        $scope.time = gettime();
        $scope.$broadcast('scrollToBottom', {})

        var timestamp = teamrService.getservertime();
        var gmessageobj = document.getElementById("gMessage");
        var gmessage    = gmessageobj.value;

        if(gmessage == '' || gmessage == null || gmessage == undefined)
            return;

        var chat = {
            "username"      : $scope.userdetails.username,
            "form_user_id"  : $scope.userdetails.user_id,
            "message"       : gmessage,
            "group_id"      : $scope.selgroupobj.GROUP_ID,
            "timestamp"     : timestamp,
            "time"          : $scope.time,
            "type"          : "groupchat",
            "media"         : false,
            "audio"         : false,
            "video"         : false,
            "file_transfer" : false,
            "message_id"    : timestamp,
            "file_name"     : "",
            "file_ext"      : "",
            "class"         : "user-chat"
        };
        
        updatechatui($scope.userdetails.username, gmessage, "user-chat", false, false, false, false, timestamp, false);
        // $scope.$apply();
        
        teamrService.groupmessage(chat, function(ackData){
        });
        gmessageobj.value = '';
    }

    function gettime(timestamp) {
        var currentdate = null;
        if (timestamp == null)
            return;

        currentdate = new Date(timestamp);

        var hours = currentdate.getHours();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        if (hours < 10)
            hours = "0" + hours;
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        return hours + ":" + minutes + ' ' + ampm;
    }
    function getFormattedDate(timestamp) {
        if (timestamp) {
            var date = new Date(timestamp);
            var formatter = new Intl.DateTimeFormat("eng", { month: "short" });
            var month = formatter.format(new Date(timestamp))
            var formattedDate = month + " " + date.getDate();
        }
        else {
            currentdate = new Date();
            var timestamp = currentdate.getTime()
            var date = new Date(timestamp);
            var formatter = new Intl.DateTimeFormat("eng", { month: "short" });
            var month = formatter.format(new Date(timestamp))
            var formattedDate = month + " " + date.getDate();
        }
        return formattedDate;
    }
    function today_yesterday(timestamp) {
        var chtMsgDate_days = Math.floor(timestamp / (24 * 60 * 60 * 1000));
        var current = teamrService.getservertime();
        var currentDate_days = Math.floor(current / (24 * 60 * 60 * 1000));
        if (currentDate_days - chtMsgDate_days == 0) {
            return "Today";
        }
        else if (currentDate_days - chtMsgDate_days == 1) {
            return "Yesterday";
        }

        else {
            return getFormattedDate(timestamp)
        }
    }
    $scope.uploadfile = function(){
        $scope.audioProgress = {};
        $scope.videoProgress = {};
        $scope.duration = {};
        $scope.videoduration = {};
        var audioflag = false;
        var mediaflag = false;
        var videoflag = false;
        document.getElementById("choose").click();
        document.getElementById("choose").addEventListener('change', function(){
            if($rootScope.netConnectionStat == false){
                $scope.errorpopup("No Internet Connection");
                return;
            }

            var fileInput   = document.querySelector('#choose');        
            if(fileInput.files.length == 0)
                return;
            var filename    = fileInput.files[0].name;
            teamrService.fileupload($scope.userdetails.username, fileInput.files[0], function(response){    
                document.getElementById('choose').value = '';            
                console.log(response);
                if(response.success == true){
                    var resp = JSON.parse(response.data);
                    if(resp.status == "success"){
                        if (resp.data.content_type.indexOf("audio") >= 0) {
                            mediaflag = true;
                            audioflag = true;
                        }

                        else if (resp.data.content_type.indexOf("video") >= 0) {
                            mediaflag = true;
                            videoflag = true;
                        }

                        var timestamp = teamrService.getservertime();

                        var chat = {
                            "username"      : $scope.userdetails.username,
                            "form_user_id"  : $scope.userdetails.user_id,
                            "message"       : resp.data.id,
                            "group_id"      : $scope.selgroupobj.GROUP_ID,
                            "timestamp"     : timestamp,
                            "time"          : $scope.time,
                            "type"          : "groupchat",
                            "media"         : mediaflag,
                            "audio"         : audioflag,
                            "video"         : videoflag ,
                            "file_transfer" : true,
                            "message_id"    : timestamp,
                            "file_name"     : filename,
                            "file_ext"      : "",
                            "class"         : "user-chat"
                        };
                        
                        updatechatui($scope.userdetails.username, resp.data.id, "user-chat", true, mediaflag, audioflag, videoflag, timestamp, filename);
                        $scope.$apply();
                        teamrService.groupmessage(chat, function(ackData){
                        });
                    }
                }
                else{
                }
            }, function(ev, percent){
                console.log(percent);
                if($rootScope.netConnectionStat == false){
                    $scope.cancelxmlreq();
                    $scope.errorpopup("Internet Disconnected");
                    $scope.progresspercent = 0;
                    $scope.showprogress = false;
                    return;
                }                
                $scope.progresspercent = percent;
                document.getElementById("progressBar").style.width = percent+"%";
            });
            document.getElementById('choose').value = '';
            if(ret != ''){
                $scope.showprogress = false;
                $scope.$digest();
                
                $scope.errorpopup("File you are trying to upload is too large. Max limit is 100kb");
                console.log(ret);
            }
        }, false);
    }

    $scope.download = function (msg) {
        teamrService.getfileurl($scope.userdetails.username, msg, function(response){
            console.log(response);
            if(response.success == true){
                var resp = JSON.parse(response.data);
                if(resp.status == "redirect"){
                   $window.open(resp.data, '_blank');
                }
            }
        });
    }

    $scope.audioplayer = function(msg, ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;        
        $mdDialog.show({            
            templateUrl: '../../views/playaudio.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
            },
            controller:function($scope, parentscope)
            {
                $scope.isplay = false;
                $scope.duration = '';
                var timelineWidth = 0;
                var duration = 0;         
                teamrService.getfileurl(parentscope.userdetails.username, msg, function(response){
                    if(response.success == true){
                        var resp = JSON.parse(response.data);
                        if(resp.status == "redirect"){
                            audiojs.events.ready(function() {
                                audiojs.createAll();
                                var vid = document.getElementById("myAudio")
                                vid.src = resp.data;
                            });    
                        }
                    }
                });
            },
            onRemoving:function(){
                var vid = document.getElementById("myAudio")
                vid.pause();
                vid.src = "";
            }
        })
        .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
            $scope.status = 'You cancelled the dialog.';
        });
        $scope.$watch(function() {
            return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
            $scope.customFullscreen = (wantsFullScreen === true);
        });
    };

    $scope.videplayer = function(msg, ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;        
        $mdDialog.show({            
            templateUrl: '../../views/playvideo.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
            },
            controller:function($scope, $document, parentscope)
            {                
                videoplayer_init = function(){
                    var queryResult = $document[0].getElementById('my_video_1')                        
                }

                teamrService.getfileurl(parentscope.userdetails.username, msg, function(response){
                    if(response.success == true){
                        var resp = JSON.parse(response.data);
                        if(resp.status == "redirect"){    
                            var vid = document.getElementById('my_video_1');
                            vid.src = resp.data;
                            vid.controls = true;
                            vid.autoplay = true;
                            player = videojs(vid,  { controlBar: true });                        
                        }
                    }
                });                
            }
        })
        .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
            $scope.status = 'You cancelled the dialog.';
        });
        $scope.$watch(function() {
            return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
            $scope.customFullscreen = (wantsFullScreen === true);
        });
    };

    function updatechatui(from, msg, appendClass, filetransfer, media, audio, video, timestamp, filename) {
        var time   = gettime(parseInt(timestamp));
        //var date   = getdate(timestamp)
        var params = {
            username: from, "class": appendClass, "message": msg, filetransfer: filetransfer, media: media, audio: audio,
            video: video, "time": time, "isPlaying": false, filename: filename, timestamp: timestamp
        };

        //if(prevdate == '')
        //    prevdate = date;

        appendtochatview(params, timestamp);
    }

    function getdate(timestamp) {
        var currentdate = null;
        if (timestamp)
            currentdate = new Date(timestamp);
        else
            currentdate = new Date();
        return currentdate.getDate()+"/"+currentdate.getMonth()+"/"+currentdate.getFullYear();
    }

    function appendtochatview(params, timestamp) 
    {
        var date = today_yesterday(timestamp);
        if (!angular.isUndefined(params)) {
            var filter = false;
            var i = 0;

            for(i = 0; i < $scope.groupdate.length; i++){
                if($scope.groupdate[i].date == date){
                    filter = true;
                    break;
                }
            }


            if (filter == false) {
                var formattedDate = today_yesterday(timestamp);
                $scope.groupdate.push({ date: formattedDate, chats: [params], timestamp:timestamp });
            }
            else
                $scope.groupdate[i].chats.push(params);
        }
    }

    $scope.focusChatBox = function () {
        angular.element(document.querySelector("#gMessage")).focus();
    }

    $scope.sessionStorageMessage = function () {
        sessionStorage.setItem($scope.seluser, $scope.message);
    }

    $scope.notifyTyping = function(){
        if($scope.message == '' || $scope.message == undefined)
            return;
        
        teamrService.notifyuser($scope.userdetails.username, $scope.seluser, function(response){
        })
    }

    $scope.mergechat = function(ev){
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/mergechat.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
            },
            controller:function($scope, parentscope)
            {
                $scope.copydate = '';
                $scope.add = function(){
                    var timestamp = new Date().getTime();
                    var copymsg = [];

                    if(parentscope.groupmembers.length > 3){
                        suggestgroupname(ev)
                    }else{
                        // teamrService.createdirectteam(parentscope.teamname, parentscope.addmembers, undefined, function(response){
                        //     console.log(response);
                        // })
                    }
                }

                $scope.cancel = function(){
                    $scope.addmembers = [];
                    $mdDialog.hide();
                }
            }
        });
    }

    function suggestgroupname(ev)
    {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/groupname.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
            },
            controller:function($scope, parentscope){
                $scope.cgLoading = false;
                $scope.pref = "";
                $scope.teamname = "";
                $scope.create = function(){
                    // var msg = parentscope.chatdate[0].chats[0]
                    $scope.teamname  = document.getElementById('team_name').value;
                    if($scope.teamname != '')
                        parentscope.selgroupobj.NAME = $scope.teamname;

                    teamrService.updategroupname(parentscope.selgroupobj, parentscope.addmembers, function(response){
                        console.log(response);
                        parentscope.groups[parentscope.selgroupindex].NAME = parentscope.selgroupobj.NAME;
                        $mdDialog.hide();
                    })
                }
                $scope.cancel = function(){
                    $scope.addmembers = [];
                    $mdDialog.hide();
                }
            }
        });
    }

    $scope.myFunction=function () {
        document.getElementById("myDropdown").classList.toggle("show");
    };
});