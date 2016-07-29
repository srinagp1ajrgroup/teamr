var chatList = [];
var cacheObj = null;
xenApp.controller('chatController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, $filter){

    $scope.userdetails      = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts         = [];
    $scope.selected         = 0;
    $scope.searchList       = [];
    $scope.searchContact    = "";
    $scope.searchalert      = "";
    $scope.isLoading        = false;
    $scope.isSending        = false;
    $scope.searchNewClist   = false;    

    $scope.chat_init = function () {
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        
        teamrService.sendstatus($scope.userdetails.username, "online");
        getContacts($scope.userdetails.username);        
    }

    $scope.$on('updatecontact', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
        $state.go("home.chat")
    });

    $scope.$on('deletecontactupdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
    });

    $scope.$on('updatechatcount', function(event, index){
        $scope.contacts = localStorageService.get('user_contacts');
        // $scope.$apply();
    });

    $scope.$on('privatechatupdate', function(event, obj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == obj.fromuser){
                $scope.contacts[i].nCount++;
                break;
            }
        }
        localStorageService.set('user_contacts', $scope.contacts)
        $scope.$apply();
    });

    $scope.$on('acceptcontactrequpdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
    })

    $scope.$on('blockcontactupdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
    });

    $scope.$on('updatepresence', function(event, presenceobj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == presenceobj.username){
                $scope.contacts[i].PRESENCE = presenceobj.status;
                break;
            }
        }

        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
        if($state.is('home.chat.chatview') == true)
            $rootScope.$broadcast('updateselpresence', presenceobj);
    });

    $scope.getSeluser = function($index){
        $scope.selected = $index;
        if(isMobile() == true)
            $scope.toggleMenu();
    }

    function isMobile(){
        return (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ); 
    }

    var getContacts = function(username)
    {
        var contacts = localStorageService.get("user_contacts");
        if(contacts == null || contacts.length == 0){
            teamrService.getcontacts(username, function(response){
                if(response.success == true){
                    // $scope.contacts = JSON.parse(response.data);
                    $scope.contacts = $filter('orderBy')(JSON.parse(response.data), 'FIRSTNAME');
                    localStorageService.set("user_contacts", $scope.contacts);
                    teamrService.sendstatus($scope.userdetails.username, "online");
                    $scope.$apply();
                    $state.go('home.chat.chatview', {user:$scope.contacts[0].USERNAME})
                    
                }
                else if(response.success == false){
                  $scope.errorpopup(response.data)
                }
            });            
        }else{
            $scope.contacts = $filter('orderBy')(contacts, 'FIRSTNAME');
            teamrService.sendstatus($scope.userdetails.username, "online");
            $state.go('home.chat.chatview', {user:$scope.contacts[0].USERNAME})
        }
    }    

    var sendstatus = function(status){
        var filter = $scope.contacts.filter(function(contact){
            if(contact.USERID1_BLOCKING == true || contact.USERID2_BLOCKING == true)
                return;

            return contact;
        });
        teamrService.sendpresence($scope.userdetails.username, status, filter, function(response){
            console.log(response);
        })
    }

    $scope.getcontactkeypress = function ($event) {
        if ($event.keyCode === 13)
            $scope.getcontact();
    }

    $scope.getcontact = function(){
        if ($scope.searchContact == "" || $scope.searchContact == null || $scope.searchContact == undefined) {
            return;
        }
        else if($scope.searchContact.length < 3)
            return;
        
        $scope.searchNewClist = true;
        $scope.isLoading = true;

        teamrService.searchcontact($scope.userdetails.username, $scope.searchContact, function (response) {
            $scope.isLoading = false;
            console.log(response);
            if (response.success == true) {
                $scope.searchList = response.list.data;
                for (var i = 0; i < $scope.searchList.length; i++) {
                    $scope.searchList[i].exist = false;
                    if ($scope.searchList[i].id == $scope.userdetails.user_id) {
                        $scope.searchList.splice(i, 1);
                    }
                    else {
                        for (var j = 0; j < $scope.contacts.length; j++) {
                            if ($scope.searchList[i].id == $scope.contacts[j].CONTACT_USER_ID1 || $scope.searchList[i].id == $scope.contacts[j].CONTACT_USER_ID2) {
                                $scope.searchList[i].exist = true;
                                break;
                            }
                        }
                    }
                }
            }

            $scope.$apply();
        });
    }

    $scope.sendcontactreq = function ($index) {
        $scope.isSending = true;
        teamrService.addcontact($scope.userdetails.username, $scope.searchList[$index].username, $scope.searchList[$index].id, 
            function (response) {
            $scope.isSending = false;
            $scope.$digest();
            console.log(response);
            if (response.success == true) {
                var data = JSON.parse(response.data);
                if (data.status == "success") {
                    console.log(data);
                    $scope.searchList[$index].isSent = true;
                    var contact = {
                        "FIRSTNAME": $scope.searchList[$index].firstname,
                        "LASTNAME": $scope.searchList[$index].lastname,
                        "USERNAME": $scope.searchList[$index].username,
                        "EMAIL": $scope.searchList[$index].email,
                        "ID": data.data.id,
                        "CONTACT_USER_ID1": data.data.contact_user_id1,
                        "CONTACT_USER_ID2": data.data.contact_user_id2,
                        "WAITING_APPROVAL": data.data.waiting_approval,
                        "USER1_BLOCKING": data.data.user1_blocking,
                        "USER2_BLOCKING": data.data.user2_blocking,
                        "USER1_REMOVING": data.data.user1_removing,
                        "USER2_REMOVING": data.data.user2_removing,
                        "DECLINED": data.data.declined,
                        "PRESENCE": "offline",
                        "PICTURE_URL": "",
                        "incomingreq": false
                    };

                    var usercontacts = localStorageService.get('user_contacts');
                    usercontacts.push(contact);
                    localStorageService.set('user_contacts', usercontacts);
                    $scope.searchList = [];
                    $scope.searchNewClist = false;
                    $scope.searchContact  = '';
                    $rootScope.$broadcast('updatecontact', contact);
                }
            }
            else {
                console.log('error in adding contact')
                // $scope.isSeinding = false;
            }
        })
    }

    $scope.clearSearchContacts = function () {
        if($scope.searchContact.length == 0)
        {
            $scope.cancelxmlreq();
            $scope.searchList = [];
            $scope.searchNewClist = false;
        }
    }

    $scope.cancelxmlreq = function(){
        teamrService.cancelxmlreq(function(){
            $scope.isLoading = false;
        });
    }

    $scope.searchtoggle = function () {
        $scope.showbar = ($scope.showbar) ? false : true;
    };
});