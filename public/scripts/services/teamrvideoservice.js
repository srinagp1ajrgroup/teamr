xenApp.factory('teamrvideoservice', function($state, $rootScope, localStorageService) {
    
    var teamrvideoservice = {};

    var vCall	 = new comserVideocall();

    teamrvideoservice.outboundcall = function (username, roomid) {    	
    	vCall.videocall(roomid, username, comservideocallback, true);
    }

    function comservideocallback(event, data){
	    switch(event){
	        case "localstream":{
	        	var local = document.getElementById("localvideo");
	            attachMediaStream(local, data);
	            // $rootScope.$broadcast('localvideo', data)
	        }
	        break;
	        case "remotestream":
	        {
	        	console.log('remorestream')
	         	var remotes = document.getElementById('remotevideo');
	        	var id = 'remoteVideo_' + data.id;
	        	var vid = document.createElement('video');
	        	vid.id = id;
	        	vid.width = 320;
	        	vid.height = 240;
	        	vid.autoplay = true;
	        	remotes.appendChild(vid);
	        	vid.src = URL.createObjectURL(data);

	        	data.onended = function()
	        	{
	        		$rootScope.$broadcast('closevideocall');
	            	// isMediaACtivity = false;
	            	// console.log('stream ended', this.id);
	            	// var src = $('#' + id).attr('src');
	            	// $('#' + id).remove();
	        	}
	        }
	        break;
	        case "destroyed":{
	            // var curtime = $('#localvideo').get(0).currentTime;
	            console.log("currtime:", curtime);
	        }
	        case "removestream":{
	        	window.close();
	        }
	        break;
	    }
	}

    return teamrvideoservice;
});