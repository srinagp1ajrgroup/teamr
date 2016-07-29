var chatList = [];
var cacheObj = null;
xenApp.controller('chatviewController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, teamrCache){

    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts     = localStorageService.get("user_contacts");
    $scope.seluser      = $stateParams.user;
    $scope.selid        = null;
    $scope.selobj       = getselcontactobj();
    $scope.message      = '';
    $scope.chatdate     = [];
    $scope.chats        = [];
    $scope.files        = [];
    $scope.cacheObject  =  cacheObj;
    $scope.iscontactblock      = false;
    $scope.progresspercent  = 0;
    $scope.isblock      = false;
    $scope.videosrc     = "";
    $scope.selected     = -1;
    $scope.glued        = true;
    $scope.isTyping     = false;
    $scope.showprogress = false;
    $scope.errormsg     = "";
    $scope.isoutboundcall  = false;
    $scope.isinboundcall   = false;
    var servertime      = 0;
    var timeout;
    var offset = 0;

    if($scope.selobj == null){
        $state.go('home')
        return;
    }

    $scope.chatMessageStatus = true;

    $scope.customFullscreen = $mdMedia('xs') || $mdMedia('sm');
    var video = document.getElementsByTagName("video")[0];

    if($scope.selobj != null && $scope.selobj.CONTACT_USER_ID1 == $scope.userdetails.user_id){
        $scope.selid = $scope.selobj.CONTACT_USER_ID2;
        if($scope.selobj.USERID1_BLOCKING == true)
            $scope.iscontactblock = true;
    }

    else if($scope.selobj != null && $scope.selobj.CONTACT_USER_ID2 == $scope.userdetails.user_id){
        $scope.selid = $scope.selobj.CONTACT_USER_ID1;
        if($scope.selobj.USERID2_BLOCKING == true)
            $scope.iscontactblock = true;
    }

    if($scope.selobj.USERID1_BLOCKING == true || $scope.selobj.USERID2_BLOCKING == true || $scope.selobj.WAITING_APPROVAL == true)
        $scope.isblock = true;

    $scope.chatviewinit = function()
    {
        $scope.topMiddleIndex = 1;
        var scrollmask = document.getElementsByClassName('md-scroll-mask');
        var backdrop = document.getElementsByTagName('md-backdrop');
        angular.element(scrollmask).remove();
        angular.element(backdrop).remove();
        
        if (sessionStorage.getItem($scope.seluser) == null || sessionStorage.getItem($scope.seluser) == '' || sessionStorage.getItem($scope.seluser) == "null")
            $scope.message = '';
        else
            $scope.message = sessionStorage.getItem($scope.seluser);

        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        if ($scope.cacheObject == null || $scope.cacheObject == undefined){
            $scope.cacheObject = $cacheFactory("newCacheInstance");
            cacheObj = $scope.cacheObject;
        }        

        // if(!pullfromcache())
            $scope.getchathistory();
    }

    $scope.getseluser = function($index){
        $scope.selected = $index;
    }

    $scope.acceptcontactreq = function(){
        var status = null;
        if(status == null)
            status = "online"
        teamrService.acceptContactreq($scope.userdetails.username, $scope.selobj.USERNAME, $scope.selobj.ID, status, function(response){
            if(response.success == true){
                $rootScope.$broadcast('acceptcontactrequpdate', response);
                $scope.selobj.WAITING_APPROVAL = false;
                $scope.selobj.PRESENCE = response.status;
                $scope.isblock  = false;
                $scope.$apply();
            }
        });
    }

    $scope.rejectcontactreq = function(){
        obj= {DECLINED: true};
        teamrService.rejectContactreq($scope.userdetails.username, $scope.selobj.USERNAME, $scope.selobj.ID, obj, function(response){
            if(response.success == true){
                $rootScope.$broadcast('acceptcontactrequpdate', response);
                $scope.selobj.WAITING_APPROVAL = false;
                $scope.selobj.PRESENCE = response.status;
                $scope.$apply();
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
        $scope.msg = msg;
        $scope.mdDialogPopup($scope, parentscope, '../../views/playvideo.html', ev);
    }

    function pvController(scope, parentscope){
        videoplayer_init = function(){
            var queryResult = $document[0].getElementById('my_video_1')                        
        }

        teamrService.getfileurl(parentscope.userdetails.username, parentscope.msg, function(response){
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

    $scope.blockcontact = function(ev) {
        $scope.mdDialogPopup($scope, bcController, '../../views/blockcontact.html', ev)        
    };

    function bcController(scope, parentscope)
    {
        scope.bLoading = false;
        scope.blockContact = function(){
            if(parentscope.selobj.CONTACT_USER_ID1 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID1_BLOCKING = true;
                parentscope.selobj.USERID1_BLOCKING = true;
            }

            else if(parentscope.selobj.CONTACT_USER_ID2 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID2_BLOCKING = true;
                parentscope.selobj.USERID2_BLOCKING = true;
            }

            scope.bLoading = true;
            teamrService.blockcontact(parentscope.userdetails.username, parentscope.seluser, parentscope.contacts[parentscope.selindex].ID, parentscope.selobj, function(response){
                $scope.bLoading = false;
                if(response.success == true){
                    $rootScope.$broadcast('blockcontact', response);
                    parentscope.isblock = true;
                    parentscope.iscontactblock = true;
                } 
                $scope.$apply();
                console.log(response);
                $mdDialog.hide();
            }); 
        }

        scope.cancel = function() {
            $mdDialog.hide();
        };
    }

    $scope.unblockcontact = function(ev){
        $scope.mdDialogPopup($scope, ubcController, '../../views/unblockcontact.html', ev)
    }

    function ubcController(scope, parentscope){
        scope.ubLoading = false;
        scope.unblockContact = function(){
            if(parentscope.selobj.CONTACT_USER_ID1 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID1_BLOCKING = false;
                parentscope.selobj.USERID1_BLOCKING = false;
            }
            else if(parentscope.selobj.CONTACT_USER_ID2 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID2_BLOCKING = false;
                parentscope.selobj.USERID2_BLOCKING = false;
            }

            list = [parentscope.selobj.CONTACT_USER_ID1, parentscope.selobj.CONTACT_USER_ID2];
            var data = {obj:parentscope.selobj, list:list};
            scope.ubLoading = true;
            teamrService.unblockcontact(parentscope.userdetails.username, parentscope.seluser, parentscope.contacts[parentscope.selindex].ID, data, function(response){
                scope.ubLoading = false;
                // $scope.$digest();
                if(response.success == true){
                    $rootScope.$broadcast('unblockcontact', response.data);                            
                } 
                scope.$apply();
                console.log(response);
                mdDialog.hide();
            }); 
        }

        scope.cancel = function() {
            $mdDialog.cancel();
        };
    }
    $scope.deletecontact = function(ev){   
        $scope.mdDialogPopup($scope, dcController, '../../views/deletecontact.html', ev);     
    }

    function dcController(scope, parentscope)
    {
        scope.delete = function()
        {
            sessionStorage.removeItem(scope.seluser);
            if(parentscope.selobj.CONTACT_USER_ID1 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID1_REMOVING = true;
                obj = {USERID1_REMOVING: true};
            }

            else if(parentscope.selobj.CONTACT_USER_ID2 == parentscope.userdetails.user_id){
                parentscope.contacts[parentscope.selindex].USERID2_REMOVING = true;
                obj = {USERID2_REMOVING: true};
            }

            teamrService.deletecontact(parentscope.userdetails.username, parentscope.seluser, parentscope.contacts[parentscope.selindex].ID, obj, function(response){
                if(response.success == true){
                    $rootScope.$broadcast('updatecontact', response.data)
                }
            }); 
        }

        scope.cancel = function() {
            $mdDialog.cancel();
        }
    }

    $scope.$on('deletecontact', function(event, contactobj){
        if(contactobj.recid != $scope.selobj.ID){
            $rootScope.$broadcast('deletecontactupdate', contactobj);
        }
        else{
            $rootScope.$broadcast('updatecontact', contactobj);
        }
    });

    $scope.$on('blockcontact', function(event, contactobj){
        $scope.selobj.USERID1_BLOCKING = contactobj.data.obj.USERID1_BLOCKING;
        $scope.selobj.USERID2_BLOCKING = contactobj.data.obj.USERID2_BLOCKING;
        $scope.isblock = true;
        $rootScope.$broadcast('blockcontactupdate', contactobj);
    });
    $scope.$on('unblockcontact', function(event, contactobj){
        $scope.selobj.USERID1_BLOCKING = contactobj.data.obj.USERID1_BLOCKING;
        $scope.selobj.USERID2_BLOCKING = contactobj.data.obj.USERID2_BLOCKING;
        if($scope.selobj.USERID1_BLOCKING == false && $scope.selobj.USERID2_BLOCKING == false){
            $scope.isblock = false;       
            $scope.iscontactblock = false;     
        }

        if(($scope.userdetails.user_id == contactobj.data.obj.CONTACT_USER_ID1 && $scope.selobj.USERID1_BLOCKING == false) || ($scope.userdetails.user_id == contactobj.data.obj.CONTACT_USER_ID2 && $scope.selobj.USERID2_BLOCKING == false))
            $scope.iscontactblock = false;

        $rootScope.$broadcast('blockcontactupdate', contactobj);
    });

    $scope.$on('updateChat', function (event, obj) {
        console.log(obj);
        var currentdate = new Date();
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        var datetime = currentdate.getHours() + ":" + minutes;

        if(obj.fromuser != $scope.seluser){
            updatecache(obj);
            $rootScope.$broadcast('privatechatupdate', obj);
            return;
        }

        updatechatui(obj.fromuser, obj.fromuser, obj.message, obj.message_id, "admin-chat", false, obj.delivered, 
            obj.file_transfer, obj.media, obj.audio, obj.video, obj.timestamp, obj.file_name);

        $scope.cacheObject.remove("user_" + obj.fromuser + "_" + $scope.userdetails.username);

        obj.delivered       = true;
        obj.offline         = false;

        teamrService.sendreqwithcallback("chatack", obj, function(err, data){
            console.log(data);
        });

        $scope.$apply();
    });    

    $scope.$on('updateselpresence', function(event, presenceobj){
        if($scope.selobj.USERNAME == presenceobj.username){
            $scope.selobj.PRESENCE = presenceobj.status;
        }
        $scope.$apply();
    });

    $scope.$on('acceptcontactreq', function(event, contactobj){
        $scope.selobj.WAITING_APPROVAL = contactobj.WAITING_APPROVAL;
        $scope.selobj.PRESENCE = contactobj.status;
        $scope.isblock = false;
        $scope.$apply();
    });

    $scope.$on("chatack", function(event, obj){
        for(var i = 0; i < $scope.chatdate.length; i++){
            var index =  _.findLastIndex($scope.chatdate[i].chats, {
                message_id: obj.message_id
            });
            if(index >= 0)
                $scope.chatdate[i].chats[index].delivered = true;
        }
        $scope.$apply();
    });

    $scope.$on('isTyping', function (event, obj) {
        console.log("isTyping");
        if(obj.username == $scope.seluser){
            $scope.isTyping = true;
            $scope.$apply();
            clearTimeout(timeout);
            timeout = setTimeout(function(){
                $scope.isTyping = false;
                $scope.$apply();
            }, 2000);
        }
    });

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

    $scope.notifyTyping = function(){
        if($scope.message == '' || $scope.message == undefined || $scope.isblock == true)
            return;
        
        teamrService.notifyuser($scope.userdetails.username, $scope.seluser, function(response){
        })
    }

    $scope.sendmessage = function ($event) {       
        console.log(window.navigator.onLine)
        if ($event.keyCode === 13 && !$event.shiftKey && window.navigator.onLine == true) {
            submitmessage();
            $event.preventDefault();
        }
        else if($scope.message.length > 2000){
            document.getElementById('chat_msg').maxLength = 2000;
            return false;
        }
    }

    $scope.sendMessageOnSubmit = function(){
        submitmessage();
    }

    function urlify(text) {
        var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return text.replace(urlRegex, function(url,b,c) {
            var url2 = (c == 'www.') ?  'http://' +url : url;
            return '<a href="' +url2+ '" target="_blank">' + url + '</a>';
        }) 
    }

    function submitmessage() {        

        if($scope.message == '' || $scope.message == undefined || $scope.isblock == true)
            return;
        
        $scope.time = gettime();    
        $scope.$broadcast('scrollToBottom', {})
        var timestamp = teamrService.getservertime();

        var msg = urlify($scope.message);

        console.log(timestamp);
        
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
        
        updatechatui($scope.userdetails.username, $scope.seluser, $scope.message, chat.message_id, "user-chat", false, false, false, false, false, false, timestamp, null);

        teamrService.sendmessage(chat, function(ackData){
            if(ackData.success == true){
                var dateindex =  _.findLastIndex($scope.chatdate, {
                    date:"Today"
                });

               var index =  _.findLastIndex($scope.chatdate[dateindex].chats, {
                    message_id: ackData.data.message_id
                });
               $scope.chatdate[dateindex].chats[index].sent = true;
                $scope.$apply();
            }
        });
        $scope.message='';
        $scope.cacheObject.remove("user_" + $scope.seluser + "_" + $scope.userdetails.username);
    }

    function updatechatui(from, to, msg, message_id, appendClass, sent, delivered, filetransfer, media, audio, video, timestamp, filename, id, fromuserid) {
        var time   = gettime(parseInt(timestamp));
        // var date   = getFormattedDate(timestamp)
        var params = {
            from: from, "seluser": to, "chatclass": appendClass, "message": msg,
            sent: sent, delivered: delivered, filetransfer: filetransfer,
            media: media, audio: audio, video: video, "time": time, "isPlaying": false, 
            message_id:message_id, filename:filename, timestamp:timestamp, id:id, fromuserid:fromuserid
        };
        if(filename != null){
            var str = filename.lastIndexOf(".");
            params.ext = filename.substr(str + 1, filename.length)
        }

        appendtochatview(params, timestamp);
    }

    function today_yesterday(timestamp) {
        var chtMsgDate_days = Math.floor(timestamp / (24*60*60*1000));
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

    function appendtochatview(params, timestamp) {
        var date = today_yesterday(timestamp);
        var usr = $scope.seluser;
        if (!angular.isUndefined(params)) {
            var filter = false;
            var i = 0;

            for(i = 0; i < $scope.chatdate.length; i++){
                if($scope.chatdate[i].date == date){
                    filter = true;
                    break;
                }
            }
            if(filter == false){
                var formattedDate = today_yesterday(timestamp);
                $scope.chatdate.push({ date: formattedDate, chats: [params], timestamp: timestamp });
            }
            else
                $scope.chatdate[i].chats.push(params);
        }
        teamrCache.put($scope.seluser, $scope.chatdate);
    }


    function gettime(timestamp) {
        var currentdate = null;
        if(timestamp == null)
            return;

        currentdate = new Date(timestamp);

        var hours   = currentdate.getHours();
        var ampm    = hours >= 12 ? 'pm' : 'am';
        hours       = hours % 12;
        hours       = hours ? hours : 12;
    if(hours < 10)
       hours = "0"+hours;   
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        return hours + ":" + minutes+ ' ' + ampm;
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

    $scope.uploadfile = function () {
        if($scope.isblock == true)
            return;
        $scope.audioProgress = {};
        $scope.videoProgress = {};
        $scope.duration = {};
        $scope.videoduration = {};        
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
            $scope.showprogress = true;
            $scope.$digest();
            var ret = teamrService.fileupload($scope.userdetails.username, fileInput.files[0], function(response){
                var audioflag = false;
                var mediaflag = false;
                var videoflag = false;
                document.getElementById('choose').value = '';            
                $scope.showprogress = false;
                $scope.$digest();
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

                        
                        var str = filename.lastIndexOf(".");
                        chat.ext = filename.substr(str + 1, filename.length)
                        if(chat.ext == 'jpg' || chat.ext == 'png' || chat.ext == 'jpeg' || chat.ext == 'gif')
                            chat.media = true;
                        chat.time = gettime(timestamp);
                        chat.date = today_yesterday(timestamp);
                        chat.created_by = $scope.userdetails.username
                        $scope.files.push(chat);


                        
                        updatechatui($scope.userdetails.username, $scope.seluser, resp.data.id, chat.message_id, "user-chat", 
                            false, false, true, mediaflag, audioflag, videoflag, timestamp, filename);

                        teamrService.sendmessage(chat, function(ackData){
                            if(ackData.success == true){
                                for(var i = 0; i < $scope.chatdate.length; i++){
                                    for(var j = 0; j < $scope.chatdate[i].chats.length; j++){
                                        if($scope.chatdate[i].chats[j].message_id == ackData.data.message_id){
                                            $scope.chatdate[i].chats[j].delivered = true;
                                            break;
                                        }
                                    }            
                                }
                                $scope.$apply();
                            }
                        });
                    }
                    else{
                        // $scope.errormsg = "No Internet Connection"
                        $scope.errorpopup("No Internet Connection");
                    }
                }
                else {
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
        }, false)
    }

    $scope.cancelxmlreq = function(){
        teamrService.cancelxmlreq(function(){
            $scope.progresspercent = 0;
            $scope.showprogress = false;
        });
    }

    $scope.getchathistory = function () {
        if($rootScope.netConnectionStat == false){
            $scope.errorpopup("No Internet Connection")
            return;
        }
        $scope.showSpinner = true;
        teamrService.getchathistory($scope.userdetails.username, $scope.userdetails.user_id, $scope.selid, offset,
            function (response) 
            {
                $scope.showSpinner = false;
                if(response.success == true){
                    var resp = JSON.parse(response.data);
                    var messages = resp.data;
                    if (messages.length == 0 || messages.length < 30)
                        $scope.chatMessageStatus = false;

                    console.log(messages);

                    for(var i = 0; i < messages.length; i++)
                    {
                        var msgid         =   messages[i].message_id.replace( /^\D+/g, '')
                        var timestamp     =   parseFloat(msgid);
                        if(timestamp == 0){
                            timestamp = new Date(messages[i].created_at).getTime();
                        }
                        if (messages[i].from_user_id == $scope.userdetails.user_id) {
                            updatechatui($scope.userdetails.username, $scope.seluser, messages[i].message, messages[i].message_id, 
                                "user-chat", messages[i].sent, messages[i].delivered, messages[i].file_transfer, messages[i].media, 
                                messages[i].audio, messages[i].video, timestamp, messages[i].file_name, messages[i].id, messages[i].from_user_id);
                        }
                        else{
                            if(messages[i].offline == true || messages[i].delivered == false){
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
                            messages[i].video, timestamp, messages[i].file_name, messages[i].id, messages[i].from_user_id);
                        } 
                    }

                    $scope.$apply();
                }
        })
        offset += 30;
        var requestfiles = {from:$scope.userdetails.user_id,to:$scope.selid}
        teamrService.getsharedfiles($scope.userdetails.username, $scope.selid, function (response) {
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

                teamrCache.put($scope.seluser + 'files', $scope.files)                
            }
        })
    }

    function getselcontactobj(){
        if($scope.contacts == null)
            return;
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == $scope.seluser){
                $scope.selindex = i;
                $scope.contacts[i].nCount = 0;
                localStorageService.set("user_contacts", $scope.contacts);
                $rootScope.$broadcast('updatechatcount', i);
                return $scope.contacts[i];
            }
        }
    }

    $scope.focusChatBox = function () {
        // angular.element(document.querySelector("#chat_msg")).focus();
    }

    $scope.sessionStorageMessage = function () {
        sessionStorage.setItem($scope.seluser, $scope.message);
    }
    
    $scope.readfile = function(file){
        if(file.audio == true)
            $scope.audioplayer(file.message, event)
        else if(file.video == true)
            $scope.videplayer(file.message, event)
        else
            $scope.download(file.message)
    }

    $scope.createteam = function(ev){
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/addmembers.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
            },
            controller:function($scope, parentscope){
                $scope.addmembers           = [];
                $scope.updatedcontacts      = localStorageService.get('user_contacts');
                $scope.isSending = false;
                $scope.groupname = '';

                $scope.addmembers.push({admin:true, user_id:parentscope.userdetails.user_id, username:parentscope.userdetails.username, exit:false, is_delete:false})
                $scope.addmembers.push({admin:true, user_id:parentscope.selid, username:parentscope.selobj.USERNAME, exit:false, is_delete:false})
                $scope.groupname = parentscope.userdetails.username+','+parentscope.selobj.USERNAME+',';

                $scope.cancel = function(){
                    $scope.addmembers = [];
                    $mdDialog.hide();
                }

                $scope.addmembertogroup = function(contact){
                    var ismember = _.where($scope.addmembers, {username:contact.USERNAME})
                    if(ismember.length == 0){
                        if(contact.CONTACT_USER_ID1 == parentscope.userdetails.user_id)
                            $scope.addmembers.push({admin:true, user_id:contact.CONTACT_USER_ID2, username:contact.USERNAME, exit:false, is_delete:false}) 

                        else if(contact.CONTACT_USER_ID2 == parentscope.userdetails.user_id)
                            $scope.addmembers.push({admin:true, user_id:contact.CONTACT_USER_ID1, username:contact.USERNAME, exit:false, is_delete:false})

                        parentscope.teamname = $scope.groupname += contact.USERNAME;
                    }
                }
                $scope.removemember = function($index){
                    $scope.addmembers.splice($index, 1);
                }
                $scope.add = function(){
                    parentscope.addmembers = $scope.addmembers;
                    parentscope.mergechat(ev);
                }
            }
        });
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

                    if(parentscope.addmembers.length > 3){
                        suggestgroupname(ev)
                    }else{
                        var msg = undefined;
                        if(parentscope.chatdate[0].length > 0)
                            var msg = parentscope.chatdate[0].chats[0]
                        teamrService.createdirectteam(parentscope.teamname, parentscope.addmembers, msg, function(response){
                            // $rootScope.$broadcast("updategroup", response);
                            $mdDialog.hide();
                        })
                    }

                    // _.filter(parentscope.chatdate, function(data){
                    //     if(data.timestamp > timestamp){
                    //         copymsg = data.chats.concat(copymsg);
                    //         console.log(copymsg)
                    //     }

                    //     teamrService.createteam(parentscope.teamname, parentscope.addmembers, copymsg, function(response){
                    //         console.log(response);
                    //     })
                    // })
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
                    var msg = parentscope.chatdate[0].chats[0]
                    $scope.teamname  = document.getElementById('team_name').value;
                    if($scope.teamname != '')
                        parentscope.teamname = $scope.teamname;

                    $scope.cgLoading = true;
                    teamrService.createdirectteam(parentscope.teamname, parentscope.addmembers, msg, function(response){
                        $scope.cgLoading = false;
                        $scope.$digest();
                        $rootScope.$broadcast("updategroup", response);
                        console.log(response);
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

    $scope.closeFunction=function () {
        document.getElementById("closeDropdown").classList.toggle("open");
    };

    function updatecache(obj){
        var cache = teamrCache.get(obj.fromuser);
        console.log(cache)
        if(cache.length > 0){
            var index =  _.findLastIndex(cache, {
                date: 'Today'
            });

            var params = {
                from: obj.fromuser, "seluser": obj.fromuser, "chatclass": "admin-chat", "message": obj.message,
                sent: obj.sent, delivered: obj.delivered, filetransfer: obj.file_transfer,
                media: obj.media, audio: obj.audio, video: obj.video, "time": gettime(parseInt(obj.timestamp)), 
                "isPlaying": false, message_id:obj.message_id, filename:obj.file_name, timestamp:obj.timestamp, 
                id:obj.id, fromuserid:obj.fromuserid
            };
            cache[index].chats.push(params);
            teamrCache.put(obj.fromuser, cache);
        }
    }

    function pullfromcache()
    {
        var msgcache    = teamrCache.get($scope.seluser);
        var filescache  = teamrCache.get($scope.seluser + 'files')
        if (msgcache) 
        {
            $scope.chatdate = msgcache;
            if (filescache)
                $scope.files = filescache;

            for(var i = 0; i < $scope.chatdate.length; i++){
                _.each($scope.chatdate[i].chats, function(data){
                    if(!data.delivered){
                        data.delivered    = true;
                        data.offline      = false;
                        data.to           = data.seluser;

                        teamrService.sendreqwithcallback("chatack", data, function(err, data){
                            console.log(data);
                        });
                    }

                })                
            }

            return true;
       }

       return false;
    }

    /***********************************************Audio Call*************************************************************/

    $scope.outboundvoicecall = function(){
        $scope.isoutboundcall = true;
        var remoteaudio = document.getElementById('audio_remote');
        teamrService.outboundcall(remoteaudio, "4692568482");
    }    

    $scope.acceptcall = function(){
        // alert("accept");
    }

    $scope.rejectcall = function(){
        // alert("reject");
    }

    /***********************************************Audio Call*************************************************************/
    
});