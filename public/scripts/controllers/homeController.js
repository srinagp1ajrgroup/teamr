xenApp.controller('homeController', function ($filter,$scope, $state, $rootScope, $window, teamrService, localStorageService, cssInjector, $mdMedia, $mdDialog,$filter, $notification, $log){
    $scope.userdetails = JSON.parse(localStorageService.get("localpeer"));    
    $scope.contacts = [];
    $scope.groups = [];
    $scope.cLimit = 5;
    $scope.gLimit = 5;
    $scope.statusmenu = false;
    $scope.myDropdown = false;
    $scope.topMiddleIndex = -1;
    $scope.tSearch = "";
    $scope.isSearch = false;
    $scope.searchResults = [];
    $scope.showbar = false;
    $scope.accordianData = [{"heading":"Contacts"}, {"heading":"Teams"}];
    $scope.seluser  = 0;
    $scope.selgroup = -1;
    $scope.isLoading = false;
    $scope.useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;

    $scope.$watch('tSearch', function (newValue, oldValue) {
        var tContacts  =   localStorageService.get("user_contacts");
        var tGroups    =   localStorageService.get("user_groups");

        if(tContacts == null || tGroups == null || (newValue != undefined && newValue.length == 0)) {
            $scope.isSearch = false;
            $scope.searchteamr = true;
            return;
        }       
        if (newValue != undefined && newValue.length > 0) {
            var tContactsFilteredList = _.filter(tContacts, function (data) {
                return data.FIRSTNAME.indexOf(newValue) >= 0;
            })
            var tGroupsFilteredList = _.filter(tGroups, function (data) {
                return data.NAME.indexOf(newValue) >= 0;
            })
            $scope.searchResults = tContactsFilteredList.concat(tGroupsFilteredList);
            $scope.searchteamr = false;
            $scope.isSearch = true;
        }

    });

    $scope.$on('updatecontact', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.accordianData[0].content = $scope.contacts;
        $scope.$apply();
        $state.go("home")
    });

    $scope.$on('deletecontactupdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.accordianData[0].content = $scope.contacts;
        $scope.$apply();
    });

    $scope.$on('updatechatcount', function(event, index){
        $scope.contacts = localStorageService.get('user_contacts');
    });

    $scope.$on('privatechatupdate', function(event, obj)
    {
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == obj.fromuser)
            {
                if($scope.contacts[i].CONTACT_USER_ID1 == $scope.userdetails.user_id)
                    $scope.contacts[i].CONTACT_USER2_UMCOUNT = $scope.contacts[i].CONTACT_USER2_UMCOUNT+1;
                else if($scope.contacts[i].CONTACT_USER_ID2 == $scope.userdetails.user_id)
                    $scope.contacts[i].CONTACT_USER1_UMCOUNT = $scope.contacts[i].CONTACT_USER1_UMCOUNT+1;
                $scope.contacts[i].nCount++;

                teamrService.updateumcount($scope.contacts[i], function(response){
                    console.log(response)
                })
                break;
            }
        }
        localStorageService.set('user_contacts', $scope.contacts)
        $scope.$apply();

        var notification = $notification('New message', {
            body: obj.fromuser+'has sent you a new message.',
            delay: 5000
        });
        notification.$on('show', function () {
            $log.debug('My notification is displayed.');
        });
        notification.$on('click', function () {
            $state.go('home.chatview', { user: obj.fromuser })
        });
        notification.$on('close', function () {
            $log.debug('The notification encounters on close.');
        });
        notification.$on('error', function () {
            $log.debug('The notification encounters an error.');
        });
    });

    $scope.$on('groupchatupdate', function(event, obj){
        
        var notification = $notification('New message', {
            body: obj.username + 'has sent you a new message.',
            delay: 5000
        });
        notification.$on('show', function () {
            $log.debug('My notification is displayed.');
        });
        notification.$on('click', function () {
            $state.go('home.groupchatview', { group: obj.NAME });
        });
        notification.$on('close', function () {
            $log.debug('The notification encounters on close.');
        });
        notification.$on('error', function () {
            $log.debug('The notification encounters an error.');
        });
    })

    $scope.$on('acceptcontactrequpdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.accordianData[0].content = $scope.contacts;
        $scope.$apply();
    })

    $scope.$on('blockcontactupdate', function(event, contactobj){
        $scope.contacts = localStorageService.get('user_contacts');
        $scope.accordianData[0].content = $scope.contacts;
        $scope.$apply();
    });

    $scope.$on('updatepresence', function(event, presenceobj){
        for(var i = 0; i < $scope.contacts.length; i++){
            if($scope.contacts[i].USERNAME == presenceobj.username){
                $scope.contacts[i].PRESENCE = presenceobj.status;
                break;
            }
        }

        $scope.$apply();
        localStorageService.set("user_contacts", $scope.contacts);
        if($state.is('home.chatview') == true)
            $rootScope.$broadcast('updateselpresence', presenceobj);
    });

    $scope.$on("updategroup", function(event, data){
        var groups = localStorageService.get('user_groups');
        $scope.groups = $filter('orderBy')(groups, 'NAME');
        $scope.accordianData[1].content = $scope.groups;
        $scope.$apply();
        // $state.go('home')
    });

    $scope.$on("exitgroup", function(event, data){
    });

    $scope.home_init = function () {
        var scrollmask = document.getElementsByClassName('md-scroll-mask');
        var backdrop = document.getElementsByTagName('md-backdrop');
        angular.element(scrollmask).remove();
        angular.element(backdrop).remove();
        // teamrService.sipregistration();
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }        
        $scope.loadTheme();
        if($scope.userdetails == null){
            $state.go('login');
            return;
        }
        document.getElementsByTagName("BODY")[0].className = "";
        teamrService.connect();
        teamrService.sendstatus($scope.userdetails.username, "online");
        teamrService.subscribe($scope.userdetails.username, function(ack){
            console.log(ack);
        });        
        getContacts($scope.userdetails.username);
        getjoinedgroups($scope.userdetails.username);
        teamrService.listen();
    };    

    $scope.openstatusmenu = function(){
        $scope.myDropdown = !$scope.myDropdown;
    };

    $scope.$watch('statusmenu', function($event){
        $scope.statusmenu = $event;
    });
    $scope.showmenu=false;
    $scope.toggleMenu = function () {
        $scope.showmenu = !$scope.showmenu;
        $scope.showmenures=true;
    };
    $scope.showmenures=true;
    $scope.resmenu = function () {
        $scope.showmenures = !$scope.showmenures;
        $scope.showmenu=true;
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
        userstatus.className = "user-admin "+status;
        userstatus.setAttribute("status", status);
        teamrService.sendstatus($scope.userdetails.username, status);        
    }

    $scope.statechangepassword = function(){
        $state.go('changepassword');
    }

    $scope.logout = function(){
        var contacts = localStorageService.get('user_contacts');
        
        teamrService.sendpresence($scope.userdetails.username, "offline", contacts, function(response){
            console.log(response);
            teamrService.logout($scope.userdetails.username, function(response){
                if(response.success == true){               
                    teamrService.disconnect($scope.userdetails.username);              
                    localStorageService.clearAll();
                    $rootScope.dataUrl = "content/css/style.css";
                    $rootScope.loginSuccess = false;
                    $state.go("login");
                }
            });
        });        
    }

    $scope.showcolorsMenu=true;
    
    $scope.togglecolorswitcher = function () {
        $scope.showcolorsMenu = ($scope.showcolorsMenu) ? false : true;
    };
    
    $scope.loadTheme = function () {
        cssInjector.removeAll();
        var dataUrl = $window.localStorage.getItem('dataUrl');
        if (angular.isDefined(dataUrl) && dataUrl != null) {
            $rootScope.dataUrl = "content/css/"+dataUrl+".css";
        }
        else {
            $rootScope.dataUrl = "content/css/style.css";
        }
        cssInjector.add($rootScope.dataUrl);
    };
    
    $scope.saveStyle = function (dataUrl) {
        cssInjector.removeAll();
        $rootScope.dataUrl = "content/css/"+dataUrl+".css";
        cssInjector.add($scope.dataUrl);
        $window.localStorage.setItem('dataUrl', dataUrl);
    }; 

    function stateroute() {
        if($scope.topMiddleIndex == 1)
            $state.go('home.chat');
        else if($scope.topMiddleIndex == 2)
            $state.go('home.groupchat');
    };   

    var getContacts = function(username)
    {
        var contacts = localStorageService.get("user_contacts");
        if(contacts == null || contacts.length == 0){
            teamrService.getcontacts(username, function(response){
                if(response.success == true){
                    // $scope.contacts = JSON.parse(response.data);
                    $scope.contacts = $filter('orderBy')(JSON.parse(response.data), 'FIRSTNAME');
                    localStorageService.set("user_contacts", $scope.contacts);
                    teamrService.sendstatus($scope.userdetails.username, "online");
                    $scope.$apply();
                    $state.go('home.chatview', {user:$scope.contacts[0].USERNAME})
                }
                else if(response.success == false){
                  $scope.errorpopup(response.data)
                }
            });            
        }else{
            $scope.contacts = $filter('orderBy')(contacts, 'FIRSTNAME');
            teamrService.sendstatus($scope.userdetails.username, "online");
            $state.go('home.chatview', {user:$scope.contacts[0].USERNAME})
        }
    } 

    var getjoinedgroups = function(username)
    {
        var groups = localStorageService.get("user_groups");
        if(groups == null || groups.length == 0){
            teamrService.getjoinedgroups(username, function(response)
            {
                if(response.success == true){
                    $scope.groups = $filter('orderBy')(response.data, 'NAME');
                    localStorageService.set("user_groups", response.data);
                    $scope.$apply();
                    $scope.accordianData[1].content = $scope.groups;
                }
                else if(response.success == false){
                    // No Groups
                }
            });            
        }
        else{
            teamrService.subscribegroups(username, groups);
            $scope.groups = $filter('orderBy')(groups, 'NAME');
        }
    }

    $scope.cloadmore = function(){
        $scope.cLimit += 10;
    }

    $scope.gloadmore = function(){
        $scope.gLimit += 10;
    }

    $scope.errorpopup = function (msg) {
        $scope.errormsg = msg
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs')) && $scope.customFullscreen;
        $mdDialog.show({
            template: '<md-dialog class=""><form><div class="blo-contact"><md-dialog-content><div class="md-dialog-content"><h2>{{errorMsg}}</h2></div></md-dialog-content></div><div class="buttons"><md-button class="teamr-btn teamr-cancel" type="button" teamr-cancel ng-click="cancel()">ok</md-button><div class="clear"></div></div></form></md-dialog>',
            parent: angular.element(document.body),
            targetEvent: event,
            fullscreen: useFullScreen,
            preserveScope: true,
            locals: {
                parentscope: $scope
            },
            controller: 'popupcontroller'
        })
    }

    $scope.searchtoggle = function () {
        $scope.showbar = ($scope.showbar) ? false : true;
    };  

    $scope.getSeluser = function (index,username) {
       // var selectedcontact = $scope.contacts.splice(index, 1);
       // $scope.contacts = selectedcontact.concat($scope.contacts);
       $scope.selgroup = -1;
       $scope.seluser  = index;
   }
    $scope.getSelgroup = function (index, grpname) {
       // var selectedcontact = $scope.groups.splice(index, 1);
       // $scope.groups = selectedcontact.concat($scope.groups);
       $scope.seluser  = -1;
       $scope.selgroup = index;
    }

    $scope.teamrsearch = function($event){
        if($scope.tSearch == "" || $scope.tSearch == undefined || $scope.tSearch == null || $scope.tSearch.length < 3 || $event.keyCode != 13)
            return;

        $scope.isLoading = true;
        $scope.searchteamr = true;
        teamrService.search($scope.tSearch, function(response){            
            if(response.success == true){
                for(var i = 0; i < response.data.length; i++)
                {
                    var find = false;
                    if(response.data[i].id == $scope.userdetails.user_id){
                        response.data.splice(i, 1)
                        i--;
                        find = true;
                    }

                    if(!find){
                        _.some($scope.contacts, function (data) {
                            var contbool = (data.CONTACT_USER_ID2 == response.data[i].id || data.CONTACT_USER_ID1 == response.data[i].id);
                            if (contbool)
                            {
                                find = true;
                                response.data.splice(i, 1)
                                i--;
                                return contbool;
                            }
                        });
                    }
                    if(!find){
                        _.some($scope.groups, function (data) {
                            var grpbool = data.GROUP_ID == response.data[i].id;
                            if (grpbool) {
                                response.data.splice(i, 1);
                                i--;
                                return grpbool;
                            }
                        });
                    }
               }

                $scope.searchResults = response.data.concat($scope.searchResults);
                $scope.isLoading = false;
                $scope.$apply();
            }
            console.log(response);
        })
    }

    $scope.joingroup = function ($index) {
        $scope.toggleAdd = false;
        $scope.isSending = true;
        $scope.groupContactIdIndex = $index;
        $scope.addmembers = [];
        $scope.addmembers.push({ admin: false, user_id: $scope.userdetails.user_id, username: $scope.userdetails.username, exit: false, is_delete: false })
        teamrService.instantadd($scope.userdetails.username, $scope.searchResults[$index].id,
        $scope.searchResults[$index].name, $scope.addmembers, function(response){
                console.log(response);
                if(response.success == true){
                    $scope.isSending = false;
                    $scope.searchNewGrouplist = false;
                    $scope.searchGroupContact = "";
                    $scope.$broadcast('updategroup', response.data);
                }
        });
    }

    $scope.sendcontactreq = function ($index) 
    {
        $scope.isSending = true;
        teamrService.addcontact($scope.userdetails.username, $scope.searchResults[$index].username, $scope.searchResults[$index].id, 
            function (response) {
            $scope.isSending = false;
            $scope.$digest();
            console.log(response);
            if (response.success == true) {
                var data = JSON.parse(response.data);
                if (data.status == "success") {
                    console.log(data);
                    $scope.searchResults[$index].isSent = true;
                    var contact = {
                        "FIRSTNAME": $scope.searchResults[$index].firstname,
                        "LASTNAME": $scope.searchResults[$index].lastname,
                        "USERNAME": $scope.searchResults[$index].username,
                        "EMAIL": $scope.searchResults[$index].email,
                        "ID": data.data.id,
                        "CONTACT_USER_ID1": data.data.contact_user_id1,
                        "CONTACT_USER_ID2": data.data.contact_user_id2,
                        "WAITING_APPROVAL": data.data.waiting_approval,
                        "USER1_BLOCKING": data.data.user1_blocking,
                        "USER2_BLOCKING": data.data.user2_blocking,
                        "USER1_REMOVING": data.data.user1_removing,
                        "USER2_REMOVING": data.data.user2_removing,
                        "CONTACT_USER1_UMCOUNT": 2,
                        "CONTACT_USER2_UMCOUNT": 2,
                        "DECLINED": data.data.declined,
                        "PRESENCE": "offline",
                        "PICTURE_URL": "",
                        "incomingreq": false
                    };

                    var usercontacts = localStorageService.get('user_contacts');
                    usercontacts.push(contact);
                    localStorageService.set('user_contacts', usercontacts);
                    $scope.searchResults = [];
                    $scope.searchNewClist = false;
                    $scope.searchContact  = '';
                    $rootScope.$broadcast('updatecontact', contact);
                }
            }
            else {
                console.log('error in adding contact')
                // $scope.isSeinding = false;
            }
        })
    }

    $scope.clearSearchContacts = function () {
        if($scope.searchContact.length == 0)
        {
            // $scope.cancelxmlreq();
            $scope.searchList = [];
            $scope.searchNewClist = false;
        }
    }

    $scope.creategroup = function(ev) {
        $scope.mdDialogPopup($scope, cgController, '../../views/creategroup.html', ev)
    }

    function cgController(scope, parentscope){
        console.log(scope.groupdetails);
        scope.groupalert = ""; 
        scope.cgLoading = false;
        scope.create = function(){            
            scope.groupalert = teamrService.creategroup(parentscope.userdetails.username, scope.groupdetails, function(response)
            {
                console.log(response);
                scope.cgLoading = false;
                if(response.success == true){
                    var resp = JSON.parse(response.data);
                    $rootScope.$broadcast("updategroup", resp);
                    $mdDialog.hide();
                }
                else if(response.success==false){
                    var err = typeof response.data == "string" ? JSON.parse(response.data) : response.data ;
                    parentscope.errorpopup(err.errors[0] || err)
                }
                scope.$digest();
            });

            if(scope.groupalert == '')
                scope.cgLoading = true;
        }

        scope.cancel = function(){
            $mdDialog.hide();
        }
    }

    $scope.collapseAll = function(data) {
       for(var i in $scope.accordianData) {
           if($scope.accordianData[i] != data) {
               $scope.accordianData[i].expanded = false;   
           }
       }

       data.expanded = !data.expanded;
    };

    $scope.mdDialogPopup = function (scope, controller, templateUrl, event) {
       $mdDialog.show({            
           templateUrl:templateUrl,
           controller: controller,
           parent: angular.element(document.body),
           targetEvent: event,
           fullscreen: $scope.useFullScreen,
           preserveScope: true,
           clickOutsideToClose: true,
           locals: {
               parentscope: scope
           },
           onRemoving: function () {
               var vid = document.getElementById("myAudio")
               vid.pause();
               vid.src = "";
           }
       })
    }
});