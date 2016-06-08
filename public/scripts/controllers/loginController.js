
xenApp.controller('loginController', function ($scope, $state, $rootScope, teamrService, localStorageService) {
    $scope.credentials  = {};
    $scope.loginAlert   = "";
    $scope.isForgotpwd  = false;
    $scope.isLoading    = false;    
    var loginsuccess    = localStorageService.get('loginSuccess');
    if(loginsuccess == true){
        $state.go('home')
        return;
    }
    document.getElementsByTagName("BODY")[0].className = "tr-bg-color";

    $scope.forgotpass = function(){
        $scope.isForgotpwd = true;
    }

    $scope.cancelpwd = function(){
        $scope.isForgotpwd = false;   
    }

    $scope.reload = function(){
        $state.reload();
    }

    /*******************Login with the credentials*******************/

    $scope.loginformsubmit = function () {
        $scope.loginAlert = "";
        if (angular.isUndefined($scope.credentials.username) || angular.isUndefined($scope.credentials.password) ||
         $scope.credentials.username == "" || $scope.credentials.password == "") {
            $scope.loginSuccess = false;
            $scope.loginAlert = "Please Enter Valid Username and Password";
        }
        else {
            $scope.isLoading = true;
            teamrService.login($scope.credentials, function (data) {
                var response = data;
                $scope.isLoading = false;
                if(response.status == "success"){
                    $scope.loginSuccess = true;
                    $scope.$apply();
                    localStorageService.clearAll();
                    localStorageService.set('localpeer', JSON.stringify(response.data));
                    localStorageService.set('loginSuccess', true);
                    $state.go("home");
                }
                else if(response.status == "error"){
                    $scope.loginSuccess = false;
                    // var resp            = response.errors[0].message;
                    if(typeof response.errors[0] == 'object')
                        $scope.loginAlert   = response.errors[0].message;
                    else
                        $scope.loginAlert   = response.errors[0];
                    $scope.credentials = {};
                    document.getElementById('username').focus();
                    $scope.$apply();
                }
            });
        }
    }

    $scope.loginkeypress = function($event){
        if ($event.keyCode === 13)
            $scope.loginformsubmit();
    }

    $scope.resetpwd = function(){
        $scope.loginAlert = "";  
        if (angular.isUndefined($scope.credentials.username) || $scope.credentials.username == ""){
            $scope.loginAlert = "Please Enter the Username";
        }      
    }
});
