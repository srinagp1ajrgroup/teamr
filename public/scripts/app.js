
var xenApp = angular.module('xenChat', ['ui.router', 'LocalStorageModule', 'ngMaterial', 'luegg.directives', 'monospaced.elastic', 'angular.css.injector', 'notification', 'ngPostMessage']);
    xenApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider, cssInjectorProvider)
    {
        cssInjectorProvider.setSinglePageMode(true);
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
        .state('home.callphones', {
            url: '/callphones',
            templateUrl: '../views/callphones.html'
        })
        .state('home.broadcast', {
            url: '/broadcast',
            templateUrl: '../views/broadcast.html'
        })
        .state('home.chatview', {
            url: '/chatview:?user',
            templateUrl: '../views/chatview.html',
            controller: 'chatviewController'
        })
        .state('home.groupchatview', {
            url: '/chatview:?group',
            templateUrl: '../views/groupchatview.html',
            controller: 'groupchatController'
        })
        .state('changepassword', {
            url: '/changepassword',
            templateUrl: '../views/changepassword.html',
            controller: 'changepasswordController'
        })
        .state('audio', {
            url: '/audiocall',
            templateUrl: '../views/voicecall.html'
        })
        .state('video', {
            url: '/videocall',
            templateUrl: '../views/videocall.html',
            controller: 'videocontroller'
        })

        // $locationProvider.html5Mode(true);
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

    xenApp.run(function ($state, $rootScope, teamrService, $location, $window, localStorageService) {
        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if ((fromState.name == 'home') || (fromState.name == 'home.chat'))
                teamrService.removeAllListeners();

            function handleVisibilityChange() {
                if (document.hidden) {
                    $rootScope.$apply(function () {
                        $rootScope.userPresenceStatus = "hidden";
                    });
                  
                     console.log($rootScope.userPresenceStatus)
                } else {
                    $rootScope.$apply(function () {
                        $rootScope.userPresenceStatus = "visible";
                    });
                   
                     console.log($rootScope.userPresenceStatus)

                }
            }
            document.addEventListener("visibilitychange", handleVisibilityChange, false);

            $rootScope.netConnectionStat = navigator.onLine;
            $window.addEventListener("offline", function () {
                    $rootScope.$apply(function () {
                    $rootScope.netConnectionStat = false;
                });
            }, false);

            $window.addEventListener("online", function () {
                $rootScope.$apply(function () {
                    $rootScope.netConnectionStat = true;
                });
            }, false);
        });
    });

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


