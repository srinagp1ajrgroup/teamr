

xenApp.controller('videocontroller', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, teamrvideoservice, $mdDialog, $mdMedia, $filter){

    window.addEventListener("message", function(){
        window.close();
    }, false);

    $scope.userdetails = localStorageService.get('localpeer');
    $scope.roomid = localStorageService.get("roomid");
    $scope.videocall_from = localStorageService.get('videocall_from');

    document.getElementsByTagName("BODY")[0].className = "";

    $scope.video_init = function () {
        teamrvideoservice.outboundcall($scope.userdetails.username, $scope.roomid)
    }

    $scope.$on('localvideo', function (event, data) {
        var local = document.getElementById('localvideo');
        attachMediaStream(local, data);
    });

    $scope.$on('closevideocall', function (event, data) {
        $window.close();
    });
    
    $scope.close = function(){
        // teamrService.disconnectvideocall($scope.videocall_from, $scope.videocalldetails.roomid);
        $window.close();
    }   

    window.addEventListener("beforeunload", function (e) {
        if ($window.closed)
            teamrService.disconnectvideocall($scope.videocall_from, $scope.videocalldetails.roomid);
    });

});