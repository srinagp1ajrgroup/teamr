xenApp.controller('groupchatController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, $mdToast){
    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.selgroup     = $stateParams.group;
    $scope.selgroupobj  = {};
    $scope.selgroupindex= -1;
    $scope.groups       = localStorageService.get("user_groups");
    $scope.contacts1     = localStorageService.get("user_contacts");
    $scope.groupmembers = [];
    $scope.groupdetails = {};
    $scope.message      = '';
    $scope.groupchats   =  [];
    $scope.mdToast      = $mdToast
    $scope.alert        = "";

    $scope.groupchatinit = function(){
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        
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

        getgrouphistory();
    }

    var getgrouphistory = function(){
        teamrService.getgrouphistory($scope.userdetails.username, $scope.selgroupobj.GROUP_ID, function(response){
            if(response.success == true){
                var resp = JSON.parse(response.data);
                if(resp.status == "success"){
                    $scope.groupchats = resp.data;
                    $scope.$apply();
                }
            }
        });
    }


    var getgroupmemebers = function(){
        teamrService.getgroupmemebers($scope.userdetails.username, $scope.selgroupobj.GROUP_ID, function(response){
            console.log(response);
            if(response.success == true){
                $scope.groupmembers = response.data; 
                $scope.$apply();
            } 
        })
    }

    $scope.$on('groupchat', function(event, obj){
        console.log(obj);        
        appendtochatview(obj);
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
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/addmembers.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                selgroup:$scope.selgroup,
                parentscope:$scope
             },
            controller:function($scope, selgroup, parentscope){
                $scope.parentscope  = parentscope;
                $scope.contacts1    = localStorageService.get('user_contacts');
                $scope.selgroup     = selgroup;
                $scope.addmembers   = [];                

                $scope.cancel = function(){
                    $scope.addmembers = [];
                    $mdDialog.hide();
                }

                contactexistingroup();
                $scope.addmembertogroup = function(contact){
                    var yes = false;
                    for(var i = 0 ; i < $scope.addmembers.length; i++){
                        if($scope.addmembers[i].username == contact.USERNAME){
                            yes = true;
                            break;
                        }
                    }
                    if(yes == false){
                        if(contact.CONTACT_USER_ID1 == $scope.parentscope.userdetails.user_id)
                            $scope.addmembers.push({admin:false, user_id:contact.CONTACT_USER_ID2, username:contact.USERNAME, exit:false, is_delete:false}) 

                        else if(contact.CONTACT_USER_ID2 == $scope.parentscope.userdetails.user_id)
                            $scope.addmembers.push({admin:false, user_id:contact.CONTACT_USER_ID1, username:contact.USERNAME, exit:false, is_delete:false})
                    }
                }

                $scope.removemember = function($index){
                    $scope.addmembers.splice($index, 1);
                }

                $scope.add = function(){
                    teamrService.addmemberstogroup($scope.parentscope.userdetails.username, $scope.parentscope.selgroupobj.GROUP_ID, 
                        $scope.parentscope.selgroupobj.NAME, $scope.addmembers, function(response){
                            console.log(response);
                            if(response.success == true){
                                var resp = JSON.parse(response.data)
                                if(resp.status == "success"){
                                    for(var i = 0; i < $scope.addmembers.length; i++){
                                        var member = {USERNAME:$scope.addmembers[i].username}
                                        $scope.parentscope.groupmembers.push(member);
                                        $mdDialog.hide();
                                    }                                    
                                }
                            }
                            else if(response.success == false){
                                parentscope.alert = response.data;
                                parentscope.mdToast.show({hideDelay:10000, position:'bottom right', templateUrl:'views/alert.html'});
                                $mdDialog.hide();
                            }
                    });
                }

                function contactexistingroup(){
                    for(var i = 0; i < parentscope.groupmembers.length; i++){
                        for(var j = 0; j < $scope.contacts1.length; j++){
                            if($scope.contacts1[j].USERNAME == parentscope.groupmembers[i].USERNAME)
                                $scope.contacts1[j].existingroup = true;
                        }
                    }
                }
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
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/deletemembers.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                items: $scope.contacts,
                selgroup:$scope.selgroup,
                parentscope:$scope
             },
            controller:function($scope, items, selgroup, parentscope, $mdToast){
                $scope.username = parentscope.userdetails.username;
                $scope.selgroup = parentscope.selgroup;
                $scope.groupmembers = parentscope.groupmembers;
                $scope.delmem = [];
                $scope.alert = '';

                $scope.addmemtoqueue = function($index){
                    console.log($scope.groupmembers[$index]);
                    $scope.groupmembers[$index].IS_DELETE = true;
                    $scope.delmem.push($scope.groupmembers[$index]);
                    $scope.groupmembers.splice($index, 1);
                }
                $scope.deletemembers = function(){
                    teamrService.delmembersfromgroup($scope.username, parentscope.selgroupobj.GROUP_ID, $scope.delmem,
                        function(response){
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
                            // $scope.alert = response.data;
                            // $mdToast.show({hideDelay:10000, position:'bottom right', templateUrl:'views/alert.html'});
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

    $scope.$on('addmemberstogroup', function(event, data){
        if(data.groupid == $scope.selgroupobj.GROUP_ID){
            for(var i = 0; i < data.list.length; i++){
                var obj = {ADMIN:data.list[i].admin, EXIT:data.list[i].exit, GROUP_ID:data.groupid, ID:data.list[i].id,
                IS_DELETE:data.list[i].is_delete, USERNAME:data.list[i].username, USER_ID:data.list[i].user_id}
                $scope.groupmembers.push(obj);
            }
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
        $scope.$apply();
    })

    $scope.exitgroup = function(ev){
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            templateUrl: '../../views/exitgroup.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
             },
            controller:function($scope, parentscope){
                $scope.selgroup = parentscope.selgroup;
                $scope.cancel = function(){           
                    $mdDialog.hide();
                }
                $scope.exit = function(){
                    var list = [];
                    for(var i = 0 ; i < parentscope.groupmembers.length; i++){
                        if(parentscope.groupmembers[i].USERNAME == parentscope.userdetails.username){
                            parentscope.groupmembers[i].EXIT = true;
                            list.push(parentscope.groupmembers[i]);
                            break;
                        }
                    }
                    teamrService.exitgroup(parentscope.userdetails.username, parentscope.selgroupobj.GROUP_ID, list, function(response){
                        console.log(response);
                        if(response.success == true){
                            var usergroups = localStorageService.get('user_groups');
                            usergroups.splice(parentscope.selgroupindex, 1);
                            localStorageService.set('user_groups', usergroups);
                            $rootScope.$broadcast('updategroup');
                        }

                        $mdDialog.hide();
                    })
                }
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

    $scope.sendgroupmessage = function ($event) {
        if ($event.keyCode === 13) {
            submitmessage();
        }
    }

    $scope.sendgroupMessageOnSubmit = function(){
        submitmessage();
    }

    function submitmessage(){
        // if($scope.groupmessage == '' || $scope.groupmessage == undefined)
        //     return;

        $scope.time = gettime();
        var timestamp = new Date().getTime()

        var gmessageobj = document.getElementById("gMessage");
        var gmessage    = gmessageobj.value;


        var chat = {
            "USERNAME"      : $scope.userdetails.username,
            "form_user_id"  : $scope.userdetails.user_id,
            "MESSAGE"       : gmessage,
            "group_id"      : $scope.selgroupobj.GROUP_ID,
            "timestamp"     : timestamp,
            "time"          : $scope.time,
            "type"          : "groupchat",
            "media"         : false,
            "audio"         : false,
            "video"         : false,
            "file_transfer" : false,
            "message_id"    : "",
            "file_name"     : "",
            "file_ext"      : "",
            "class"         : "user-chat"
        };
        
        // updatechatui($scope.userdetails.username, $scope.seluser, $scope.message, chat.message_id, "user-chat", false, false, false, false, false, false, null);
        appendtochatview(chat);

        teamrService.groupmessage(chat, function(ackData){
        });
        gmessageobj.value = '';
    }

    function appendtochatview(params){
        var usr = $scope.seluser;
        if (!angular.isUndefined(params)) {
            $scope.groupchats.push(params);
            // chatList = $scope.groupchats;
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