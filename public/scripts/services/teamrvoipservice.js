xenApp.factory('teamrvoipservice', function($state, $rootScope, localStorageService) {
    
    var teamrvoipservice = {};

    var voipcallobj = new comservoipcall();

    teamrvoipservice.sipregistration = function () {
        var credentials = {privIdentity:"4692491578", password:"abcdef"};
        voipcallobj.connect(credentials, eventsListener);
    }

    teamrvoipservice.outboundcall = function (audioremote, sipext) {
        voipcallobj.call(audioremote, sipext);
    }

    function eventsListener(e)
    {
        switch(e.type)
        {
            case 'started':
            {
                voipcallobj.register();
            }
            break;
            case 'i_new_message':
            {

            }
            break;
            case 'i_new_call':
            {
                voipcallobj.callSession = e.newSession;
                voipcallobj.callSession.setConfiguration(voipcallobj.oConfigCall);
                $rootScope.$broadcast('i_new_call');
            }
            break;
            case 'connected':
            {
                if (e.session == voipcallobj.registerSession) {
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
                voipcallobj.sipStack = null;
                voipcallobj.registerSession = null;
                voipcallobj.callSession = null;
            }
            break;
            case 'terminating':
            case 'terminated':
            {
                if (e.session == voipcallobj.callSession) {
                    voipcallobj.callSession = null;
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
                if (e.session == voipcallobj.callSession) {
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
                    voipcallobj.callSession = null;
                    $rootScope.$broadcast('m_permission_refused');
                }
            }
            break;
        }
    }

    return teamrvoipservice;
});