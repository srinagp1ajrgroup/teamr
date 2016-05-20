xenApp.controller('homeController', function ($scope, $state, $rootScope, $window, teamrService, localStorageService){
    $scope.userdetails = JSON.parse(localStorageService.get("localpeer"));
    // $scope.topMiddleIndex = localStorageService.get("tabindex");
    $scope.topMiddleIndex = 1;
    $scope.contacts = [];
    $scope.home_init = function () {
        document.getElementsByTagName("BODY")[0].className = "";
        teamrService.connect();
        teamrService.subscribe($scope.userdetails.username, function(ack){
            console.log(ack);
        });

        getContacts($scope.userdetails.username);
        teamrService.sendpresence($scope.userdetails.username, "online", $scope.contacts, function(response){
            console.log();
        })
        teamrService.listen();
        $state.go('home.chat');
    };

    $scope.$on('updatecontact', function(event, contactobj){
        $scope.contacts.push(contactobj);
        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
    });

    $scope.$on('acceptcontactreq', function(event, contactobj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].id == contactobj.id){
                $scope.contacts[i].WAITING_APPROVAL = contactobj.WAITING_APPROVAL;
                break;
            }
        }
        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
    });

    $scope.$on('updatepresence', function(event, presenceobj){
        // $scope.contacts.push(contactobj);
        // $scope.$apply();
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
        $scope.showmenu = ($scope.showmenu) ? false : true;
    };

    $scope.setselected = function(index){
        $scope.topMiddleIndex = index;
        localStorageService.set("tabindex", $scope.topMiddleIndex);
    }

    $scope.setStatus = function(status){
        console.log(status);
        var userstatus = document.getElementById("userstatus");
        userstatus.className = "user-img user-"+status;
        teamrService.sendpresence($scope.userdetails.username, status, $scope.contacts, function(response){
            console.log(response);
        })

    }

    $scope.logout = function(){
        teamrService.sendpresence($scope.userdetails.username, "offline", $scope.contacts, function(response){
            console.log(response);
            teamrService.logout($scope.userdetails.username, function(response){
                if(response.success == true){               
                    teamrService.disconnect($scope.userdetails.username);
                    localStorageService.clearAll();
                    $rootScope.loginSuccess = false;
                    $state.go("login");
                }
            });
        });        
    }

    var getContacts = function(username){
        var contacts = localStorageService.get("user_contacts");
        if(contacts == null){
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
                        }
                        teamrService.sendpresence($scope.userdetails.username, "online", $scope.contacts, function(response){
                            console.log();
                        });
                        localStorageService.set("user_contacts", $scope.contacts);

                        $scope.$apply();
                    }
                }
                else if(response.success == false){
                    // No Contacts
                }
            });            
        }else{
            $scope.contacts = contacts;
            teamrService.sendpresence($scope.userdetails.username, "online", $scope.contacts, function(response){
                console.log();
            });
        }
    }
});
