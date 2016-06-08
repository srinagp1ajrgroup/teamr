var chatList = [];
var cacheObj = null;
xenApp.controller('chatviewController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia){

    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts     = localStorageService.get("user_contacts");
    $scope.seluser      = $stateParams.user;
    $scope.selid        = null;
    $scope.selobj       = getselcontactobj();
    $scope.message      = '';
    $scope.chatdate     = [];
    $scope.chats        = [];
    $scope.cacheObject  =  cacheObj;
    $scope.isblock      = false;
    $scope.videosrc     = "";
    $scope.selected     = -1;
    $scope.isTyping     = false;
    var prevdate        = '';
    var today           = '';
    var timeout;


        $scope.todos = [
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
      {
        
        what: 'Brunch this weekend?',
        who: 'Min Li Chan',
        when: '3:08PM',
        notes: " I'll be in your neighborhood doing errands"
      },
    ];

    $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
    var video = document.getElementsByTagName("video")[0];

    if($scope.selobj.CONTACT_USER_ID1 == $scope.userdetails.user_id)
        $scope.selid = $scope.selobj.CONTACT_USER_ID2;

    else if($scope.selobj.CONTACT_USER_ID2 == $scope.userdetails.user_id)
        $scope.selid = $scope.selobj.CONTACT_USER_ID1;

    if($scope.selobj.USERID1_BLOCKING == true)
        $scope.isblock = true;
    else if($scope.selobj.USERID2_BLOCKING == true)
        $scope.isblock = true;

    $scope.chatviewinit = function(){
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        if ($scope.cacheObject == null || $scope.cacheObject == undefined){
            $scope.cacheObject = $cacheFactory("newCacheInstance");
            cacheObj = $scope.cacheObject;
        }

        today = getdate();
        getchathistory();
    }

    $scope.getseluser = function($index){
        $scope.selected = $index;
    }

    function getchathistory(){
        teamrService.getchathistory ($scope.userdetails.username, $scope.userdetails.user_id, $scope.selid, 
            function(response){
                if(response.success == true){
                    var resp = JSON.parse(response.data);
                    var messages = resp.data;
                    console.log(messages);
                    messages.sort(function (a, b) {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    });

                    for(var i = 0; i < messages.length; i++){
                        if (messages[i].from_user_id == $scope.userdetails.user_id) {
                            updatechatui($scope.userdetails.username, $scope.seluser, messages[i].message, messages[i].message_id, 
                                "user-chat", messages[i].sent, messages[i].delivered, messages[i].file_transfer, messages[i].media, 
                                messages[i].audio, messages[i].video, new Date(messages[i].created_at).getTime(), messages[i].file_name);
                        }
                        else{
                            if(messages[i].offline == true){
                                messages[i].delivered       = true;
                                messages[i].offline         = false;
                                messages[i].touser          = $scope.userdetails.username;
                                messages[i].fromuser        = $scope.seluser;
                                teamrService.sendreqwithcallback("chatack", messages[i], function(err, data){
                                    console.log(data);
                                });
                            }
                            updatechatui($scope.seluser, $scope.seluser, messages[i].message, messages[i].message_id, 
                            "admin-chat", false, false  , messages[i].file_transfer, messages[i].media, messages[i].audio, 
                            messages[i].video, new Date(messages[i].created_at).getTime(), messages[i].file_name);
                        }   
                    }

                    $scope.$apply();
                }
        })
    }

    function getselcontactobj(){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == $scope.seluser){
                $scope.selindex = i;
                return $scope.contacts[i];
            }
        }
    }

    $scope.acceptcontactreq = function(){
        // var userstatus = document.getElementById("userstatus");
        var status = null;
        if(status == null)
            status = "online"
        teamrService.acceptContactreq($scope.userdetails.username, $scope.selobj.USERNAME, $scope.selobj.ID, status, function(response){
            $rootScope.$broadcast('acceptcontactreq');
        });
    }

    $scope.playvideo = function(msg, ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;        
        $mdDialog.show({            
            templateUrl: '../../views/playvideo.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: useFullScreen,
            preserveScope:true,
            controller:function(){
                console.log(msg);
                teamrService.getfileurl($scope.userdetails.username, msg, function(response){
                    if(response.success == true){
                        var resp = JSON.parse(response.data);
                        if(resp.status == "redirect"){
                            console.log(resp.data)
                            var vid = document.getElementById("myVideo")
                            $scope.videosrc = resp.data;
                            $scope.$apply();
                            // vid.play();
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

    $scope.blockcontact = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            controller:'chatviewController',
            templateUrl: '../../views/blockcontact.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: useFullScreen
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

    $scope.answer = function(answer) {
        var obj = {};
        if(answer == 'block'){
            if($scope.selobj.CONTACT_USER_ID1 == $scope.userdetails.user_id){
                $scope.contacts[$scope.selindex].USERID1_BLOCKING = true;
                obj= {USERID1_BLOCKING: true};
            }

            else if($scope.selobj.CONTACT_USER_ID2 == $scope.userdetails.user_id){
                $scope.contacts[$scope.selindex].USERID2_BLOCKING = true;
                obj= {USERID2_BLOCKING: true};
            }

            teamrService.blockcontact($scope.userdetails.username, $scope.seluser, $scope.contacts[$scope.selindex].ID, obj, function(response){
                if(response.success == true){
                    $rootScope.$broadcast('blockcontact', response.data)
                } 
                $scope.$apply();               
                console.log(response);
            }); 
        }
        else if(answer == 'delete'){
            if($scope.selobj.CONTACT_USER_ID1 == $scope.userdetails.user_id){
                $scope.contacts[$scope.selindex].USERID1_REMOVING = true;
                obj= {USERID1_REMOVING: true};
            }

            else if($scope.selobj.CONTACT_USER_ID2 == $scope.userdetails.user_id){
                $scope.contacts[$scope.selindex].USERID2_REMOVING = true;
                obj= {USERID2_REMOVING: true};
            }

            teamrService.deletecontact($scope.userdetails.username, $scope.seluser, $scope.contacts[$scope.selindex].ID, obj, function(response){
                if(response.success == true){
                    $rootScope.$broadcast('deletecontact', response.data)
                } 
                $scope.$apply();
                $state.go('home.chat')     
                console.log(response);
            }); 
        }
        $mdDialog.hide(answer);
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.deletecontact = function(ev){   
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            controller:'chatviewController',
            templateUrl: '../../views/deletecontact.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: useFullScreen
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
    }

    $scope.$on('updateChat', function (event, obj) {
        console.log(obj);
        var currentdate = new Date();
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        var datetime = currentdate.getHours() + ":" + minutes;

        obj.timestamp = gettime(parseInt(obj.timestamp));

        updatechatui(obj.fromuser, obj.fromuser, obj.message, obj.message_id, "admin-chat", false, obj.delivered, 
            obj.file_transfer, obj.media, obj.audio, obj.video, obj.file_name);

        $scope.cacheObject.remove("user_" + obj.fromuser + "_" + $scope.userdetails.username);

        obj.delivered       = true;
        obj.offline         = false;
        // obj.touser          = obj.fromuser;
        // obj.fromuser        = $scope.userdetails.username;

        teamrService.sendreqwithcallback("chatack", obj, function(err, data){
            console.log(data);
        });

        $scope.$apply();
    });    

    // $scope.$on('acceptcontactreq', function(event, contactobj){
    //     $scope.contacts = localStorageService.get('user_contacts')
    //     $scope.selobj.WAITING_APPROVAL = contactobj.WAITING_APPROVAL;
    //     $scope.selobj.PRESENCE = contactobj.status;
    //     $scope.$apply();
    // });

    $scope.$on("chatack", function(event, obj){
        for(var i = 0; i < $scope.chats.length; i++){
            if($scope.chats[i].message_id == obj.message_id){
                $scope.chats[i].delivered = true;
                break;
            }
        }

        $scope.$apply();
    });

    $scope.$on('isTyping', function (event, obj) {
        console.log("isTyping");

        $scope.isTyping = true;
        $scope.$apply();

        clearTimeout(timeout);

        timeout = setTimeout(function(){             
            $scope.isTyping = false;
            $scope.$apply();
        }, 3000);        
    });

    $scope.download = function (msg) {
        teamrService.getfileurl($scope.userdetails.username, msg, function(response){
            console.log(response);
            if(response.success == true){
                var resp = JSON.parse(response.data);
                if(resp.status == "redirect"){
                   // $window.open(resp.data, '_blank'); 
                   var a = document.createElement( "a" );
                   document.body.appendChild( a );
                   a.style = "display: none";
                   a.href = resp.data;
                   a.download = "fileName";
                   a.click();
                }
            }
        });
    }

    $scope.notifyTyping = function(){
        if($scope.message == '' || $scope.message == undefined || $scope.isblock == true)
            return;
        
        teamrService.notifyuser($scope.userdetails.username, $scope.seluser, function(response){
        })
    }

    $scope.sendmessage = function ($event) {
        if ($event.keyCode === 13) {
            submitmessage();
        }
    }

    $scope.sendMessageOnSubmit = function(){
        submitmessage();
    }

    function displayNotify(){

    }

    function submitmessage(){
        if($scope.message == '' || $scope.message == undefined || $scope.isblock == true)
            return;

        $scope.time = gettime();
        var timestamp = new Date().getTime()

        var chat = {
            "from_user_id"  : $scope.userdetails.user_id,
            "to_user_id"    : $scope.selid,
            "touser"        : $scope.seluser,
            "fromuser"      : $scope.userdetails.username,
            "video"         : false,
            "audio"         : false,
            "file_transfer" : false, 
            "media"         : false,
            "message_id"    : $scope.userdetails.username+$scope.seluser+timestamp, 
            "sent"          : false,
            "delivered"     : false,
            "read"          : false,
            "offline"       : false,
            "message"       : $scope.message,
            "type"          : "chat",
            "timestamp"     : timestamp,
            "file_name"     : null
        };
        
        updatechatui($scope.userdetails.username, $scope.seluser, $scope.message, chat.message_id, "user-chat", false, false, false, false, false, false, null);

        teamrService.sendmessage(chat, function(ackData){
            if(ackData.success == true){
                for(var i = 0; i < $scope.chats.length; i++){
                    if($scope.chats[i].message_id == ackData.data.message_id){
                        $scope.chats[i].sent = true;
                        break;
                    }
                }

                $scope.$apply();
            }
        });
        $scope.message='';
        $scope.cacheObject.remove("user_" + $scope.seluser + "_" + $scope.userdetails.username);
    }

    function updatechatui(from, to, msg, message_id, appendClass, sent, delivered, filetransfer, media, audio, video, timestamp, filename) {
        var time   = gettime(parseInt(timestamp));
        var date   = getdate(timestamp)
        var params = {
            from: from, "seluser": to, "chatclass": appendClass, "message": msg,
            sent: sent, delivered: delivered, filetransfer: filetransfer,
            media: media, audio: audio, video: video, "time": time, "isPlaying": false, 
            message_id:message_id, filename:filename
        };
        if(prevdate == '')
            prevdate = date;
        appendtochatview(params, date);
    }

    function appendtochatview(params, date){        
        var usr = $scope.seluser;
        if (!angular.isUndefined(params)) {
            $scope.chats.push(params);
            if(prevdate != date){
                prevdate = date;
                $scope.chatdate.push({date:date, chats:$scope.chats})
                $scope.chats = [];
            }
            else if(date == today && ($scope.chatdate.length == 0 || $scope.chatdate[$scope.chatdate.length-1].date != today)){
                $scope.chatdate.push({date:date, chats:$scope.chats})
            }
        }        
    }


    function gettime(timestamp) {
        var currentdate = null;
        if (timestamp)
            currentdate = new Date(timestamp);
        else
            currentdate = new Date();

        var hours   = currentdate.getHours();
        var ampm    = hours >= 12 ? 'pm' : 'am';
        hours       = hours % 12;
        hours       = hours ? hours : 12;
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        return hours + ":" + minutes+ ' ' + ampm;
    }

    function getdate(timestamp) {
        var currentdate = null;
        if (timestamp)
            currentdate = new Date(timestamp);
        else
            currentdate = new Date();
        return currentdate.getDate()+"/"+currentdate.getMonth()+"/"+currentdate.getFullYear();
    }

    $scope.uploadfile = function () {
        if($scope.isblock == true)
            return;

        $scope.audioProgress = {};
        $scope.videoProgress = {};
        $scope.duration = {};
        $scope.videoduration = {};
        var audioflag = false;
        var mediaflag = false;
        var videoflag = false;
        // $("#choose").click();
        document.getElementById("choose").click();
        document.getElementById("choose").addEventListener('change', function(){

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

                        var timestamp = new Date().getTime()

                        var chat = {
                            "from_user_id"  : $scope.userdetails.user_id,
                            "to_user_id"    : $scope.selid,
                            "touser"        : $scope.seluser,
                            "fromuser"      : $scope.userdetails.username,
                            "video"         : videoflag,
                            "audio"         : audioflag,
                            "file_transfer" : true, 
                            "media"         : mediaflag,
                            "message_id"    : $scope.userdetails.username+$scope.seluser+timestamp, 
                            "sent"          : false,
                            "delivered"     : false,
                            "read"          : false,
                            "offline"       : false,
                            "message"       : resp.data.id,
                            "type"          : "chat",
                            "timestamp"     : timestamp,
                            "file_name"     : filename
                        };
                        
                        updatechatui($scope.userdetails.username, $scope.seluser, resp.data.id, chat.message_id, "user-chat", 
                            false, false, true, mediaflag, audioflag, videoflag, timestamp, filename);

                        teamrService.sendmessage(chat, function(ackData){
                            if(ackData.success == true){
                                for(var i = 0; i < $scope.chats.length; i++){
                                    if($scope.chats[i].message_id == ackData.data.message_id){
                                        $scope.chats[i].sent = true;
                                        break;
                                    }
                                }

                                $scope.$apply();
                            }
                        });
                    }
                }
            });
            document.getElementById('choose').value = '';
        }, false)
    }
});