var chatList = [];
var cacheObj = null;
xenApp.controller('chatviewController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService){

    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts     = localStorageService.get("user_contacts");
    $scope.seluser      = $stateParams.user;
    $scope.selid        = null;
    $scope.selobj       = getselcontactobj();
    $scope.message      = '';
    $scope.chats        = [];
    $scope.cacheObject  =  cacheObj;

    if($scope.selobj.CONTACT_USER_ID1 == $scope.userdetails.user_id)
        $scope.selid = $scope.selobj.CONTACT_USER_ID2;

    else if($scope.selobj.CONTACT_USER_ID2 == $scope.userdetails.user_id)
        $scope.selid = $scope.selobj.CONTACT_USER_ID1;

    $scope.chatviewinit = function(){
        if ($scope.cacheObject == null || $scope.cacheObject == undefined){
            $scope.cacheObject = $cacheFactory("newCacheInstance");
            cacheObj = $scope.cacheObject;
        }

        getchathistory();
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
                                messages[i].audio, messages[i].video, new Date(messages[i].created_at).getTime());
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
                            messages[i].video, new Date(messages[i].created_at).getTime());
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
        teamrService.acceptContactreq($scope.userdetails.username, $scope.selobj.USERNAME, $scope.selobj.ID, function(response){
            console.log(response);
            $scope.contacts[$scope.selindex].WAITING_APPROVAL = false;
            $scope.contacts[$scope.selindex].incomingreq = false;
            localStorageService.set("user_contacts", $scope.contacts);
            $scope.selobj.WAITING_APPROVAL = false;
            $scope.selobj.incomingreq = false;
            $scope.$apply();
        })
    }

    $scope.$on('updateChat', function (event, obj) {
        console.log(obj);
        var currentdate = new Date();
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        var datetime = currentdate.getHours() + ":" + minutes;

        obj.timestamp = gettime(parseInt(obj.timestamp));

        updatechatui(obj.fromuser, obj.fromuser, obj.message, obj.message_id, "admin-chat", false, obj.delivered, 
            obj.file_transfer, obj.media, obj.audio, obj.video);

        $scope.cacheObject.remove("user_" + obj.from + "_" + $scope.username);

        obj.delivered       = true;
        obj.offline         = false;
        obj.touser          = obj.fromuser;
        obj.fromuser        = $scope.userdetails.username;

        teamrService.sendreqwithcallback("chatack", obj, function(err, data){
            console.log(data);
        });

        $scope.$apply();
    });

    $scope.$on("chatack", function(event, obj){
        for(var i = 0; i < $scope.chats.length; i++){
            if($scope.chats[i].message_id == obj.message_id){
                $scope.chats[i].delivered = true;
                break;
            }
        }

        $scope.$apply();
    });

    $scope.download = function (msg) {
        // commservService.getFileURL(data, function (response) {
        //     var jsonOBJ = JSON.parse(response);
        //     $window.open(jsonOBJ.data, '_blank')
        // })
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
        if($scope.message == '' || $scope.message == undefined)
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
            "timestamp"     : timestamp
        };
        
        updatechatui($scope.userdetails.username, $scope.seluser, $scope.message, chat.message_id, "user-chat", false, false, false, false, false, false);

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

    function updatechatui(from, to, msg, message_id, appendClass, sent, delivered, filetransfer, media, audio, video, timestamp) {
        var datetime = gettime(parseInt(timestamp));
        var params = {
            from: from, "seluser": to, "chatclass": appendClass, "message": msg,
            sent: sent, delivered: delivered, filetransfer: filetransfer,
            media: media, audio: audio, video: video, "time": datetime, "isPlaying": false, 
            message_id:message_id
        };
        appendtochatview(params);
    }

    function appendtochatview(params){
        var usr = $scope.seluser;
        if (!angular.isUndefined(params)) {
            $scope.chats.push(params);
            chatList = $scope.chats;
        }
    }


    function gettime(timestamp) {
        var currentdate = null;
        if (timestamp)
            currentdate = new Date(timestamp);
        else
            currentdate = new Date();
        var minutes = (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes();
        return currentdate.getHours() + ":" + minutes;
    }

    $scope.uploadfile = function () {
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
            var formdata    = new FormData();
            formdata.append('username', $scope.userdetails.username);
            formdata.append('file', fileInput.files[0]);
            formdata.processData = false;
            formdata.contentType = false;
            teamrService.fileupload($scope.userdetails.username, formdata, function(response){    
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
                            "timestamp"     : timestamp
                        };
                        
                        updatechatui($scope.userdetails.username, $scope.seluser, resp.data.id, chat.message_id, "user-chat", 
                            false, false, true, mediaflag, audioflag, videoflag, timestamp);

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