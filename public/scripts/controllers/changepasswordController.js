xenApp.controller('changepasswordController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia){
    document.getElementsByTagName("BODY")[0].className = "tr-bg-color";

    $scope.details = {};
    $scope.alert   = "";

    $scope.submitpassword = function(){
    	if (angular.isUndefined($scope.details.currpass) || angular.isUndefined($scope.details.newpass)) {
            $scope.loginSuccess = false;
            $scope.alert 		= "Please Enter the  above fields";
            return;
        }

        if($scope.details.newpass != $scope.details.cnfpass){
        	$scope.alert 	= "Password and Confirm Password are not same";
        	return;
        }

        if($scope.details.newpass == $scope.details.currpass){
            $scope.alert    = "New password cannot be same as your old password";
            return;
        }

        teamrService.changepassword($scope.details, function(response){
        	console.log(response);
        	if(response.success == true){
        		var resp = JSON.parse(response.data);
        		if(resp.status == 'success'){
        			$scope.alert = "Password Updated Successfully";	
        			$state.go('home');
        		}
        	}
        	else{
        		$scope.alert 	= "Error in updating the Password";
        		$scope.$digest();
        	}
        })
    }

    $scope.cancel = function(){
    	$state.go('home')
    }
});