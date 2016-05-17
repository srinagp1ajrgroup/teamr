var chatList = [];
var cacheObj = null;
xenApp.controller('chatviewController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService){

    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts     = localStorageService.get("user_contacts");
    $scope.seluser      = $stateParams.user;
    $scope.selobj       = getselcontactobj();
    $scope.message      = '';
    $scope.chats        = [];
    $scope.cacheObject  =  cacheObj;

    $scope.chatviewinit = function(){
        if ($scope.cacheObject == null || $scope.cacheObject == undefined){
            $scope.cacheObject = $cacheFactory("newCacheInstance");
            cacheObj = $scope.cacheObject;
        }

        getchathistory();
    }

    function getchathistory(){
        teamrService.getchathistory ($scope.userdetails.username, $scope.userdetails.user_id, $scope.selobj.ID, 
            function(req, res){
            console.log("getchathistory");
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

        updatechatui(obj.fromuser, obj.fromuser, obj.message, "admin-chat", false, obj.isdelivered, 
            obj.isfiletransfer, obj.ismedia, obj.isaudio, obj.isvideo);

        $scope.cacheObject.remove("user_" + obj.from + "_" + $scope.username);

        obj.isdelivered     = true;
        obj.touser          = obj.fromuser;
        obj.fromUser        = $scope.userdetails.username;
        obj.type            = "ack";

        $scope.$apply();
    });

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

        var chat = {
            "from_user_id"  : $scope.userdetails.user_id,
            "to_user_id"    : $scope.selobj.ID,
            "touser"        : $scope.seluser,
            "fromuser"      : $scope.userdetails.username,
            "isvideo"       : false,
            "isaudio"       : false,
            "isfiletransfer": false, 
            "ismedia"       : false,
            "messageid"     : $scope.userdetails.username+$scope.seluser+new Date().getTime(), 
            "issent"        : false,
            "isdelivered"   : false,
            "isread"        : false,
            "isoffline"     : false,
            "message"       : $scope.message,
            "type"          : "chat",
            "timestamp"     : new Date().getTime()
        };
        
        updatechatui($scope.userdetails.username, $scope.seluser, $scope.message, "user-chat", false, false, false, false, false, false);

        teamrService.sendmessage(chat, function(ackData){
            if(ackData.success == true){
                for(var i = 0; i < $scope.chats.length; i++){
                    if($scope.chats[i].messageid == ackData.data.messageid){
                        $scope.chats[i].issent = true;
                        break;
                    }
                }

                $scope.$apply();
            }
        });
        $scope.message='';
        $scope.cacheObject.remove("user_" + $scope.seluser + "_" + $scope.userdetails.username);
    }

    function updatechatui(from, to, msg, appendClass, isSent, isRecieved, isFiletransfer, isMedia, isAudio, isVideo, timestamp) {
        var datetime = gettime(parseInt(timestamp));
        var params = {
            from: from, "seluser": to, "chatclass": appendClass, "message": msg,
            issent: isSent, issecieved: isRecieved, isfiletransfer: isFiletransfer,
            ismedia: isMedia, isaudio: isAudio, isvideo: isVideo, "time": datetime, "isPlaying": false
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
});