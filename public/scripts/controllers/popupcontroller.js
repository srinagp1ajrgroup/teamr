var chatList = [];
var cacheObj = null;
xenApp.controller('popupcontroller', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, parentscope){
	$scope.errorMsg = parentscope.errormsg;
    $scope.cancel = function(){
        $mdDialog.hide();
    }
});