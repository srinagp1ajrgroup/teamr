xenApp.controller('homeController', function ($scope, $state, $rootScope, $window, teamrService, localStorageService){
    $scope.userdetails = JSON.parse(localStorageService.get("localpeer"));
    // $scope.topMiddleIndex = localStorageService.get("tabindex");
    $scope.topMiddleIndex = 1;
    $scope.contacts = [];
    $scope.statusmenu = false;
    $scope.myDropdown = false;
    $scope.home_init = function () {
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        document.getElementsByTagName("BODY")[0].className = "";
        teamrService.connect();
        teamrService.subscribe($scope.userdetails.username, function(ack){
            console.log(ack);
        });        
        teamrService.listen();
        $state.go('home.chat');
    };    

    $scope.openstatusmenu = function(){
        $scope.myDropdown = !$scope.myDropdown;
    }

    $scope.$watch('statusmenu', function($event){
        $scope.statusmenu = $event;
    });

    $scope.toggleMenu = function () {
        $scope.showmenu = ($scope.showmenu) ? false : true;
    };

    $scope.redirectochat = function () {
        $scope.topMiddleIndex = 1;
        $state.go('home.chat');
    };

    $scope.setselected = function(index){
        $scope.topMiddleIndex = index;
        localStorageService.set("tabindex", $scope.topMiddleIndex);
    }

    $scope.setStatus = function(status){
        console.log(status);
        var userstatus = document.getElementById("userstatus");
        userstatus.className = "user-img "+status;
        userstatus.setAttribute("status", status);
        teamrService.sendstatus($scope.userdetails.username, status);        
    }

    $scope.logout = function(){
        var contacts = localStorageService.get('user_contacts');
        teamrService.sendpresence($scope.userdetails.username, "offline", contacts, function(response){
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
});
