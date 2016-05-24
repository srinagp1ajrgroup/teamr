xenApp.directive('clickOutside', function($parse, $document) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
        	var fn = $parse(attr.clickOutside);
        	$document.bind('click', clickOutsideHandler);
        	element.bind('remove', function () {
        		$document.unbind('click', clickOutsideHandler);
        	});

        	function clickOutsideHandler(event) {
        		event.stopPropagation();
        		var targetParents = $(event.target).parents();
		        var inside = targetParents.index(element) !== -1;
		        var on     = event.target === element[0];
		        var outside = !inside && !on;
		        if (outside) scope.$apply(function() {
					fn(scope, {$event:event});
				});
        	}
            
        }
    }
});