xenApp.controller('groupController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia){
    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.selgroup = $stateParams.group;
    $scope.selgroupobj = {};
    $scope.groups = localStorageService.get("user_groups");    
    $scope.groupmembers = [];    
    $scope.isLoading    = false;
    if($scope.groups == null)
        $scope.groups = [];

    $scope.groupsinit = function(){
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        
        getjoinedgroups($scope.userdetails.username);
    }

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.creategroup = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
            controller:'groupController',
            templateUrl: '../../views/creategroup.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen
        })
        .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
            $scope.status = 'You cancelled the dialog.';
        });
        $scope.$watch(function() {
            return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
            $scope.customFullscreen = (wantsFullScreen === true);
        });
    };

    $scope.create = function(){
        console.log($scope.groupdetails);
        $scope.groupdetails.category ="";
        teamrService.creategroup($scope.userdetails.username, $scope.groupdetails, function(response){
            console.log(response);
            if(response.success == true){
                var resp = JSON.parse(response.data);
                $rootScope.$broadcast("updategroup", resp);
                $mdDialog.cancel();
            }
        })
    }

    $scope.searchgroup = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({            
            templateUrl: '../../views/searchgroup.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            fullscreen: useFullScreen,
            preserveScope:true,
            locals: {
                parentscope:$scope
             },
            controller:function($scope, parentscope){
                $scope.searchvalue = '';
                $scope.groupsearch = [];

                $scope.cancel = function(){
                    $mdDialog.cancel();
                }
                $scope.searchgrouplistkeypress = function($event){
                    if($event.keyCode == 13)
                        $scope.searchgrouplist();
                }
                $scope.searchgrouplist = function(){
                    if($scope.searchvalue == '')
                        return;

                    $scope.isLoading = true;

                    teamrService.searchgroup(parentscope.userdetails.username, $scope.searchvalue, function(response){
                        $scope.isLoading = false;            
                        if(response.success == true){
                            $scope.groupsearch = response.list;
                        }
                        $scope.$apply();
                    })
                }

                $scope.joingroup = function($index){
                    $scope.addmembers = [];
                    $scope.addmembers.push({admin:false, user_id:parentscope.userdetails.user_id, username:parentscope.userdetails.username, exit:false, is_delete:false})
                   teamrService.addmemberstogroup(parentscope.userdetails.username, $scope.groupsearch[$index].id,
                    $scope.groupsearch[$index].name, $scope.addmembers, function(response){
                            console.log(response);
                            if(response.success == true){
                                var resp = JSON.parse(response.data)
                                if(resp.status == "success"){
                                    $mdDialog.hide();   
                                }
                            }
                    }); 
                }
            }
        })
        .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
            $scope.status = 'You cancelled the dialog.';
        });
        $scope.$watch(function() {
            return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
            $scope.customFullscreen = (wantsFullScreen === true);
        });
    };

    $scope.$on("updategroup", function(event, data){
        $scope.groups = localStorageService.get('user_groups');
        // $scope.groups.push(data);
        $scope.$apply();
        // localStorageService.set("user_groups", $scope.groups);
        $state.go('home.groupchat')
    });

    $scope.$on("exitgroup", function(event, data){
    });

    var getjoinedgroups = function(username){
        var groups = localStorageService.get("user_groups");
        if(groups == null || groups.length == 0){
            teamrService.getjoinedgroups(username, function(response){
                if(response.success == true){
                    $scope.groups = response.data;
                    localStorageService.set("user_groups", response.data);
                    $scope.$apply();
                }
                else if(response.success == false){
                    // No Groups
                }
            });            
        }
        else{
            teamrService.subscribegroups(username, groups);
        }
    }

});