var chatList = [];
var cacheObj = null;
xenApp.controller('chatController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia){

    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.contacts     = [];

    $scope.chat_init = function () {
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        
        teamrService.sendstatus($scope.userdetails.username, "online");
        getContacts($scope.userdetails.username);
    };

    $scope.$on('acceptcontactreq', function(event, contactobj){
        $scope.contacts = [];
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
        $state.go("home.chat")
    });

    $scope.$on('updatecontact', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.$apply();
        $state.go("home.chat")
        
    });

    $scope.$on('blockcontact', function(event, contactobj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].ID == contactobj.recid){
                if(contactobj.obj.USERID1_BLOCKING != undefined)
                    $scope.contacts[i].USERID1_BLOCKING = contactobj.obj.USERID1_BLOCKING;
                else if(contactobj.USERID2_BLOCKING != undefined)
                    $scope.contacts[i].USERID2_BLOCKING = contactobj.obj.USERID2_BLOCKING;

                $scope.contacts[i].PRESENCE  = "offline";
                break;
            }
        }
        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
    });

    $scope.$on('deletecontact', function(event, contactobj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].ID == contactobj.recid){
                if(contactobj.obj.USERID1_REMOVING != undefined || contactobj.obj.USERID2_REMOVING != undefined)
                    $scope.contacts.splice(i, 1)

                break;
            }
        }
        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
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
    });

    $scope.toggleMenu = function () {
        // $scope.showmenu = ($scope.showmenu) ? false : true;
    };

    var getContacts = function(username){
        var contacts = localStorageService.get("user_contacts");
        if(contacts == null || contacts.length == 0){
            teamrService.getcontacts(username, function(response){
                if(response.success == true){
                    // Update Contacts
                    var data = JSON.parse(response.data);
                    if(data.status == "success"){
                        $scope.contacts = data.data;
                        for(var i = 0; i < $scope.contacts.length; i++){
                            if($scope.contacts[i].WAITING_APPROVAL == true && $scope.userdetails.user_id == $scope.contacts[i].CONTACT_USER_ID2){
                                $scope.contacts[i].incomingreq = true;
                            }

                            else if($scope.contacts[i].WAITING_APPROVAL == true && $scope.userdetails.user_id == $scope.contacts[i].CONTACT_USER_ID1){
                                $scope.contacts[i].incomingreq = false;
                            }

                            if($scope.contacts[i].PRESENCE == null)
                                $scope.contacts[i].PRESENCE = "offline"
                        }
                        localStorageService.set("user_contacts", $scope.contacts);
                        teamrService.sendstatus($scope.userdetails.username, "online");
                        $scope.$apply();
                    }
                }
                else if(response.success == false){
                    // No Contacts
                }
            });            
        }else{
            $scope.contacts = contacts;
            teamrService.sendstatus($scope.userdetails.username, "online");
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
    
});