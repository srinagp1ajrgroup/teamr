function Janus(a){function t(a){for(var b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",c="",d=0;d<a;d++){var e=Math.floor(Math.random()*b.length);c+=b.substring(e,e+1)}return c}function u(){if(null!=o){if(Janus.debug("Long poll..."),!n)return void Janus.warn("Is the gateway down? (connected=false)");var b=h+"/"+o+"?rid="+(new Date).getTime();void 0!==k&&null!==k&&(b=b+"&maxev="+k),null!==l&&void 0!==l&&(b=b+"&token="+l),null!==m&&void 0!==m&&(b=b+"&apisecret="+m),Janus.ajax({type:"GET",url:b,cache:!1,timeout:6e4,success:v,error:function(b,c,d){return Janus.error(c+": "+d),r++,r>3?(n=!1,void a.error("Lost connection to the gateway (is it down?)")):void u()},dataType:"json"})}}function v(a){if(r=0,b||void 0===o||null===o||setTimeout(u,200),Janus.debug("Got event on session "+o),Janus.debug(a),b||!Array.isArray(a)){if("keepalive"!==a.janus)if("ack"!==a.janus)if("success"!==a.janus){if("webrtcup"===a.janus){var f=a.sender;if(void 0===f||null===f)return void Janus.warn("Missing sender...");var g=p[f];return void 0===g||null===g?void Janus.warn("This handle is not attached to this session"):void g.webrtcState(!0)}if("hangup"===a.janus){var f=a.sender;if(void 0===f||null===f)return void Janus.warn("Missing sender...");var g=p[f];if(void 0===g||null===g)return void Janus.warn("This handle is not attached to this session");g.webrtcState(!1),g.hangup()}else if("detached"===a.janus){var f=a.sender;if(void 0===f||null===f)return void Janus.warn("Missing sender...");var g=p[f];if(void 0===g||null===g)return;g.ondetached(),g.detach()}else if("media"===a.janus){var f=a.sender;if(void 0===f||null===f)return void Janus.warn("Missing sender...");var g=p[f];if(void 0===g||null===g)return void Janus.warn("This handle is not attached to this session");g.mediaState(a.type,a.receiving)}else{if("error"===a.janus){Janus.error("Ooops: "+a.error.code+" "+a.error.reason);var d=a.transaction;if(null!==d&&void 0!==d){var e=s[d];null!==e&&void 0!==e&&e(a),delete s[d]}return}if("event"===a.janus){var f=a.sender;if(void 0===f||null===f)return void Janus.warn("Missing sender...");var h=a.plugindata;if(void 0===h||null===h)return void Janus.warn("Missing plugindata...");Janus.debug("  -- Event is coming from "+f+" ("+h.plugin+")");var i=h.data;Janus.debug(i);var g=p[f];if(void 0===g||null===g)return void Janus.warn("This handle is not attached to this session");var j=a.jsep;void 0!==j&&null!==j&&(Janus.debug("Handling SDP as well..."),Janus.debug(j));var k=g.onmessage;null!==k&&void 0!==k?(Janus.debug("Notifying application..."),k(i,j)):Janus.debug("No provided notification callback")}else Janus.warn("Unknown message '"+a.janus+"'")}}else{var d=a.transaction;if(null!==d&&void 0!==d){var e=s[d];null!==e&&void 0!==e&&e(a),delete s[d]}}else{var d=a.transaction;if(null!==d&&void 0!==d){var e=s[d];null!==e&&void 0!==e&&e(a),delete s[d]}}}else for(var c=0;c<a.length;c++)v(a[c])}function w(){if(null!==h&&b&&n){e=setTimeout(w,3e4);var a={janus:"keepalive",session_id:o,transaction:t(12)};null!==l&&void 0!==l&&(a.token=l),null!==m&&void 0!==m&&(a.apisecret=m),c.send(JSON.stringify(a))}}function x(i){var j=t(12),k={janus:"create",transaction:j};if(null!==l&&void 0!==l&&(k.token=l),null!==m&&void 0!==m&&(k.apisecret=m),null===h&&Array.isArray(f)&&(h=f[g],0===h.indexOf("ws")?(b=!0,Janus.log("Server #"+(g+1)+": trying WebSockets to contact Janus ("+h+")")):(b=!1,Janus.log("Server #"+(g+1)+": trying REST API to contact Janus ("+h+")"))),b){c=new WebSocket(h,"janus-protocol"),d={error:function(){return Janus.error("Error connecting to the Janus WebSockets server... "+h),Array.isArray(f)?(g++,g==f.length?void i.error("Error connecting to any of the provided Janus servers: Is the gateway down?"):(h=null,void setTimeout(function(){x(i)},200))):void i.error("Error connecting to the Janus WebSockets server: Is the gateway down?")},open:function(){s[j]=function(a){return Janus.debug(a),"success"!==a.janus?(Janus.error("Ooops: "+a.error.code+" "+a.error.reason),void i.error(a.error.reason)):(e=setTimeout(w,3e4),n=!0,o=a.data.id,Janus.log("Created session: "+o),Janus.sessions[o]=q,void i.success())},c.send(JSON.stringify(k))},message:function(a){v(JSON.parse(a.data))},close:function(){null!==h&&n&&(n=!1,a.error("Lost connection to the gateway (is it down?)"))}};for(var p in d)c.addEventListener(p,d[p])}else Janus.ajax({type:"POST",url:h,cache:!1,contentType:"application/json",data:JSON.stringify(k),success:function(a){return Janus.debug(a),"success"!==a.janus?(Janus.error("Ooops: "+a.error.code+" "+a.error.reason),void i.error(a.error.reason)):(n=!0,o=a.data.id,Janus.log("Created session: "+o),Janus.sessions[o]=q,u(),void i.success())},error:function(a,b,c){return Janus.error(b+": "+c),Array.isArray(f)?(g++,g==f.length?void i.error("Error connecting to any of the provided Janus servers: Is the gateway down?"):(h=null,void setTimeout(function(){x(i)},200))):void(""===c?i.error(b+": Is the gateway down?"):i.error(b+": "+c))},dataType:"json"})}function y(f,g){if(g=g===!0,Janus.log("Destroying session "+o+" (sync="+g+")"),f=f||{},f.success="function"==typeof f.success?f.success:Janus.noop,!n)return Janus.warn("Is the gateway down? (connected=false)"),void f.success();if(void 0===o||null===o)return Janus.warn("No session to destroy"),f.success(),void a.destroyed();delete Janus.sessions[o];for(var i in p){var j=p[i];Janus.log("Destroying handle "+j.id+" ("+j.plugin+")"),E(j.id,null,g)}var k={janus:"destroy",transaction:t(12)};if(null!==l&&void 0!==l&&(k.token=l),null!==m&&void 0!==m&&(k.apisecret=m),b){k.session_id=o;var q=function(){for(var a in d)c.removeEventListener(a,d[a]);c.removeEventListener("message",r),c.removeEventListener("error",s),e&&clearTimeout(e)},r=function(b){var c=JSON.parse(b.data);c.session_id==k.session_id&&c.transaction==k.transaction&&(q(),f.success(),a.destroyed())},s=function(b){q(),f.error("Failed to destroy the gateway: Is the gateway down?"),a.destroyed()};return c.addEventListener("message",r),c.addEventListener("error",s),void c.send(JSON.stringify(k))}Janus.ajax({type:"POST",url:h+"/"+o,async:g,cache:!1,contentType:"application/json",data:JSON.stringify(k),success:function(b){Janus.log("Destroyed session:"),Janus.debug(b),o=null,n=!1,"success"!==b.janus&&Janus.error("Ooops: "+b.error.code+" "+b.error.reason),f.success(),a.destroyed()},error:function(b,c,d){Janus.error(c+": "+d),o=null,n=!1,f.success(),a.destroyed()},dataType:"json"})}function z(a){if(a=a||{},a.success="function"==typeof a.success?a.success:Janus.noop,a.error="function"==typeof a.error?a.error:Janus.noop,a.consentDialog="function"==typeof a.consentDialog?a.consentDialog:Janus.noop,a.mediaState="function"==typeof a.mediaState?a.mediaState:Janus.noop,a.webrtcState="function"==typeof a.webrtcState?a.webrtcState:Janus.noop,a.onmessage="function"==typeof a.onmessage?a.onmessage:Janus.noop,a.onlocalstream="function"==typeof a.onlocalstream?a.onlocalstream:Janus.noop,a.onremotestream="function"==typeof a.onremotestream?a.onremotestream:Janus.noop,a.ondata="function"==typeof a.ondata?a.ondata:Janus.noop,a.ondataopen="function"==typeof a.ondataopen?a.ondataopen:Janus.noop,a.oncleanup="function"==typeof a.oncleanup?a.oncleanup:Janus.noop,a.ondetached="function"==typeof a.ondetached?a.ondetached:Janus.noop,!n)return Janus.warn("Is the gateway down? (connected=false)"),void a.error("Is the gateway down? (connected=false)");var d=a.plugin;if(void 0===d||null===d)return Janus.error("Invalid plugin"),void a.error("Invalid plugin");var e=t(12),f={janus:"attach",plugin:d,transaction:e};return null!==l&&void 0!==l&&(f.token=l),null!==m&&void 0!==m&&(f.apisecret=m),b?(s[e]=function(b){if(Janus.debug(b),"success"!==b.janus)return Janus.error("Ooops: "+b.error.code+" "+b.error.reason),void a.error("Ooops: "+b.error.code+" "+b.error.reason);var c=b.data.id;Janus.log("Created handle: "+c);var e={session:q,plugin:d,id:c,webrtcStuff:{started:!1,myStream:null,streamExternal:!1,remoteStream:null,mySdp:null,pc:null,dataChannel:null,dtmfSender:null,trickle:!0,iceDone:!1,sdpSent:!1,volume:{value:null,timer:null},bitrate:{value:null,bsnow:null,bsbefore:null,tsnow:null,tsbefore:null,timer:null}},getId:function(){return c},getPlugin:function(){return d},getVolume:function(){return L(c)},isAudioMuted:function(){return M(c,!1)},muteAudio:function(){return N(c,!1,!0)},unmuteAudio:function(){return N(c,!1,!1)},isVideoMuted:function(){return M(c,!0)},muteVideo:function(){return N(c,!0,!0)},unmuteVideo:function(){return N(c,!0,!1)},getBitrate:function(){return O(c)},send:function(a){A(c,a)},data:function(a){C(c,a)},dtmf:function(a){D(c,a)},consentDialog:a.consentDialog,mediaState:a.mediaState,webrtcState:a.webrtcState,onmessage:a.onmessage,createOffer:function(a){G(c,a)},createAnswer:function(a){G(c,a)},handleRemoteJsep:function(a){H(c,a)},onlocalstream:a.onlocalstream,onremotestream:a.onremotestream,ondata:a.ondata,ondataopen:a.ondataopen,oncleanup:a.oncleanup,ondetached:a.ondetached,hangup:function(a){Q(c,a===!0)},detach:function(a){E(c,a)}};p[c]=e,a.success(e)},f.session_id=o,void c.send(JSON.stringify(f))):void Janus.ajax({type:"POST",url:h+"/"+o,cache:!1,contentType:"application/json",data:JSON.stringify(f),success:function(b){if(Janus.debug(b),"success"!==b.janus)return Janus.error("Ooops: "+b.error.code+" "+b.error.reason),void a.error("Ooops: "+b.error.code+" "+b.error.reason);var c=b.data.id;Janus.log("Created handle: "+c);var e={session:q,plugin:d,id:c,webrtcStuff:{started:!1,myStream:null,streamExternal:!1,remoteStream:null,mySdp:null,pc:null,dataChannel:null,dtmfSender:null,trickle:!0,iceDone:!1,sdpSent:!1,volume:{value:null,timer:null},bitrate:{value:null,bsnow:null,bsbefore:null,tsnow:null,tsbefore:null,timer:null}},getId:function(){return c},getPlugin:function(){return d},getVolume:function(){return L(c)},isAudioMuted:function(){return M(c,!1)},muteAudio:function(){return N(c,!1,!0)},unmuteAudio:function(){return N(c,!1,!1)},isVideoMuted:function(){return M(c,!0)},muteVideo:function(){return N(c,!0,!0)},unmuteVideo:function(){return N(c,!0,!1)},getBitrate:function(){return O(c)},send:function(a){A(c,a)},data:function(a){C(c,a)},dtmf:function(a){D(c,a)},consentDialog:a.consentDialog,mediaState:a.mediaState,webrtcState:a.webrtcState,onmessage:a.onmessage,createOffer:function(a){G(c,a)},createAnswer:function(a){G(c,a)},handleRemoteJsep:function(a){H(c,a)},onlocalstream:a.onlocalstream,onremotestream:a.onremotestream,ondata:a.ondata,ondataopen:a.ondataopen,oncleanup:a.oncleanup,ondetached:a.ondetached,hangup:function(a){Q(c,a===!0)},detach:function(a){E(c,a)}};p[c]=e,a.success(e)},error:function(a,b,c){Janus.error(b+": "+c)},dataType:"json"})}function A(a,d){if(d=d||{},d.success="function"==typeof d.success?d.success:Janus.noop,d.error="function"==typeof d.error?d.error:Janus.noop,!n)return Janus.warn("Is the gateway down? (connected=false)"),void d.error("Is the gateway down? (connected=false)");var e=d.message,f=d.jsep,g=t(12),i={janus:"message",body:e,transaction:g};return null!==l&&void 0!==l&&(i.token=l),null!==m&&void 0!==m&&(i.apisecret=m),null!==f&&void 0!==f&&(i.jsep=f),Janus.debug("Sending message to plugin (handle="+a+"):"),Janus.debug(i),b?(i.session_id=o,i.handle_id=a,s[g]=function(a){if(Janus.debug("Message sent!"),Janus.debug(a),"success"===a.janus){var b=a.plugindata;if(void 0===b||null===b)return Janus.warn("Request succeeded, but missing plugindata..."),void d.success();Janus.log("Synchronous transaction successful ("+b.plugin+")");var c=b.data;return Janus.debug(c),void d.success(c)}return"ack"!==a.janus?void(void 0!==a.error&&null!==a.error?(Janus.error("Ooops: "+a.error.code+" "+a.error.reason),d.error(a.error.code+" "+a.error.reason)):(Janus.error("Unknown error"),d.error("Unknown error"))):void d.success()},void c.send(JSON.stringify(i))):void Janus.ajax({type:"POST",url:h+"/"+o+"/"+a,cache:!1,contentType:"application/json",data:JSON.stringify(i),success:function(a){if(Janus.debug("Message sent!"),Janus.debug(a),"success"===a.janus){var b=a.plugindata;if(void 0===b||null===b)return Janus.warn("Request succeeded, but missing plugindata..."),void d.success();Janus.log("Synchronous transaction successful ("+b.plugin+")");var c=b.data;return Janus.debug(c),void d.success(c)}return"ack"!==a.janus?void(void 0!==a.error&&null!==a.error?(Janus.error("Ooops: "+a.error.code+" "+a.error.reason),d.error(a.error.code+" "+a.error.reason)):(Janus.error("Unknown error"),d.error("Unknown error"))):void d.success()},error:function(a,b,c){Janus.error(b+": "+c),d.error(b+": "+c)},dataType:"json"})}function B(a,d){if(!n)return void Janus.warn("Is the gateway down? (connected=false)");var e={janus:"trickle",candidate:d,transaction:t(12)};return null!==l&&void 0!==l&&(e.token=l),null!==m&&void 0!==m&&(e.apisecret=m),Janus.debug("Sending trickle candidate (handle="+a+"):"),Janus.debug(e),b?(e.session_id=o,e.handle_id=a,void c.send(JSON.stringify(e))):void Janus.ajax({type:"POST",url:h+"/"+o+"/"+a,cache:!1,contentType:"application/json",data:JSON.stringify(e),success:function(a){if(Janus.debug("Candidate sent!"),Janus.debug(a),"ack"!==a.janus)return void Janus.error("Ooops: "+a.error.code+" "+a.error.reason)},error:function(a,b,c){Janus.error(b+": "+c)},dataType:"json"})}function C(a,b){b=b||{},b.success="function"==typeof b.success?b.success:Janus.noop,b.error="function"==typeof b.error?b.error:Janus.noop;var c=p[a];if(null===c||void 0===c||null===c.webrtcStuff||void 0===c.webrtcStuff)return Janus.warn("Invalid handle"),void b.error("Invalid handle");var d=c.webrtcStuff,e=b.text;return null===e||void 0===e?(Janus.warn("Invalid text"),void b.error("Invalid text")):(Janus.log("Sending string on data channel: "+e),d.dataChannel.send(e),void b.success())}function D(a,b){b=b||{},b.success="function"==typeof b.success?b.success:Janus.noop,b.error="function"==typeof b.error?b.error:Janus.noop;var c=p[a];if(null===c||void 0===c||null===c.webrtcStuff||void 0===c.webrtcStuff)return Janus.warn("Invalid handle"),void b.error("Invalid handle");var d=c.webrtcStuff;if(null===d.dtmfSender||void 0===d.dtmfSender){if(void 0!==d.myStream&&null!==d.myStream){var e=d.myStream.getAudioTracks();if(null!==e&&void 0!==e&&e.length>0){var f=e[0];d.dtmfSender=d.pc.createDTMFSender(f),Janus.log("Created DTMF Sender"),d.dtmfSender.ontonechange=function(a){Janus.debug("Sent DTMF tone: "+a.tone)}}}if(null===d.dtmfSender||void 0===d.dtmfSender)return Janus.warn("Invalid DTMF configuration"),void b.error("Invalid DTMF configuration")}var g=b.dtmf;if(null===g||void 0===g)return Janus.warn("Invalid DTMF parameters"),void b.error("Invalid DTMF parameters");var h=g.tones;if(null===h||void 0===h)return Janus.warn("Invalid DTMF string"),void b.error("Invalid DTMF string");var i=g.duration;null!==i&&void 0!==i||(i=500);var j=g.gap;null!==j&&void 0!==j||(j=50),Janus.debug("Sending DTMF string "+h+" (duration "+i+"ms, gap "+j+"ms"),d.dtmfSender.insertDTMF(h,i,j)}function E(a,d,e){if(e=e===!0,Janus.log("Destroying handle "+a+" (sync="+e+")"),d=d||{},d.success="function"==typeof d.success?d.success:Janus.noop,d.error="function"==typeof d.error?d.error:Janus.noop,Q(a),!n)return Janus.warn("Is the gateway down? (connected=false)"),void d.error("Is the gateway down? (connected=false)");var f={janus:"detach",transaction:t(12)};return null!==l&&void 0!==l&&(f.token=l),null!==m&&void 0!==m&&(f.apisecret=m),b?(f.session_id=o,f.handle_id=a,c.send(JSON.stringify(f)),delete p[a],void d.success()):void Janus.ajax({type:"POST",url:h+"/"+o+"/"+a,async:e,cache:!1,contentType:"application/json",data:JSON.stringify(f),success:function(b){Janus.log("Destroyed handle:"),Janus.debug(b),"success"!==b.janus&&Janus.error("Ooops: "+b.error.code+" "+b.error.reason),delete p[a],d.success()},error:function(b,c,e){Janus.error(c+": "+e),delete p[a],d.success()},dataType:"json"})}function F(a,b,c,d,e){var f=p[a];if(null===f||void 0===f||null===f.webrtcStuff||void 0===f.webrtcStuff)return Janus.warn("Invalid handle"),void d.error("Invalid handle");var g=f.webrtcStuff;Janus.debug("streamsDone:",e),g.myStream=e;var h={iceServers:i},k={optional:[{DtlsSrtpKeyAgreement:!0}]};if(j===!0&&k.optional.push({googIPv6:!0}),Janus.log("Creating PeerConnection"),Janus.debug(k),g.pc=new RTCPeerConnection(h,k),Janus.debug(g.pc),g.pc.getStats&&(g.volume.value=0,g.bitrate.value="0 kbits/sec"),Janus.log("Preparing local SDP and gathering candidates (trickle="+g.trickle+")"),g.pc.onicecandidate=function(b){if(null==b.candidate||"edge"===webrtcDetectedBrowser&&b.candidate.candidate.indexOf("endOfCandidates")>0)Janus.log("End of candidates."),g.iceDone=!0,g.trickle===!0?B(a,{completed:!0}):K(a,d);else{var c={candidate:b.candidate.candidate,sdpMid:b.candidate.sdpMid,sdpMLineIndex:b.candidate.sdpMLineIndex};g.trickle===!0&&B(a,c)}},null!==e&&void 0!==e&&(Janus.log("Adding local stream"),g.pc.addStream(e),f.onlocalstream(e)),g.pc.onaddstream=function(a){Janus.log("Handling Remote Stream"),Janus.debug(a),g.remoteStream=a,f.onremotestream(a.stream)},V(c)){Janus.log("Creating data channel");var l=function(a){Janus.log("Received message on data channel: "+a.data),f.ondata(a.data)},m=function(){var a=null!==g.dataChannel?g.dataChannel.readyState:"null";Janus.log("State change on data channel: "+a),"open"===a&&f.ondataopen()},n=function(a){Janus.error("Got error on data channel:",a)};g.dataChannel=g.pc.createDataChannel("JanusDataChannel",{ordered:!1}),g.dataChannel.onmessage=l,g.dataChannel.onopen=m,g.dataChannel.onclose=m,g.dataChannel.onerror=n}null===b||void 0===b?I(a,c,d):g.pc.setRemoteDescription(new RTCSessionDescription(b),function(){Janus.log("Remote description accepted!"),J(a,c,d)},d.error)}function G(a,b){function q(f,g){e.consentDialog(!1),f?b.error({code:f.code,name:f.name,message:f.message}):F(a,c,d,b,g)}function r(a,b){Janus.log("Adding media constraint (screen capture)"),Janus.debug(a),navigator.mediaDevices.getUserMedia(a).then(function(a){b(null,a)}).catch(function(a){e.consentDialog(!1),b(a)})}b=b||{},b.success="function"==typeof b.success?b.success:Janus.noop,b.error="function"==typeof b.error?b.error:P;var c=b.jsep,d=b.media,e=p[a];if(null===e||void 0===e||null===e.webrtcStuff||void 0===e.webrtcStuff)return Janus.warn("Invalid handle"),void b.error("Invalid handle");var f=e.webrtcStuff;if(void 0!==f.pc&&null!==f.pc)return Janus.log("Updating existing media session"),void(null===c||void 0===c?I(a,d,b):f.pc.setRemoteDescription(new RTCSessionDescription(c),function(){Janus.log("Remote description accepted!"),J(a,d,b)},b.error));if(null!==b.stream&&void 0!==b.stream){var g=b.stream;return Janus.log("MediaStream provided by the application"),Janus.debug(g),f.streamExternal=!0,void F(a,c,d,b,g)}if(f.trickle=W(b.trickle),R(d)||T(d)){var h={mandatory:{},optional:[]};e.consentDialog(!0);var i=R(d);i===!0&&void 0!=d&&null!=d&&"object"==typeof d.audio&&(i=d.audio);var j=T(d);if(j===!0&&void 0!=d&&null!=d)if(d.video&&"screen"!=d.video&&"window"!=d.video){var k=0,l=0,m=0;if("lowres"===d.video)l=240,m=240,k=320;else if("lowres-16:9"===d.video)l=180,m=180,k=320;else if("hires"===d.video||"hires-16:9"===d.video){if(l=720,m=720,k=1280,navigator.mozGetUserMedia){var n=parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1],10);n<38&&(Janus.warn(d.video+" unsupported, falling back to stdres (old Firefox)"),l=480,m=480,k=640)}}else"stdres"===d.video?(l=480,m=480,k=640):"stdres-16:9"===d.video?(l=360,m=360,k=640):(Janus.log("Default video setting ("+d.video+") is stdres 4:3"),l=480,m=480,k=640);if(Janus.log("Adding media constraint "+d.video),navigator.mozGetUserMedia){var n=parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1],10);j=n<38?{require:["height","width"],height:{max:m,min:l},width:{max:k,min:k}}:{height:{ideal:l},width:{ideal:k}}}else j={mandatory:{maxHeight:m,minHeight:l,maxWidth:k,minWidth:k},optional:[]};"object"==typeof d.video&&(j=d.video),Janus.debug(j)}else if("screen"===d.video||"window"===d.video){if("https:"!==window.location.protocol)return Janus.warn("Screen sharing only works on HTTPS, try the https:// version of this page"),e.consentDialog(!1),void b.error("Screen sharing only works on HTTPS, try the https:// version of this page");var o={};if(window.navigator.userAgent.match("Chrome")){var s=parseInt(window.navigator.userAgent.match(/Chrome\/(.*) /)[1],10),t=33;if(window.navigator.userAgent.match("Linux")&&(t=35),s>=26&&s<=t)h={video:{mandatory:{googLeakyBucket:!0,maxWidth:window.screen.width,maxHeight:window.screen.height,maxFrameRate:3,chromeMediaSource:"screen"}},audio:R(d)},r(h,q);else{var u=window.setTimeout(function(){return w=new Error("NavigatorUserMediaError"),w.name='The required Chrome extension is not installed: click <a href="#">here</a> to install it. (NOTE: this will need you to refresh the page)',e.consentDialog(!1),b.error(w)},1e3);o[u]=[q,null],window.postMessage({type:"janusGetScreen",id:u},"*")}}else if(window.navigator.userAgent.match("Firefox")){var v=parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1],10);if(!(v>=33)){var w=new Error("NavigatorUserMediaError");return w.name="Your version of Firefox does not support screen sharing, please install Firefox 33 (or more recent versions)",e.consentDialog(!1),void b.error(w)}h={video:{mozMediaSource:d.video,mediaSource:d.video},audio:R(d)},r(h,function(a,b){if(q(a,b),!a)var c=b.currentTime,d=window.setInterval(function(){b||window.clearInterval(d),b.currentTime==c&&(window.clearInterval(d),b.onended&&b.onended()),c=b.currentTime},500)})}return void window.addEventListener("message",function(a){if(a.origin==window.location.origin)if("janusGotScreen"==a.data.type&&o[a.data.id]){var c=o[a.data.id],f=c[0];if(delete o[a.data.id],""===a.data.sourceId){var g=new Error("NavigatorUserMediaError");g.name="You cancelled the request for permission, giving up...",e.consentDialog(!1),b.error(g)}else h={audio:R(d),video:{mandatory:{chromeMediaSource:"desktop",maxWidth:window.screen.width,maxHeight:window.screen.height,maxFrameRate:3},optional:[{googLeakyBucket:!0},{googTemporalLayeredScreencast:!0}]}},h.video.mandatory.chromeMediaSourceId=a.data.sourceId,r(h,f)}else"janusGetScreenPending"==a.data.type&&window.clearTimeout(a.data.id)})}null!==d&&void 0!==d&&"screen"===d.video||navigator.mediaDevices.enumerateDevices().then(function(f){var g=f.some(function(a){return"audioinput"===a.kind}),h=f.some(function(a){return"videoinput"===a.kind}),k=R(d),l=T(d);if(k||l){var m=!!k&&g,n=!!l&&h;if(!m&&!n)return e.consentDialog(!1),b.error("No capture device found"),!1}navigator.mediaDevices.getUserMedia({audio:!!g&&i,video:!!h&&j}).then(function(f){e.consentDialog(!1),F(a,c,d,b,f)}).catch(function(a){e.consentDialog(!1),b.error({code:a.code,name:a.name,message:a.message})})}).catch(function(a){e.consentDialog(!1),b.error("enumerateDevices error",a)})}else F(a,c,d,b)}function H(a,b){b=b||{},b.success="function"==typeof b.success?b.success:Janus.noop,b.error="function"==typeof b.error?b.error:P;var c=b.jsep,d=p[a];if(null===d||void 0===d||null===d.webrtcStuff||void 0===d.webrtcStuff)return Janus.warn("Invalid handle"),void b.error("Invalid handle");var e=d.webrtcStuff;if(void 0!==c&&null!==c){if(null===e.pc)return Janus.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep"),void b.error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");e.pc.setRemoteDescription(new RTCSessionDescription(c),function(){Janus.log("Remote description accepted!"),b.success()},b.error)}else b.error("Invalid JSEP")}function I(a,b,c){c=c||{},c.success="function"==typeof c.success?c.success:Janus.noop,c.error="function"==typeof c.error?c.error:Janus.noop;var d=p[a];if(null===d||void 0===d||null===d.webrtcStuff||void 0===d.webrtcStuff)return Janus.warn("Invalid handle"),void c.error("Invalid handle");var e=d.webrtcStuff;Janus.log("Creating offer (iceDone="+e.iceDone+")");var f=null;f="firefox"==webrtcDetectedBrowser||"edge"==webrtcDetectedBrowser?{offerToReceiveAudio:S(b),offerToReceiveVideo:U(b)}:{mandatory:{OfferToReceiveAudio:S(b),OfferToReceiveVideo:U(b)}},Janus.debug(f),e.pc.createOffer(function(a){if(Janus.debug(a),null!==e.mySdp&&void 0!==e.mySdp||(Janus.log("Setting local description"),e.mySdp=a.sdp,e.pc.setLocalDescription(a)),!e.iceDone&&!e.trickle)return void Janus.log("Waiting for all candidates...");if(e.sdpSent)return void Janus.log("Offer already sent, not sending it again");Janus.log("Offer ready"),Janus.debug(c),e.sdpSent=!0;var b={type:a.type,sdp:a.sdp};c.success(b)},c.error,f)}function J(a,b,c){c=c||{},c.success="function"==typeof c.success?c.success:Janus.noop,c.error="function"==typeof c.error?c.error:Janus.noop;var d=p[a];if(null===d||void 0===d||null===d.webrtcStuff||void 0===d.webrtcStuff)return Janus.warn("Invalid handle"),void c.error("Invalid handle");var e=d.webrtcStuff;Janus.log("Creating answer (iceDone="+e.iceDone+")");var f=null;f="firefox"==webrtcDetectedBrowser||"edge"==webrtcDetectedBrowser?{offerToReceiveAudio:S(b),offerToReceiveVideo:U(b)}:{mandatory:{OfferToReceiveAudio:S(b),OfferToReceiveVideo:U(b)}},Janus.debug(f),e.pc.createAnswer(function(a){if(Janus.debug(a),null!==e.mySdp&&void 0!==e.mySdp||(Janus.log("Setting local description"),e.mySdp=a.sdp,e.pc.setLocalDescription(a)),!e.iceDone&&!e.trickle)return void Janus.log("Waiting for all candidates...");if(e.sdpSent)return void Janus.log("Answer already sent, not sending it again");e.sdpSent=!0;var b={type:a.type,sdp:a.sdp};c.success(b)},c.error,f)}function K(a,b){b=b||{},b.success="function"==typeof b.success?b.success:Janus.noop,b.error="function"==typeof b.error?b.error:Janus.noop;var c=p[a];if(null===c||void 0===c||null===c.webrtcStuff||void 0===c.webrtcStuff)return void Janus.warn("Invalid handle, not sending anything");var d=c.webrtcStuff;return Janus.log("Sending offer/answer SDP..."),null===d.mySdp||void 0===d.mySdp?void Janus.warn("Local SDP instance is invalid, not sending anything..."):(d.mySdp={type:d.pc.localDescription.type,sdp:d.pc.localDescription.sdp},d.sdpSent?void Janus.log("Offer/Answer SDP already sent, not sending it again"):(d.trickle===!1&&(d.mySdp.trickle=!1),Janus.debug(b),d.sdpSent=!0,void b.success(d.mySdp)))}function L(a){var b=p[a];if(null===b||void 0===b||null===b.webrtcStuff||void 0===b.webrtcStuff)return Janus.warn("Invalid handle"),0;var c=b.webrtcStuff;return c.pc.getStats&&"chrome"==webrtcDetectedBrowser?null===c.remoteStream||void 0===c.remoteStream?(Janus.warn("Remote stream unavailable"),0):null===c.volume.timer||void 0===c.volume.timer?(Janus.log("Starting volume monitor"),c.volume.timer=setInterval(function(){c.pc.getStats(function(a){for(var b=a.result(),d=0;d<b.length;d++){var e=b[d];"ssrc"==e.type&&e.stat("audioOutputLevel")&&(c.volume.value=e.stat("audioOutputLevel"))}})},200),0):c.volume.value:(Janus.log("Getting the remote volume unsupported by browser"),0)}function M(a,b){var c=p[a];if(null===c||void 0===c||null===c.webrtcStuff||void 0===c.webrtcStuff)return Janus.warn("Invalid handle"),!0;var d=c.webrtcStuff;return null===d.pc||void 0===d.pc?(Janus.warn("Invalid PeerConnection"),!0):void 0===d.myStream||null===d.myStream?(Janus.warn("Invalid local MediaStream"),!0):b?null===d.myStream.getVideoTracks()||void 0===d.myStream.getVideoTracks()||0===d.myStream.getVideoTracks().length?(Janus.warn("No video track"),!0):!d.myStream.getVideoTracks()[0].enabled:null===d.myStream.getAudioTracks()||void 0===d.myStream.getAudioTracks()||0===d.myStream.getAudioTracks().length?(Janus.warn("No audio track"),!0):!d.myStream.getAudioTracks()[0].enabled}function N(a,b,c){var d=p[a];if(null===d||void 0===d||null===d.webrtcStuff||void 0===d.webrtcStuff)return Janus.warn("Invalid handle"),!1;var e=d.webrtcStuff;return null===e.pc||void 0===e.pc?(Janus.warn("Invalid PeerConnection"),!1):void 0===e.myStream||null===e.myStream?(Janus.warn("Invalid local MediaStream"),!1):b?null===e.myStream.getVideoTracks()||void 0===e.myStream.getVideoTracks()||0===e.myStream.getVideoTracks().length?(Janus.warn("No video track"),!1):(e.myStream.getVideoTracks()[0].enabled=!c,!0):null===e.myStream.getAudioTracks()||void 0===e.myStream.getAudioTracks()||0===e.myStream.getAudioTracks().length?(Janus.warn("No audio track"),!1):(e.myStream.getAudioTracks()[0].enabled=!c,!0)}function O(a){var b=p[a];if(null===b||void 0===b||null===b.webrtcStuff||void 0===b.webrtcStuff)return Janus.warn("Invalid handle"),"Invalid handle";var c=b.webrtcStuff;if(null===c.pc||void 0===c.pc)return"Invalid PeerConnection";if(c.pc.getStats&&"chrome"==webrtcDetectedBrowser)return null===c.remoteStream||void 0===c.remoteStream?(Janus.warn("Remote stream unavailable"),"Remote stream unavailable"):null===c.bitrate.timer||void 0===c.bitrate.timer?(Janus.log("Starting bitrate timer (Chrome)"),c.bitrate.timer=setInterval(function(){c.pc.getStats(function(a){for(var b=a.result(),d=0;d<b.length;d++){var e=b[d];if("ssrc"==e.type&&e.stat("googFrameHeightReceived"))if(c.bitrate.bsnow=e.stat("bytesReceived"),c.bitrate.tsnow=e.timestamp,null===c.bitrate.bsbefore||null===c.bitrate.tsbefore)c.bitrate.bsbefore=c.bitrate.bsnow,c.bitrate.tsbefore=c.bitrate.tsnow;else{var f=Math.round(8*(c.bitrate.bsnow-c.bitrate.bsbefore)/(c.bitrate.tsnow-c.bitrate.tsbefore));c.bitrate.value=f+" kbits/sec",c.bitrate.bsbefore=c.bitrate.bsnow,c.bitrate.tsbefore=c.bitrate.tsnow}}})},1e3),"0 kbits/sec"):c.bitrate.value;if(c.pc.getStats&&"firefox"==webrtcDetectedBrowser){if(null===c.remoteStream||void 0===c.remoteStream||null===c.remoteStream.stream||void 0===c.remoteStream.stream)return Janus.warn("Remote stream unavailable"),"Remote stream unavailable";var d=c.remoteStream.stream.getVideoTracks();return null===d||void 0===d||d.length<1?(Janus.warn("No video track"),"No video track"):null===c.bitrate.timer||void 0===c.bitrate.timer?(Janus.log("Starting bitrate timer (Firefox)"),c.bitrate.timer=setInterval(function(){var a=function(a){if(null===a||void 0===a||null==a.inbound_rtp_video_1||null==a.inbound_rtp_video_1)return void(c.bitrate.value="Missing inbound_rtp_video_1");if(c.bitrate.bsnow=a.inbound_rtp_video_1.bytesReceived,c.bitrate.tsnow=a.inbound_rtp_video_1.timestamp,null===c.bitrate.bsbefore||null===c.bitrate.tsbefore)c.bitrate.bsbefore=c.bitrate.bsnow,c.bitrate.tsbefore=c.bitrate.tsnow;else{var b=Math.round(8*(c.bitrate.bsnow-c.bitrate.bsbefore)/(c.bitrate.tsnow-c.bitrate.tsbefore));c.bitrate.value=b+" kbits/sec",c.bitrate.bsbefore=c.bitrate.bsnow,c.bitrate.tsbefore=c.bitrate.tsnow}};c.pc.getStats(d[0],function(b){a(b)},a)},1e3),"0 kbits/sec"):c.bitrate.value}return Janus.warn("Getting the video bitrate unsupported by browser"),"Feature unsupported by browser"}function P(a){Janus.error("WebRTC error:",a)}function Q(a,d){Janus.log("Cleaning WebRTC stuff");var e=p[a];if(null!==e&&void 0!==e){var f=e.webrtcStuff;if(null!==f&&void 0!==f){if(d===!0){var g={janus:"hangup",transaction:t(12)};null!==l&&void 0!==l&&(g.token=l),null!==m&&void 0!==m&&(g.apisecret=m),Janus.debug("Sending hangup request (handle="+a+"):"),Janus.debug(g),b?(g.session_id=o,g.handle_id=a,c.send(JSON.stringify(g))):$.ajax({type:"POST",url:h+"/"+o+"/"+a,cache:!1,contentType:"application/json",data:JSON.stringify(g),dataType:"json"})}f.remoteStream=null,f.volume.timer&&clearInterval(f.volume.timer),f.volume.value=null,f.bitrate.timer&&clearInterval(f.bitrate.timer),f.bitrate.timer=null,f.bitrate.bsnow=null,f.bitrate.bsbefore=null,f.bitrate.tsnow=null,f.bitrate.tsbefore=null,f.bitrate.value=null;try{f.streamExternal||null===f.myStream||void 0===f.myStream||(Janus.log("Stopping local stream"),f.myStream.stop())}catch(a){}try{if(!f.streamExternal&&null!==f.myStream&&void 0!==f.myStream){Janus.log("Stopping local stream tracks");var i=f.myStream.getTracks();for(var j in i){var k=i[j];Janus.log(k),null!==k&&void 0!==k&&k.stop()}}}catch(a){}f.streamExternal=!1,f.myStream=null;try{f.pc.close()}catch(a){}f.pc=null,f.mySdp=null,f.iceDone=!1,f.sdpSent=!1,f.dataChannel=null,f.dtmfSender=null}e.oncleanup()}}function R(a){return Janus.debug("isAudioSendEnabled:",a),
void 0===a||null===a||a.audio!==!1&&(void 0===a.audioSend||null===a.audioSend||a.audioSend===!0)}function S(a){return Janus.debug("isAudioRecvEnabled:",a),void 0===a||null===a||a.audio!==!1&&(void 0===a.audioRecv||null===a.audioRecv||a.audioRecv===!0)}function T(a){return Janus.debug("isVideoSendEnabled:",a),"edge"==webrtcDetectedBrowser?(Janus.warn("Edge doesn't support compatible video yet"),!1):void 0===a||null===a||a.video!==!1&&(void 0===a.videoSend||null===a.videoSend||a.videoSend===!0)}function U(a){return Janus.debug("isVideoRecvEnabled:",a),"edge"==webrtcDetectedBrowser?(Janus.warn("Edge doesn't support compatible video yet"),!1):void 0===a||null===a||a.video!==!1&&(void 0===a.videoRecv||null===a.videoRecv||a.videoRecv===!0)}function V(a){return Janus.debug("isDataEnabled:",a),"edge"==webrtcDetectedBrowser?(Janus.warn("Edge doesn't support data channels yet"),!1):void 0!==a&&null!==a&&a.data===!0}function W(a){return Janus.debug("isTrickleEnabled:",a),void 0===a||null===a||a===!0}if(void 0===Janus.initDone)return a.error("Library not initialized"),{};if(!Janus.isWebrtcSupported())return a.error("WebRTC not supported by this browser"),{};if(Janus.log("Library initialized: "+Janus.initDone),a=a||{},a.success="function"==typeof a.success?a.success:Janus.noop,a.error="function"==typeof a.error?a.error:Janus.noop,a.destroyed="function"==typeof a.destroyed?a.destroyed:Janus.noop,null===a.server||void 0===a.server)return a.error("Invalid gateway url"),{};var b=!1,c=null,d={},e=null,f=null,g=0,h=a.server;Array.isArray(h)?(Janus.log("Multiple servers provided ("+h.length+"), will use the first that works"),h=null,f=a.server,Janus.debug(f)):0===h.indexOf("ws")?(b=!0,Janus.log("Using WebSockets to contact Janus: "+h)):(b=!1,Janus.log("Using REST API to contact Janus: "+h));var i=a.iceServers;void 0!==i&&null!==i||(i=[{url:"stun:stun.l.google.com:19302"}]);var j=a.ipv6;void 0!==j&&null!==j||(j=!1);var k=null;void 0!==a.max_poll_events&&null!==a.max_poll_events&&(k=a.max_poll_events),k<1&&(k=1);var l=null;void 0!==a.token&&null!==a.token&&(l=a.token);var m=null;void 0!==a.apisecret&&null!==a.apisecret&&(m=a.apisecret),this.destroyOnUnload=!0,void 0!==a.destroyOnUnload&&null!==a.destroyOnUnload&&(this.destroyOnUnload=a.destroyOnUnload===!0);var n=!1,o=null,p={},q=this,r=0,s={};x(a),this.getServer=function(){return h},this.isConnected=function(){return n},this.getSessionId=function(){return o},this.destroy=function(a){y(a)},this.attach=function(a){z(a)}}Janus.sessions={},Janus.extensionId="hapfgfdkleiggjjpfpenajgdnfckjpaj",Janus.isExtensionEnabled=function(){if(window.navigator.userAgent.match("Chrome")){var a=parseInt(window.navigator.userAgent.match(/Chrome\/(.*) /)[1],10),b=33;return window.navigator.userAgent.match("Linux")&&(b=35),a>=26&&a<=b||null!==document.getElementById("janus-extension-installed")}return!0},Janus.noop=function(){},Janus.init=function(a){function d(b){function d(){c++,c<b.length?e(b[c],d):a.callback()}b&&Array.isArray(b)&&0!=b.length||a.callback();var c=0;e(b[c],d)}function e(a,b){if("adapter.js"===a&&window.getUserMedia&&window.RTCPeerConnection)return void b();var c=document.getElementsByTagName("head").item(0),d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=function(){Janus.log("Library "+a+" loaded"),b()},c.appendChild(d)}if(a=a||{},a.callback="function"==typeof a.callback?a.callback:Janus.noop,Janus.initDone===!0)a.callback();else{if("undefined"!=typeof console&&"undefined"!=typeof console.log||(console={log:function(){}}),Janus.trace=Janus.noop,Janus.debug=Janus.noop,Janus.log=Janus.noop,Janus.warn=Janus.noop,Janus.error=Janus.noop,a.debug===!0||"all"===a.debug)Janus.trace=console.trace.bind(console),Janus.debug=console.debug.bind(console),Janus.log=console.log.bind(console),Janus.warn=console.warn.bind(console),Janus.error=console.error.bind(console);else if(Array.isArray(a.debug))for(var b in a.debug){var c=a.debug[b];switch(c){case"trace":Janus.trace=console.trace.bind(console);break;case"debug":Janus.debug=console.debug.bind(console);break;case"log":Janus.log=console.log.bind(console);break;case"warn":Janus.warn=console.warn.bind(console);break;case"error":Janus.error=console.error.bind(console);break;default:console.error("Unknown debugging option '"+c+"' (supported: 'trace', 'debug', 'log', warn', 'error')")}}Janus.log("Initializing library"),Janus.listDevices=function(a){a="function"==typeof a?a:Janus.noop,navigator.mediaDevices?getUserMedia({audio:!0,video:!0},function(b){navigator.mediaDevices.enumerateDevices().then(function(c){Janus.debug(c),a(c);try{b.stop()}catch(a){}try{var d=b.getTracks();for(var e in d){var f=d[e];null!==f&&void 0!==f&&f.stop()}}catch(a){}})},function(b){Janus.error(b),a([])}):(Janus.warn("navigator.mediaDevices unavailable"),a([]))},Janus.ajax=function(a){if(null!==a&&void 0!==a){if(a.success="function"==typeof a.success?a.success:Janus.noop,a.error="function"==typeof a.error?a.error:Janus.noop,null===a.url||void 0===a.url)return Janus.error("Missing url",a.url),void a.error(null,-1,"Missing url");a.async=null===a.async||void 0===a.async||a.async===!0,Janus.log(a);var b=new XMLHttpRequest;b.open(a.type,a.url,a.async),null!==a.contentType&&void 0!==a.contentType&&b.setRequestHeader("Content-type",a.contentType),a.async&&(b.onreadystatechange=function(){if(4==b.readyState)return 200!==b.status?(0===b.status&&(b.status="error"),void a.error(b,b.status,"")):void a.success(JSON.parse(b.responseText))});try{if(b.send(a.data),!a.async){if(200!==b.status)return 0===b.status&&(b.status="error"),void a.error(b,b.status,"");a.success(JSON.parse(b.responseText))}}catch(c){a.error(b,"error","")}}},window.onbeforeunload=function(){Janus.log("Closing window");for(var a in Janus.sessions)null!==Janus.sessions[a]&&void 0!==Janus.sessions[a]&&Janus.sessions[a].destroyOnUnload&&(Janus.log("Destroying session "+a),Janus.sessions[a].destroy())},Janus.initDone=!0,d(["adapter.js"])}},Janus.isWebrtcSupported=function(){return window.RTCPeerConnection&&window.getUserMedia};

function comserVideocall()
{
	this.mcutest = null;
	this.maxparticipants = 6;
}

var feeds = [];

comserVideocall.prototype.videocall = function(videoroomid, username, callback)
{
	Janus.init({debug: true, callback: function() 
	{
		janus = new Janus({
			server: "https://216.117.46.193:8889/janus",
			iceServers: [{"url": "stun:stun.l.google.com:19302"}],
			success: function()
			{
				janus.attach({
					plugin:"janus.plugin.videoroom",
					success: function(pluginHandle){
						mcutest = pluginHandle;
						console.log("Plugin attached! (" + mcutest.getPlugin() + ", id=" + mcutest.getId() + ")");
						console.log("  -- This is a publisher/manager");
						// registerUsername(videoroomid, username);
						var create = { "request": "create", "room": videoroomid, "ptype": "publisher", "display": username };
						mcutest.send({"message": create, success: function(result) 
						{
							var event = result["videoroom"];
							console.log("Event: " + event);
							if(event != undefined && event != null) {
								room = result["room"];
								registerUsername(videoroomid, username);
							}
						}});
					},
					error: function(error) {
						console.log("  -- Error attaching plugin... " + error);
					},
					onmessage: function(msg, jsep){
						console.log(" ::: Got a message (publisher) :::");
						console.log(JSON.stringify(msg));
						var event = msg["videoroom"];
						console.log("Event: " + event);
						if(event != undefined && event != null){
							if(event === "joined") {
								myid = msg["id"];
								console.log("Successfully joined room " + msg["room"] + " with ID " + myid);
								publishOwnFeed(true);
								if(msg["publishers"] !== undefined && msg["publishers"] !== null) 
								{
									var list = msg["publishers"];
									console.log("Got a list of available publishers/feeds:");
									console.log(list);
									for(var f in list) {
										var id = list[f]["id"];
										var display = list[f]["display"];
										console.log("  >> [" + id + "] " + display);
										newRemoteFeed(id, display, videoroomid, callback)
									}	
								}
							}
							else if(event === "destroyed") {
								console.log("The room has been destroyed!");
							}
							else if(event === "event") {
								if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
									var list = msg["publishers"];
									console.log("Got a list of available publishers/feeds:");
									console.log(list);
									for(var f in list) {
										var id = list[f]["id"];
										var display = list[f]["display"];
										console.log("  >> [" + id + "] " + display);
										newRemoteFeed(id, display, videoroomid, callback)
									}
								}
								else if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
									// One of the publishers has gone away?
									var leaving = msg["leaving"];
									console.log("Publisher left: " + leaving);
									var remoteFeed = null;
									for(var i=1; i < 6; i++) {
										if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == leaving) {
											remoteFeed = feeds[i];
											break;
										}
									}
									if(remoteFeed != null) 
									{
										console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
										feeds[remoteFeed.rfindex] = null;
										remoteFeed.detach();
										callback('removestream', remoteFeed)
									}
								}
								else if(msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
									// One of the publishers has unpublished?
									var unpublished = msg["unpublished"];
									console.log("Publisher left: " + unpublished);
									var remoteFeed = null;
									for(var i=1; i < this.maxparticipants; i++) {
										if(feeds[i] != null && feeds[i] != undefined && feeds[i].rfid == unpublished) {
											remoteFeed = feeds[i];
											break;
										}
									}
									if(remoteFeed != null) {
										console.log("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
										callback("unpublish", remoteFeed.rfid);
										feeds[remoteFeed.rfindex] = null;
										remoteFeed.detach();
									}
								}
								else if(msg["error"] !== undefined && msg["error"] !== null) {
									// bootbox.alert(msg["error"]);
									callback("error", msg["error"]);
								}
							}
						}
						if(jsep !== undefined && jsep !== null) {
							console.log("Handling SDP as well...");
							console.log(jsep);
							this.mcutest.handleRemoteJsep({jsep: jsep});
						}
					},
					onlocalstream: function(stream) {
						console.log(" ::: Got a local stream :::");
						console.log(JSON.stringify(stream));
						var videoTracks = stream.getVideoTracks();
						if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
							// No webcam
						}
						callback("localstream", stream);
					},
					onremotestream: function(stream) {
					},
					oncleanup: function() {
						console.log(" ::: Got a cleanup notification: we are unpublished now :::");
						// mystream = null;
						// muted = false;
					}
				});
			},
			error: function(){
			},
			destroyed: function(){
			}
		});
	}});
		
}

var registerUsername = function(videoroomid, username)
{
	var register = { "request": "join", "room": videoroomid, "ptype": "publisher", "display": username };
	mcutest.send({"message": register});
}

function newRemoteFeed(id, display, videoroomid, callback)
{
	var remoteFeed = null;
	janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			remoteFeed = pluginHandle;
			var listen = { "request": "join", "room": videoroomid, "ptype": "listener", "feed": id };
			remoteFeed.send({"message": listen});
		},
		error: function(error) {
			console.log("  -- Error attaching plugin... " + error);
		},
		onmessage: function(msg, jsep) {
			console.log(" ::: Got a message (listener) :::");
			console.log(JSON.stringify(msg));
			var event = msg["videoroom"];
			console.log("Event: " + event);
			if(event != undefined && event != null) 
			{
				if(event === "attached"){
					// Subscriber created and attached
					for(var i=1;i < 6;i++) {
						if(feeds[i] === undefined || feeds[i] === null) {
							feeds[i] = remoteFeed;
							remoteFeed.rfindex = i;
							break;
						}
					}
					remoteFeed.rfid = msg["id"];
					remoteFeed.rfdisplay = msg["display"];
				}
			}
			if(jsep !== undefined && jsep !== null) {
				console.log("Handling SDP as well...");
				console.log(jsep);
				// Answer and attach
				remoteFeed.createAnswer(
				{
					jsep: jsep,
					media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
					success: function(jsep) {
						console.log("Got SDP!");
						console.log(jsep);
						var body = { "request": "start", "room": videoroomid };
						remoteFeed.send({"message": body, "jsep": jsep});
					},
					error: function(error) {
						console.log("WebRTC error:");
						console.log(error);
						bootbox.alert("WebRTC error... " + JSON.stringify(error));
					}
				});
			}
		},
		onlocalstream: function(stream) {
			// The subscriber stream is recvonly, we don't expect anything here
		},
		onremotestream: function(stream) {
			callback("remotestream", stream);
		},
		oncleanup: function() {
			console.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
		}
	});
}

function publishOwnFeed(useAudio) {
	// Publish our stream
	mcutest.createOffer(
	{  
		media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true},	// Publishers are sendonly
		success: function(jsep) {
			console.log("Got publisher SDP!");
			console.log(jsep);
			var publish = { "request": "configure", "audio": useAudio, "video": true };
			mcutest.send({"message": publish, "jsep": jsep});
		},
		error: function(error) {
			console.log("WebRTC error:");
			console.log(error);
			if (useAudio) {
				 publishOwnFeed(false);
			} else {
				bootbox.alert("WebRTC error... " + JSON.stringify(error));
			}
		}
	});
}