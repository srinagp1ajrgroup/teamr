xenApp.controller('addcontactController', function ($scope, $state, $rootScope, $window, teamrService, localStorageService){
    $scope.userdetails = JSON.parse(localStorageService.get("localpeer"));
    $scope.searchList = [];
    $scope.searchContact = "";
    $scope.searchalert = "";
    $scope.isLoading = false;
    $scope.isSeinding = false;
    var contacts = localStorageService.get("user_contacts");

    $scope.getcontactkeypress = function($event){
        if ($event.keyCode === 13)
            $scope.getcontact();
    }

    $scope.getcontact = function(){
        if($scope.searchContact == "" || $scope.searchContact == null || $scope.searchContact == undefined){
            return;
        }

        $scope.isLoading = true;

        teamrService.searchcontact($scope.userdetails.username, $scope.searchContact, function(response){
            $scope.isLoading = false;
            console.log(response);
            if(response.success == true){                
                $scope.searchList = response.list.data;
                for(var i = 0; i < $scope.searchList.length; i++){
                    if($scope.searchList[i].id == $scope.userdetails.user_id){
                        $scope.searchList.splice(i, 1);
                    }
                    else{
                        for(var j = 0; j < contacts.length; j++){
                            if($scope.searchList[i].id == contacts[j].CONTACT_USER_ID1 || $scope.searchList[i].id == contacts[j].CONTACT_USER_ID2){
                                $scope.searchList.splice(i, 1);
                            }
                        }
                    }
                }

                $scope.$apply();
            }
        });
    }

    $scope.sendcontactreq = function($index){
        $scope.isSeinding = true;
        teamrService.addcontact($scope.userdetails, $scope.searchList[$index].username, $scope.searchList[$index].id, 
            function(response){
                $scope.isSeinding = false;
                console.log(response);
                if(response.success == true){
                    var data = JSON.parse(response.data);
                    if(data.status == "success"){
                        console.log(data);
                        $scope.searchList[$index].isSent = true;

                        var contact = {
                            "FIRSTNAME":$scope.searchList[$index].firstname,
                            "LASTNAME":$scope.searchList[$index].lastname,
                            "USERNAME":$scope.searchList[$index].username,
                            "EMAIL":$scope.searchList[$index].email,
                            "ID":data.data.id,
                            "CONTACT_USER_ID1":data.data.contact_user_id1.$oid,
                            "CONTACT_USER_ID2":data.data.contact_user_id2.$oid,
                            "WAITING_APPROVAL":data.data.waiting_approval,
                            "PRESENCE":"offline",
                            "PICTURE_URL":"",
                            "incomingreq":false
                        };

                        var usercontacts = localStorageService.get('user_contacts');
                        usercontacts.push(contact);
                        localStorageService.set('user_contacts', usercontacts);
                        $rootScope.$broadcast('updatecontact', contact);                        
                    }                    
                }                
        });
    }
});