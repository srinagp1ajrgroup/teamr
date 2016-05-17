xenApp.factory('voiceCallService', ['$state','$http', '$rootScope', function ($state, $http, $rootScope)
{
   
    var voiceCallService    = {};
    // var voicecallobj        = new comservoicecall();

    voiceCallService.connect = function (username) {
        voicecallobj.connect(username, eventsListener);
    }

    voiceCallService.register = function () {
        voicecallobj.register();
    }

    voiceCallService.unregister = function () {
        voicecallobj.unregister(eventsListener);
    }

    voiceCallService.call = function (audioremote, sipext) {
        voicecallobj.call(audioremote, sipext);
    }

    voiceCallService.accept = function (audioremote) {
        voicecallobj.accept(audioremote);
    }

    voiceCallService.hangup = function () {
        voicecallobj.hangup(eventsListener);
    }

    function eventsListener(e)
    {
        switch(e.type)
        {
            case 'started':
            {
                voicecallobj.register();
            }
            break;
            case 'i_new_message':
            {

            }
            break;
            case 'i_new_call':
            {
                voicecallobj.callSession = e.newSession;
                voicecallobj.callSession.setConfiguration(voicecallobj.oConfigCall);
                $rootScope.$broadcast('i_new_call');
            }
            break;
            case 'connected':
            {
                if (e.session == voicecallobj.registerSession) {
                    $rootScope.$broadcast('registered');
                }
            }
            break;
            case 'm_early_media':
            {
                $rootScope.$broadcast('m_early_media');
            }
            break;
            case 'stopping':
            case 'stopped':
            case 'failed_to_start':
            case 'failed_to_stop':
            {
                var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
                voicecallobj.sipStack = null;
                voicecallobj.registerSession = null;
                voicecallobj.callSession = null;
            }
            break;
            case 'terminating':
            case 'terminated':
            {
                if (e.session == voicecallobj.callSession) {
                    voicecallobj.callSession = null;
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
                if (e.session == voicecallobj.callSession) {
                    var iSipResponseCode = e.getSipResponseCode();
                    if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                        $rootScope.$broadcast('i_ao_request');
                    }
                }
            }
            break;
            case 'm_permission_requested':
            {
                
                break;
            }
            case 'm_permission_accepted':
            case 'm_permission_refused':
            {
                if (e.type == 'm_permission_refused') {
                    voicecallobj.callSession = null;
                    $rootScope.$broadcast('m_permission_refused');
                }
            }
            break;
        }
    }
    
    return voiceCallService;
}]);
