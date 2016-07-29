xenApp.directive('voiceCall', function($parse, $document) {
    return {
        restrict: 'E',
        templateUrl: "views/voicecall.html",
        scope:{
            isoutboundcall:'=',
            isinboundcall:'=',
            acceptcall: '&callbackFn',
            rejectcall: '&callbackFn1'
        },
        transclude: true,
        controller: function($scope){
        },
        link: function(scope, element, attr) 
        {
            scope.closecall = function(){
                scope.isoutboundcall = false;
                scope.isinboundcall = false;
            }
        }
    }
});