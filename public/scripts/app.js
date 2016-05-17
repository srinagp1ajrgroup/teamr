
var xenApp = angular.module('xenChat', ['ui.router', 'LocalStorageModule', 'ngMaterial']);

    xenApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider)
    {
        // $locationProvider.html5Mode({
        //     enabled: true,
        //     requireBase: false
        // });
        $urlRouterProvider.otherwise("/login");

        $stateProvider.state('login',
        {
            url: '/login',
            templateUrl: '../views/login.html',
            controller:'loginController'
        })
        .state('home',{
            url: '/home',
            templateUrl: '../views/home.html',
            controller: 'homeController'
        })
        .state('home.chat', {
            url: '/chat',
            templateUrl: '../views/chat.html'
        })
        .state('home.callphones', {
            url: '/callphones',
            templateUrl: '../views/callphones.html'
        })
        .state('home.groupchat', {
            url: '/groupchat',
            templateUrl: '../views/groupchat.html'
        })
        .state('home.broadcast', {
            url: '/broadcast',
            templateUrl: '../views/broadcast.html'
        })
        .state('home.chat.addcontact', {
            url: '/addcontact',
            templateUrl: '../views/addcontact.html',
            controller: 'addcontactController'
        })
        .state('home.chat.chatview', {
            url: '/chatview:?user',
            templateUrl: '../views/chatview.html',
            controller: 'chatviewController'
        })
    })

    xenApp.directive('schrollBottom', function ($timeout) {
        return {
            scope: {
                schrollBottom: "="
            },
            link: function (scope, element) {
                scope.$watchCollection('schrollBottom', function (newValue) {
                    $timeout(function () {
                        element[0].scrollTop = element[0].scrollHeight;
                    });
                });
            }
        }
    })

    xenApp.run(['$state', '$rootScope', 'teamrService', '$location', 'localStorageService', 
     function ($state, $rootScope, teamrService, $location, localStorageService) {
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            // event.preventDefault(); 
            // transitionTo() promise will be rejected with 
            // a 'transition prevented' error
            // var loginSuccess = localStorageService.get('loginSuccess')
            // if(loginSuccess == false || fromState.name == ''){
            //     console.log("stop back event")
            //     $location.path('/login')
            // }

            // else if(loginSuccess == true){
            //     console.log("stop back event")
            //     $location.path('/'+toState.name)
            // }

            if ((fromState.name == 'home') || (fromState.name == 'home.chat'))
                teamrService.removeAllListeners();
        });
    }]);

    xenApp.filter('capitalize', function () {
        return function (input) {
            return input.charAt(0).toUpperCase();
        }
    });


    xenApp.directive('myCurrentTime', function ($timeout, dateFilter) {
        // return the directive link function. (compile function not needed)
        return function(scope, element, attrs) {
            var format,  // date format
                timeoutId; // timeoutId, so that we can cancel the time updates

            // used to update the UI
            function updateTime() {
                element.text(dateFilter(new Date(), format));
            }

            // watch the expression, and update the UI on change.
            scope.$watch(attrs.myCurrentTime, function(value) {
                format = value;
                updateTime();
            });

            // schedule update in one second
            function updateLater() {
                // save the timeoutId for canceling
                timeoutId = $timeout(function() {
                    updateTime(); // update DOM
                    updateLater(); // schedule another update
                }, 1000);
            }

            // listen on DOM destroy (removal) event, and cancel the next UI update
            // to prevent updating time ofter the DOM element was removed.
            element.bind('$destroy', function() {
                $timeout.cancel(timeoutId);
            });

            updateLater(); // kick off the UI update process.
        }
    });