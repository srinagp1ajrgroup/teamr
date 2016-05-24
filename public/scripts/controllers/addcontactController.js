xenApp.controller('addcontactController', function ($scope, $state, $rootScope, $window, teamrService, localStorageService){
    $scope.userdetails = JSON.parse(localStorageService.get("localpeer"));
    $scope.searchList = [];
    $scope.searchContact = "";
    $scope.searchalert = "";

    $scope.getcontact = function(){
        if($scope.searchContact == "" || $scope.searchContact == null || $scope.searchContact == undefined){
            return;
        }
        if($scope.searchContact == $scope.userdetails.username){
            return;
        }

        teamrService.searchcontact($scope.userdetails.username, $scope.searchContact, function(response){
            console.log(response);
            if(response.success == true){
                $scope.searchList = response.list.data;
                $scope.$apply();
            }
        });
    }

    $scope.sendcontactreq = function($index){
        teamrService.addcontact($scope.userdetails, $scope.searchList[$index].username, $scope.searchList[$index].id, 
            function(response){
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
                            "CONTACT_USER_ID1":data.data.contact_user_id1.oid,
                            "CONTACT_USER_ID2":data.data.contact_user_id2.oid,
                            "WAITING_APPROVAL":data.data.waiting_approval,
                            "PRESENCE":"offline",
                            "PICTURE_URL":"",
                            "incomingreq":false
                        };

                        $rootScope.$broadcast('updatecontact', contact);
                    }                    
                }                
        });
    }
});