xenApp.controller('groupController', function ($scope, $state, $stateParams, $rootScope, $window, $cacheFactory, 
    teamrService, localStorageService, $mdDialog, $mdMedia, $filter){
    $scope.userdetails  = JSON.parse(localStorageService.get("localpeer"));
    $scope.selgroup = $stateParams.group;
    $scope.selgroupobj = {};
    $scope.groups = localStorageService.get("user_groups");    
    $scope.groupmembers  = [];    
    $scope.groupdetails  = {};
    $scope.isLoading     = false;
    $scope.cgLoading = false;
    $scope.searchNewGrouplist = false;
    $scope.toggleAdd = true;
    $scope.groupalert = "";
    $scope.searchvalue = '';
    $scope.groupsearch = [];
    $scope.selected = 0;
    if($scope.groups == null)
        $scope.groups = [];

    window.addEventListener('beforeunload', function () {
        localStorageService.remove("user_contacts");
        localStorageService.remove("user_groups");
    })

    $scope.groupsinit = function(){
        var scrollmask = document.getElementsByClassName('md-scroll-mask');
        var backdrop = document.getElementsByTagName('md-backdrop');
        angular.element(scrollmask).remove();
        angular.element(backdrop).remove();
        
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
    $scope.minDate = new Date(new Date().setDate(new Date().getDate() - 1));

    $scope.getSelgroup = function($index){
        $scope.selected = $index;
        if(isMobile() == true)
            $scope.toggleMenu();
    }

    function isMobile(){
        return (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ); 
    }

    $scope.create = function()
    {
        console.log($scope.groupdetails);
        $scope.groupalert = teamrService.creategroup($scope.userdetails.username, $scope.groupdetails, function(response)
        {
            console.log(response);
            $scope.cgLoading = false;
            if(response.success == true){
                var resp = JSON.parse(response.data);
                $rootScope.$broadcast("updategroup", resp);
                $mdDialog.cancel();
            }
            else if(response.success==false){
                var err = typeof response.data == "string" ? JSON.parse(response.data) : response.data ;
                errorpopup(err.errors[0] || err)
            }
            $scope.$digest();
        });

      
        if($scope.groupalert == '')
            $scope.cgLoading = true;
    }

    $scope.clearGroupSearchContacts = function () {
        if ($scope.searchGroupContact.length == 0) {
            $scope.groupsearch = [];
            $scope.searchNewGrouplist = false;
        }
    }
    $scope.cancel = function(){
        $mdDialog.cancel();
    }
    $scope.searchgrouplistkeypress = function($event){
        if($event.keyCode == 13)
            $scope.searchgrouplist();
    }
    $scope.searchgrouplist = function(){
        if ($scope.searchGroupContact == '')
            return;
        $scope.isLoading = true;
        $scope.searchNewGrouplist = true;
        teamrService.searchgroup($scope.userdetails.username, $scope.searchGroupContact, function (response) {
            $scope.isLoading = false;            
            if (response.success == true) {
                $scope.groupsearch = response.list;
                for (var i = 0; i < $scope.groupsearch.length; i++) {
                    $scope.groupsearch[i].exist = false;
                    for (var j = 0; j < $scope.groups.length; j++) {
                        if ($scope.groupsearch[i].id == $scope.groups[j].GROUP_ID) {
                            $scope.groupsearch[i].exist = true;
                            break;
                        }
                    }
                    
                }
            }
            $scope.$apply();
        })
    }

    $scope.joingroup = function ($index) {
        $scope.toggleAdd = false;
        $scope.isSending = true;
        $scope.groupContactIdIndex = $index;
        $scope.addmembers = [];
        $scope.addmembers.push({ admin: false, user_id: $scope.userdetails.user_id, username: $scope.userdetails.username, exit: false, is_delete: false })
        teamrService.instantadd($scope.userdetails.username, $scope.groupsearch[$index].id,
        $scope.groupsearch[$index].name, $scope.addmembers, function(response){
                console.log(response);
                if(response.success == true){
                    $scope.isSending = false;
                    $scope.searchNewGrouplist = false;
                    $scope.searchGroupContact = "";
                    $scope.$broadcast('updategroup', response.data);
                }
        });
    }
    
    $scope.$on("updategroup", function(event, data){
        var groups = localStorageService.get('user_groups');
        $scope.groups = $filter('orderBy')(groups, 'NAME');
        $scope.$apply();
        $state.go('home.groupchat')
    });

    $scope.$on("exitgroup", function(event, data){
    });

    var getjoinedgroups = function(username){
        var groups = localStorageService.get("user_groups");
        if(groups == null || groups.length == 0){
            teamrService.getjoinedgroups(username, function(response){
                if(response.success == true){
                    $scope.groups = $filter('orderBy')(response.data, 'NAME');
                    localStorageService.set("user_groups", response.data);
                    $scope.$apply();
                    $state.go('home.groupchat.groupchatview', {group:$scope.groups[0].NAME})
                }
                else if(response.success == false){
                    // No Groups
                }
            });            
        }
        else{
            teamrService.subscribegroups(username, groups);
            $scope.groups = $filter('orderBy')(groups, 'NAME');
            $state.go('home.groupchat.groupchatview', {group:$scope.groups[0].NAME})
        }
    }

    $scope.validatemaxlimit = function(){
        if($scope.groupdetails.maxlimit > 100)
            $scope.groupdetails.maxlimit = 100;
    }
    function errorpopup(msg) 
    {
       $scope.errormsg = msg
       var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
       $mdDialog.show({
           template: '<md-dialog class=""><form><div class="blo-contact"><md-dialog-content><div class="md-dialog-content"><h2>{{errorMsg}}</h2></div></md-dialog-content></div><div class="buttons"><md-button class="teamr-btn teamr-cancel" type="button" teamr-cancel ng-click="cancel()">ok</md-button><div class="clear"></div></div></form></md-dialog>',
           parent: angular.element(document.body),
           targetEvent: event,
           clickOutsideToClose: true,
           fullscreen: useFullScreen,
           preserveScope: true,
           locals: {
               parentscope: $scope
           },
           controller: 'popupcontroller'
       })
   }
});