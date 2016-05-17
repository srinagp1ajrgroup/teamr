angular.module('xenChat').factory('sipService', function ($state, $http, $rootScope) 
{
	var sipService 		= {};
	var sipStack 		= null;
	var registerSession	= null;
	var callSession 	= null;

	var oConfigCall = {
			audio_remote: null,
			bandwidth: { audio:undefined, video:undefined },
			events_listener: { events: '*', listener: eventsListener },
			sip_caps: [{ name: '+g.oma.sip-im' },{ name: 'language', value: '\"en,fr\"' }]
		};

	sipService.sipInit = function(readyCallback, errorCallback) 
	{
		 SIPml.init(readyCallback, errorCallback);
	};

	sipService.createSipStack = function(impi, impu, display_name)
	{
		sipStack = new SIPml.Stack({
					realm: 'comser.ajrgroup.in:5060',
					impi: impi, 
					impu: impu, // 'sip:2092436999@216.117.82.233:5060', // mandatory: valid SIP Uri (IMS Public Identity)
					password: "HTAN@#123",
					display_name: display_name,
					websocket_proxy_url: 'wss://comser.ajrgroup.in:8089/ws', 
					enable_rtcweb_breaker: true,
					events_listener: { events: '*', listener: eventsListener }, // optional: '*' means all events
				}
			);

		sipService.sipStack = sipStack;	
		sipStack.start();
	}

	sipService.outbouncall = function(ext, audioRemote)
	{
		oConfigCall.audio_remote = audioRemote;
		callSession = sipStack.newSession('call-audio', oConfigCall);
		callSession.call(ext);
	}

	sipService.incomingcall = function(audioRemote)
	{
		oConfigCall.audio_remote = audioRemote;	
		callSession.accept(oConfigCall);
	}

	sipService.hangup = function()
	{
		if(callSession)
		{
			callSession.hangup({events_listener: { events: '*', listener: eventsListener }});
		}
	}

	sipService.unregister = function() 
	{
		 if (sipStack) 
		 {
		 	sipStack.stop({events_listener: { events: '*', listener: eventsListener }});
		 }
	};

	function eventsListener(e)
	{
		switch(e.type)
		{
			case 'started':
			{
				registersip();
			}
			break;
			
			case 'i_new_message':
			{
				// acceptMessage(e);
			}
			break;
			
			case 'i_new_call':
			{
				/*if(callSession)
				{
					e.newSession.hangup();
				}
				else*/
				{
					callSession = e.newSession;
					callSession.setConfiguration(oConfigCall);
					$rootScope.$broadcast('teamvoicecall', e);
				}
			}
			break;
			
			case 'connected':
			{
				if(e.session == registerSession)
				{
					console.log("registered");
					// $rootScope.$broadcast('sipregisteration');
				}
			}
			break;
			
			case 'm_early_media':
			{
				 if(e.session == callSession)
				 {
					$rootScope.$broadcast('teamvoicecall', e);
				 }
			}
			break;
			
			case 'stopping':
			case 'stopped':
			case 'failed_to_start':
			case 'failed_to_stop':
			{
				var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
				sipStack = null;
				registerSession = null;
				callSession = null;
			}
			break;
			
			case 'terminating':
			case 'terminated':
			{
				if (e.session == callSession) 
				{
					callSession= null;
					$rootScope.$broadcast('hangup');
				}
			}
			break;
			
			case 'm_stream_audio_local_added':
			case 'm_stream_audio_local_removed':
			case 'm_stream_audio_remote_added':
			case 'm_stream_audio_remote_removed':
            {
                break;
            }
			
			case 'i_ao_request':
			{
				if(e.session == callSession){
					var iSipResponseCode = e.getSipResponseCode();
					if (iSipResponseCode == 180 || iSipResponseCode == 183) {
						$rootScope.$broadcast('teamvoicecall', e);
					}
				}
				break;
			}
			
			case 'm_permission_requested':
            {
                
                break;
            }
			case 'm_permission_accepted':
			case 'm_permission_refused':
            {
				if(e.type == 'm_permission_refused')
				{
					callSession = null;
					
					$rootScope.$broadcast('teamvoicecall', e);
                }
                break;
            }

		}
	}

	function registersip()
	{
		registerSession = sipStack.newSession('register', oConfigCall);
		registerSession.register();
	}
	return sipService;
});