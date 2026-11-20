(()=>{"use strict";(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,86673,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.baseAssetPath=void 0;let i="u">typeof window&&void 0!==window.document?window.document.currentScript:null,a="/";i&&(a=i.src.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^/]+$/,"/")),r.baseAssetPath=a},24746,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.defaultModelFetcher=void 0,r.defaultModelFetcher=e=>fetch(e).then(e=>e.arrayBuffer())},58676,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.FrameProcessor=r.validateOptions=r.defaultFrameProcessorOptions=void 0;let i=e.r(85612),a=e.r(78871);r.defaultFrameProcessorOptions={positiveSpeechThreshold:.3,negativeSpeechThreshold:.25,preSpeechPadMs:800,redemptionMs:1400,minSpeechMs:400,submitUserSpeechOnPause:!1},r.validateOptions=function(e){(e.positiveSpeechThreshold<0||e.positiveSpeechThreshold>1)&&i.log.error("positiveSpeechThreshold should be a number between 0 and 1"),(e.negativeSpeechThreshold<0||e.negativeSpeechThreshold>e.positiveSpeechThreshold)&&i.log.error("negativeSpeechThreshold should be between 0 and positiveSpeechThreshold"),e.preSpeechPadMs<0&&i.log.error("preSpeechPadMs should be positive"),e.redemptionMs<0&&i.log.error("redemptionMs should be positive"),e.minSpeechMs<0&&i.log.error("minSpeechMs should be positive")};let s=e=>{let t=e.reduce((e,t)=>(e.push(e.at(-1)+t.length),e),[0]),r=new Float32Array(t.at(-1));return e.forEach((e,i)=>{let a=t[i];r.set(e,a)}),r};function n(e,t){let r=Math.floor(e.redemptionMs/t);return{redemptionFrames:r,preSpeechPadFrames:Math.floor(e.preSpeechPadMs/t),minSpeechFrames:Math.floor(e.minSpeechMs/t)}}r.FrameProcessor=class{constructor(e,t,r,i){this.modelProcessFunc=e,this.modelResetFunc=t,this.options=r,this.msPerFrame=i,this.speaking=!1,this.redemptionCounter=0,this.speechFrameCount=0,this.active=!1,this.speechRealStartFired=!1,this.setOptions=e=>{this.options={...this.options,...e};let{redemptionFrames:t,preSpeechPadFrames:r,minSpeechFrames:i}=n(this.options,this.msPerFrame);this.redemptionFrames=t,this.preSpeechPadFrames=r,this.minSpeechFrames=i},this.reset=()=>{this.speaking=!1,this.speechRealStartFired=!1,this.audioBuffer=[],this.modelResetFunc(),this.redemptionCounter=0,this.speechFrameCount=0},this.pause=e=>{this.active=!1,this.options.submitUserSpeechOnPause?this.endSegment(e):this.reset()},this.resume=()=>{this.active=!0},this.endSegment=e=>{let t=this.audioBuffer;this.audioBuffer=[];let r=this.speaking;if(this.reset(),r)if(t.reduce((e,t)=>t.isSpeech?e+1:e,0)>=this.minSpeechFrames){let r=s(t.map(e=>e.frame));e({msg:a.Message.SpeechEnd,audio:r})}else e({msg:a.Message.VADMisfire});return{}},this.process=async(e,t)=>{if(!this.active)return;let r=await this.modelProcessFunc(e),i=r.isSpeech>=this.options.positiveSpeechThreshold;if(t({probs:r,msg:a.Message.FrameProcessed,frame:e}),this.audioBuffer.push({frame:e,isSpeech:i}),i&&(this.speechFrameCount++,this.redemptionCounter=0),i&&!this.speaking&&(this.speaking=!0,t({msg:a.Message.SpeechStart})),this.speaking&&this.speechFrameCount===this.minSpeechFrames&&!this.speechRealStartFired&&(this.speechRealStartFired=!0,t({msg:a.Message.SpeechRealStart})),r.isSpeech<this.options.negativeSpeechThreshold&&this.speaking&&++this.redemptionCounter>=this.redemptionFrames){this.redemptionCounter=0,this.speechFrameCount=0,this.speaking=!1,this.speechRealStartFired=!1;let e=this.audioBuffer;if(this.audioBuffer=[],e.reduce((e,t)=>t.isSpeech?e+1:e,0)>=this.minSpeechFrames){let r=s(e.map(e=>e.frame));t({msg:a.Message.SpeechEnd,audio:r})}else t({msg:a.Message.VADMisfire})}if(!this.speaking){for(;this.audioBuffer.length>this.preSpeechPadFrames;)this.audioBuffer.shift();this.speechFrameCount=0}},this.audioBuffer=[];let{redemptionFrames:o,preSpeechPadFrames:u,minSpeechFrames:l}=n(this.options,this.msPerFrame);this.redemptionFrames=o,this.preSpeechPadFrames=u,this.minSpeechFrames=l,this.reset()}}},62776,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.getDefaultRealTimeVADOptions=r.MicVAD=r.DEFAULT_MODEL=r.utils=r.NonRealTimeVAD=r.Message=r.FrameProcessor=r.defaultModelFetcher=r.baseAssetPath=void 0;var i=e.r(86673);Object.defineProperty(r,"baseAssetPath",{enumerable:!0,get:function(){return i.baseAssetPath}});var a=e.r(24746);Object.defineProperty(r,"defaultModelFetcher",{enumerable:!0,get:function(){return a.defaultModelFetcher}});var s=e.r(58676);Object.defineProperty(r,"FrameProcessor",{enumerable:!0,get:function(){return s.FrameProcessor}});var n=e.r(78871);Object.defineProperty(r,"Message",{enumerable:!0,get:function(){return n.Message}});var o=e.r(82832);Object.defineProperty(r,"NonRealTimeVAD",{enumerable:!0,get:function(){return o.NonRealTimeVAD}});let u=e.r(63836);r.utils={audioFileToArray:u.audioFileToArray,minFramesForTargetMS:u.minFramesForTargetMS,arrayBufferToBase64:u.arrayBufferToBase64,encodeWAV:u.encodeWAV};var l=e.r(34711);Object.defineProperty(r,"DEFAULT_MODEL",{enumerable:!0,get:function(){return l.DEFAULT_MODEL}}),Object.defineProperty(r,"MicVAD",{enumerable:!0,get:function(){return l.MicVAD}}),Object.defineProperty(r,"getDefaultRealTimeVADOptions",{enumerable:!0,get:function(){return l.getDefaultRealTimeVADOptions}})},85612,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.log=void 0;let i=e=>t=>{console.log(`VAD | ${e} >`,t)};r.log={error:i("error"),debug:i("debug"),warn:i("warn")}},78871,(e,t,r)=>{var i,a;Object.defineProperty(r,"__esModule",{value:!0}),r.Message=void 0,(a=i||(r.Message=i={})).AudioFrame="AUDIO_FRAME",a.SpeechStart="SPEECH_START",a.VADMisfire="VAD_MISFIRE",a.SpeechEnd="SPEECH_END",a.SpeechStop="SPEECH_STOP",a.SpeechRealStart="SPEECH_REAL_START",a.FrameProcessed="FRAME_PROCESSED"},65327,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0})},73990,(e,t,r)=>{var i=e.e&&e.e.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r);var a=Object.getOwnPropertyDescriptor(t,r);(!a||("get"in a?!t.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,i,a)}:function(e,t,r,i){void 0===i&&(i=r),e[i]=t[r]}),a=e.e&&e.e.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||i(t,e,r)};Object.defineProperty(r,"__esModule",{value:!0}),r.Silero=r.SileroLegacy=void 0,a(e.r(65327),r);var s=e.r(23953);Object.defineProperty(r,"SileroLegacy",{enumerable:!0,get:function(){return s.SileroLegacy}});var n=e.r(58214);Object.defineProperty(r,"Silero",{enumerable:!0,get:function(){return n.Silero}})},23953,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.SileroLegacy=void 0;let i=e.r(85612);class a{constructor(e,t,r,i,a){this.ortInstance=e,this._session=t,this._h=r,this._c=i,this._sr=a,this.reset_state=()=>{let e=Array(128).fill(0);this._h=new this.ortInstance.Tensor("float32",e,[2,1,64]),this._c=new this.ortInstance.Tensor("float32",e,[2,1,64])},this.process=async e=>{let t={input:new this.ortInstance.Tensor("float32",e,[1,e.length]),h:this._h,c:this._c,sr:this._sr},r=await this._session.run(t);this._h=r.hn,this._c=r.cn;let[i]=r.output?.data;return{notSpeech:1-i,isSpeech:i}},this.release=async()=>{await this._session.release(),this._h.dispose(),this._c.dispose(),this._sr.dispose()}}}r.SileroLegacy=a,a.new=async(e,t)=>{i.log.debug("initializing vad");let r=await t(),s=await e.InferenceSession.create(r),n=new e.Tensor("int64",[16000n]),o=Array(128).fill(0),u=new e.Tensor("float32",o,[2,1,64]),l=new e.Tensor("float32",o,[2,1,64]);return i.log.debug("vad is initialized"),new a(e,s,u,l,n)}},58214,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.Silero=void 0;let i=e.r(85612);function a(e){let t=Array(256).fill(0);return new e.Tensor("float32",t,[2,1,128])}class s{constructor(e,t,r,i){this._session=e,this._state=t,this._sr=r,this.ortInstance=i,this._context=new Float32Array(64),this.reset_state=()=>{this._state=a(this.ortInstance),this._context=new Float32Array(64)},this.process=async e=>{let t=new Float32Array(64+e.length);t.set(this._context,0),t.set(e,64),this._context=e.slice(-64);let r={input:new this.ortInstance.Tensor("float32",t,[1,t.length]),state:this._state,sr:this._sr},i=await this._session.run(r);if(!i.stateN)throw Error("No state from model");if(this._state=i.stateN,!i.output?.data)throw Error("No output from model");let a=i.output.data[0];if("number"!=typeof a)throw Error("Weird output data");return{notSpeech:1-a,isSpeech:a}},this.release=async()=>{await this._session.release(),this._state.dispose(),this._sr.dispose()}}}r.Silero=s,s.new=async(e,t)=>{i.log.debug("Loading VAD...");let r=await t(),n=await e.InferenceSession.create(r),o=new e.Tensor("int64",[16000n]),u=a(e);return i.log.debug("...finished loading VAD"),new s(n,u,o,e)}},82832,(e,t,r)=>{var i=e.e&&e.e.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r);var a=Object.getOwnPropertyDescriptor(t,r);(!a||("get"in a?!t.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,i,a)}:function(e,t,r,i){void 0===i&&(i=r),e[i]=t[r]}),a=e.e&&e.e.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),s=e.e&&e.e.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&i(t,e,r);return a(t,e),t};Object.defineProperty(r,"__esModule",{value:!0}),r.NonRealTimeVAD=r.defaultNonRealTimeVADOptions=void 0;let n=s(e.r(86906)),o=e.r(86673),u=e.r(24746),l=e.r(58676),d=e.r(78871),p=e.r(73990),h=e.r(58906);r.defaultNonRealTimeVADOptions={...l.defaultFrameProcessorOptions,modelURL:o.baseAssetPath+"silero_vad_legacy.onnx",modelFetcher:u.defaultModelFetcher},r.NonRealTimeVAD=class{static async new(e={}){let t={...r.defaultNonRealTimeVADOptions,...e};(0,l.validateOptions)(t),void 0!==t.ortConfig&&t.ortConfig(n);let i=()=>t.modelFetcher(t.modelURL),a=await p.SileroLegacy.new(n,i),s=new l.FrameProcessor(a.process,a.reset_state,{positiveSpeechThreshold:t.positiveSpeechThreshold,negativeSpeechThreshold:t.negativeSpeechThreshold,redemptionMs:t.redemptionMs,preSpeechPadMs:t.preSpeechPadMs,minSpeechMs:t.minSpeechMs,submitUserSpeechOnPause:t.submitUserSpeechOnPause},96);return s.resume(),new this(i,n,t,s)}constructor(e,t,r,i){this.modelFetcher=e,this.ort=t,this.options=r,this.frameProcessor=i,this.frameSamples=1536}async *run(e,t){let r={nativeSampleRate:t,targetSampleRate:16e3,targetFrameSize:this.frameSamples},i=new h.Resampler(r),a=0,s=0,n=0;for await(let t of i.stream(e)){let e=[];for(let r of(await this.frameProcessor.process(t,t=>{e.push(t)}),e))switch(r.msg){case d.Message.SpeechStart:a=n*this.frameSamples/16;break;case d.Message.SpeechEnd:s=(n+1)*this.frameSamples/16,yield{audio:r.audio,start:a,end:s}}n++}let o=[];for(let e of(this.frameProcessor.endSegment(e=>{o.push(e)}),o))e.msg===d.Message.SpeechEnd&&(yield{audio:e.audio,start:a,end:n*this.frameSamples/16})}}},34711,(e,t,r)=>{var i=e.e&&e.e.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r);var a=Object.getOwnPropertyDescriptor(t,r);(!a||("get"in a?!t.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,i,a)}:function(e,t,r,i){void 0===i&&(i=r),e[i]=t[r]}),a=e.e&&e.e.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),s=e.e&&e.e.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&i(t,e,r);return a(t,e),t};Object.defineProperty(r,"__esModule",{value:!0}),r.MicVAD=r.getDefaultRealTimeVADOptions=r.ort=r.DEFAULT_MODEL=void 0;let n=s(e.r(32097)),o=e.r(24746),u=e.r(58676),l=e.r(85612),d=e.r(78871),p=e.r(73990),h=e.r(58906);r.DEFAULT_MODEL="legacy",r.ort=n;let c={legacy:"silero_vad_legacy.onnx",v5:"silero_vad_v5.onnx",v6:"silero_vad_v6.onnx"};async function f(e,t,r,i,a){await r.audioWorklet.addModule(e),t.processorOptions={...t.processorOptions??{},frameSamples:i};let s=new AudioWorkletNode(r,"vad-helper-worklet",t);return s.port.onmessage=async e=>{let t=e.data;if(!("object"==typeof t&&t&&"message"in t))return void console.error("Invalid message event",t);if(t.message===d.Message.AudioFrame){if(!("data"in t&&t.data instanceof ArrayBuffer))return void console.log("Audio frame message has no data");let e=new Float32Array(t.data);await a(e)}},s}async function m(e,t,r){let i=new h.Resampler({nativeSampleRate:e.sampleRate,targetSampleRate:16e3,targetFrameSize:t});l.log.debug("using script processor");let a=e.createScriptProcessor(4096,1,1),s=!1;return a.onaudioprocess=async e=>{if(!s){s=!0;try{let t=e.inputBuffer.getChannelData(0);for(let a of(e.outputBuffer.getChannelData(0).fill(0),i.process(t)))await r(a)}catch(e){console.error("Error processing audio:",e)}finally{s=!1}}},a.connect(e.destination),a}r.getDefaultRealTimeVADOptions=e=>({...u.defaultFrameProcessorOptions,onFrameProcessed:()=>{},onVADMisfire:()=>{l.log.debug("VAD misfire")},onSpeechStart:()=>{l.log.debug("Detected speech start")},onSpeechEnd:()=>{l.log.debug("Detected speech end")},onSpeechRealStart:()=>{l.log.debug("Detected real speech start")},baseAssetPath:"./",onnxWASMBasePath:"./",model:e,workletOptions:{},getStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),pauseStream:async e=>{e.getTracks().forEach(e=>{e.stop()})},resumeStream:async()=>await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,autoGainControl:!0,noiseSuppression:!0}}),ortConfig:e=>{e.env.logLevel="error"},startOnLoad:!0,processorType:"auto"}),r.MicVAD=class e{constructor(e,t,r,i,a=!1,s=null,n=null,o=null,u=null,p=null,h=null,c="uninitialized",g=!1){this.options=e,this.frameProcessor=t,this.model=r,this.frameSamples=i,this.listening=a,this.errored=s,this._stream=n,this._audioContext=o,this._vadNode=u,this._mediaStreamAudioSourceNode=p,this._audioProcessorAdapterType=h,this.initializationState=c,this.ownsAudioContext=g,this.getAudioInstances=()=>{if(null===this._stream||null===this._audioContext||null==this._vadNode||null==this._mediaStreamAudioSourceNode)throw Error("MicVAD has null stream, audio context, or processor adapter");return{stream:this._stream,audioContext:this._audioContext,vadNode:this._vadNode,mediaStreamAudioSourceNode:this._mediaStreamAudioSourceNode}},this.setErrored=e=>{this.initializationState="errored",this.errored=e},this.start=async()=>{switch(this.initializationState){case"uninitialized":l.log.debug("initializing micVAD"),this.initializationState="initializing",this.frameProcessor.resume();try{this._stream=await this.options.getStream()}catch(e){throw e instanceof Error?this.setErrored(e.message):this.setErrored(String(e)),e}if(this.options.audioContext?(console.log("using custom audio context"),this._audioContext=this.options.audioContext):(console.log("using default audio context"),this._audioContext=new AudioContext,this.ownsAudioContext=!0),!this._audioContext)throw this.setErrored("Audio context is null"),Error("Audio context is null");switch(this._audioProcessorAdapterType="auto"==this.options.processorType?"audioWorklet"in this._audioContext&&"function"==typeof AudioWorkletNode?"AudioWorklet":"ScriptProcessor":this.options.processorType,this._audioProcessorAdapterType){case"AudioWorklet":this._vadNode=await f(this.options.baseAssetPath+"vad.worklet.bundle.min.js",this.options.workletOptions,this._audioContext,this.frameSamples,this.processFrame);break;case"ScriptProcessor":this._vadNode=await m(this._audioContext,this.frameSamples,this.processFrame);break;default:throw Error(`Unsupported audio processor adapter type: ${this._audioProcessorAdapterType}`)}this._mediaStreamAudioSourceNode=new MediaStreamAudioSourceNode(this._audioContext,{mediaStream:this._stream}),this._mediaStreamAudioSourceNode.connect(this._vadNode),l.log.debug("started micVAD"),this.listening=!0,this.initializationState="initialized";break;case"initializing":l.log.warn("start called while initializing");break;case"initialized":{if(this.listening)return;this.listening=!0,this.frameProcessor.resume();let{stream:e,audioContext:t,vadNode:r}=this.getAudioInstances();this._stream=await this.options.resumeStream(e);let i=new MediaStreamAudioSourceNode(t,{mediaStream:this._stream});this._mediaStreamAudioSourceNode=i,i.connect(r);break}case"destroyed":l.log.warn("start called after destroyed");break;case"errored":l.log.error("start called after errored");break;default:l.log.warn("weird initialization state")}},this.pause=async()=>{if(!this.listening)return;this.listening=!1;let{stream:e,mediaStreamAudioSourceNode:t}=this.getAudioInstances();await this.options.pauseStream(e),t.disconnect(),this.frameProcessor.pause(this.handleFrameProcessorEvent)},this.destroy=async()=>{l.log.debug("destroy called"),this.initializationState="destroyed";let{vadNode:e}=this.getAudioInstances();e instanceof AudioWorkletNode&&e.port.postMessage(d.Message.SpeechStop),this.listening&&await this.pause(),await this.model.release(),this.ownsAudioContext&&await this._audioContext?.close()},this.setOptions=e=>{this.frameProcessor.setOptions(e)},this.processFrame=async e=>{await this.frameProcessor.process(e,this.handleFrameProcessorEvent)},this.handleFrameProcessorEvent=e=>{switch(e.msg){case d.Message.FrameProcessed:this.options.onFrameProcessed(e.probs,e.frame);break;case d.Message.SpeechStart:this.options.onSpeechStart();break;case d.Message.SpeechRealStart:this.options.onSpeechRealStart();break;case d.Message.VADMisfire:this.options.onVADMisfire();break;case d.Message.SpeechEnd:this.options.onSpeechEnd(e.audio)}}}static async new(t={}){let i,a={...(0,r.getDefaultRealTimeVADOptions)(t.model??r.DEFAULT_MODEL),...t};(0,u.validateOptions)(a),r.ort.env.wasm.wasmPaths=a.onnxWASMBasePath,void 0!==a.ortConfig&&a.ortConfig(r.ort);let s=a.baseAssetPath+c[a.model],n="legacy"===a.model?p.SileroLegacy.new:p.Silero.new;try{i=await n(r.ort,()=>(0,o.defaultModelFetcher)(s))}catch(e){throw console.error(`Encountered an error while loading model file ${s}`),e}let l="legacy"===a.model?1536:512,d=new u.FrameProcessor(i.process,i.reset_state,{positiveSpeechThreshold:a.positiveSpeechThreshold,negativeSpeechThreshold:a.negativeSpeechThreshold,redemptionMs:a.redemptionMs,preSpeechPadMs:a.preSpeechPadMs,minSpeechMs:a.minSpeechMs,submitUserSpeechOnPause:a.submitUserSpeechOnPause},l/16),h=new e(a,d,i,l);if(a.startOnLoad)try{await h.start()}catch(e){throw console.error("Error starting micVad",e),e}return h}}},58906,(e,t,r)=>{Object.defineProperty(r,"__esModule",{value:!0}),r.Resampler=void 0;let i=e.r(85612);r.Resampler=class{constructor(e){this.options=e,this.process=e=>{let t=[];for(let r of e)for(this.inputBuffer.push(r);this.hasEnoughDataForFrame();){let e=this.generateOutputFrame();t.push(e)}return t},e.nativeSampleRate<16e3&&i.log.error("nativeSampleRate is too low. Should have 16000 = targetSampleRate <= nativeSampleRate"),this.inputBuffer=[]}async *stream(e){for(let t of e)for(this.inputBuffer.push(t);this.hasEnoughDataForFrame();){let e=this.generateOutputFrame();yield e}}hasEnoughDataForFrame(){return this.inputBuffer.length*this.options.targetSampleRate/this.options.nativeSampleRate>=this.options.targetFrameSize}generateOutputFrame(){let e=new Float32Array(this.options.targetFrameSize),t=0,r=0;for(;t<this.options.targetFrameSize;){let i=0,a=0;for(;r<Math.min(this.inputBuffer.length,(t+1)*this.options.nativeSampleRate/this.options.targetSampleRate);){let e=this.inputBuffer[r];void 0!==e&&(i+=e,a++),r++}e[t]=i/a,t++}return this.inputBuffer=this.inputBuffer.slice(r),e}}},63836,(e,t,r)=>{function i(e,t,r){for(let i=0;i<r.length;i++)e.setUint8(t+i,r.charCodeAt(i))}Object.defineProperty(r,"__esModule",{value:!0}),r.audioFileToArray=r.encodeWAV=r.arrayBufferToBase64=r.minFramesForTargetMS=void 0,r.minFramesForTargetMS=function(e,t,r=16e3){return Math.ceil(e*r/1e3/t)},r.arrayBufferToBase64=function(e){let t=new Uint8Array(e),r=t.byteLength,i=Array(r);for(let e=0;e<r;e++){let r=t[e];if(void 0===r)break;i[e]=String.fromCharCode(r)}return btoa(i.join(""))},r.encodeWAV=function(e,t=3,r=16e3,a=1,s=32){let n=s/8,o=a*n,u=new ArrayBuffer(44+e.length*n),l=new DataView(u);return i(l,0,"RIFF"),l.setUint32(4,36+e.length*n,!0),i(l,8,"WAVE"),i(l,12,"fmt "),l.setUint32(16,16,!0),l.setUint16(20,t,!0),l.setUint16(22,a,!0),l.setUint32(24,r,!0),l.setUint32(28,r*o,!0),l.setUint16(32,o,!0),l.setUint16(34,s,!0),i(l,36,"data"),l.setUint32(40,e.length*n,!0),1===t?function(e,t,r){for(let i=0;i<r.length;i++,t+=2){let a=Math.max(-1,Math.min(1,r[i]));e.setInt16(t,a<0?32768*a:32767*a,!0)}}(l,44,e):function(e,t,r){for(let i=0;i<r.length;i++,t+=4)e.setFloat32(t,r[i],!0)}(l,44,e),u},r.audioFileToArray=async function(e){let t=new OfflineAudioContext(1,1,44100),r=new FileReader,i=null;if(await new Promise(a=>{r.addEventListener("loadend",()=>{let e=r.result;t.decodeAudioData(e,e=>{i=e,t.startRendering().then(()=>{console.log("Rendering completed successfully"),a()}).catch(e=>{console.error("Rendering failed: ",e)})},e=>{console.log("Error with decoding audio data: ",e)})}),r.readAsArrayBuffer(e)}),null===i)throw Error("some shit");let a=i,s=new Float32Array(a.length);for(let e=0;e<a.length;e++)for(let t=0;t<a.numberOfChannels;t++){let r=a.getChannelData(t)[e],i=s[e];if(void 0===r||void 0===i)throw Error("sample or out[i] is undefined");s[e]=i+r}return{audio:s,sampleRate:a.sampleRate}}},86906,(e,t,r)=>{var i,a,s,n,o,u,l,d,p,h,c,f,m,g,y,_,b,$,w,v,x,S,T,E,k,I,C,z,A,O,R,B,M,D,P,U,L,N,V,q,F,G,W,H,j,K,Z,Q,X,Y,J,ee,et,er,ei,ea,es,en,eo,eu,el,ed,ep,eh,ec,ef,em,eg,ey,e_,eb,e$,ew,ev,ex,eS,eT,eE,ek,eI,eC,ez,eA,eO,eR,eB,eM,eD,eP,eU,eL,eN,eV,eq,eF,eG,eW,eH,ej,eK,eZ,eQ,eX,eY,eJ,e0,e1,e2,e3,e4,e6,e8,e5,e7,e9,te,tt,tr,ti,ta,ts,tn,to,tu,tl,td,tp,th,tc,tf,tm,tg,ty,t_,tb,t$,tw,tv,tx,tS,tT,tE,tk,tI,tC,tz,tA,tO,tR,tB,tM,tD,tP,tU,tL,tN,tV,tq,tF,tG,tW,tH,tj,tK,tZ,tQ,tX,tY,tJ,t0,t1,t2,t3,t4,t6,t8,t5,t7,t9,re,rt,rr,ri,ra,rs,rn,ro,ru,rl,rd,rp,rh,rc,rf,rm,rg,ry,r_,rb,r$,rw,rv,rx,rS,rT,rE,rk,rI,rC,rz,rA,rO,rR,rB,rM,rD,rP,rU,rL,rN,rV,rq,rF,rG,rW,rH,rj,rK,rZ,rQ,rX,rY,rJ,r0,r1,r2,r3,r4,r6,r8,r5,r7,r9,ie,it,ir,ii,ia,is,io,iu,il,id,ip,ih,ic,im,ig,iy,i_,ib,i$,iw,iv,ix,iS,iT,iE,ik,iI,iC,iz,iA,iO,iR,iB,iM,iD,iP,iU,iL,iN,iV,iq,iF,iG,iW,iH,ij,iK,iZ,iQ,iX,iY,iJ,i0,i1,i2,i3,i4,i6,i8,i5,i7,i9,ae,at,ar,ai,aa,as,an,ao,au,al,ad,ap,ah,ac,af,am,ag,ay,a_,ab,a$,aw,av,ax,aS,aT,aE,ak,aI,aC,az,aA,aO,aR,aB,aM,aD,aP,aU,aL,aN,aV,aq,aF,aG,aW,aH,aj,aK,aZ,aQ,aX,aY,aJ,a0,a1,a2,a3,a4,a6,a8,a5,a7,a9,se,st,sr,si,sa,ss,sn,so,su,sl,sd,sp,sh,sc,sf,sm,sg,sy,s_,sb,s$,sw,sv,sx,sS,sT,sE,sk,sI,sC,sz,sA,sO,sR,sB,sM,sD,sP,sU,sL,sN,sV,sq,sF,sG,sW,sH,sj,sK,sZ,sQ,sX,sY,sJ,s0,s1,s2,s3,s4,s6,s8,s5,s7,s9,ne,nt,nr,ni,na,ns,nn,no,nu,nl,nd,np,nh,nc,nf,nm,ng,ny,n_,nb,n$,nw,nv,nx,nS,nT,nE,nk,nI,nC,nz,nA,nO,nR,nB,nM,nD,nP,nU,nL,nN,nV,nq,nF,nG,nW,nH,nj,nK,nZ,nQ,nX,nY,nJ,n0,n1,n2,n3,n4,n6,n8,n5,n7,n9,oe,ot,or,oi,oa,os,on,oo,ou,ol,od,op,oh,oc,of,om,og,oy,o_,ob,o$,ow,ov,ox,oS,oT,oE;let ok;i=Object.defineProperty,a=Object.getOwnPropertyDescriptor,s=Object.getOwnPropertyNames,n=Object.prototype.hasOwnProperty,o=e.t,u=(e,t,r)=>()=>{if(r)throw r[0];try{return e&&(t=e(e=0)),t}catch(e){throw r=[e],e}},l=(e,t)=>{for(var r in t)i(e,r,{get:t[r],enumerable:!0})},d=e=>((e,t,r)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let o of s(t))n.call(e,o)||void 0===o||i(e,o,{get:()=>t[o],enumerable:!(r=a(t,o))||r.enumerable});return e})(i({},"__esModule",{value:!0}),e),_=u(()=>{p=new Map,h=[],c=new WeakMap,f=(e,t,r)=>{if(t&&"function"==typeof t.init&&"function"==typeof t.createInferenceSessionHandler){let i=p.get(e);if(void 0===i)p.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let t=h.indexOf(e);-1!==t&&h.splice(t,1);for(let t=0;t<h.length;t++)if(p.get(h[t]).priority<=r)return void h.splice(t,0,e);h.push(e)}return}throw TypeError("not a valid backend")},m=async e=>{let t=p.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{if(!r){let r=t.backend,i=c.get(r);t.initPromise=i?i.then(async()=>r.init(e),async()=>r.init(e)):r.init(e),c.set(r,t.initPromise)}return await t.initPromise,t.initialized=!0,t.backend}catch(e){return r||(t.error=`${e}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},g=async e=>{let t=e.executionProviders||[],r=t.map(e=>"string"==typeof e?e:e.name),i=0===r.length?h:r,a,s=[],n=new Set;for(let e of i){let t=await m(e);"string"==typeof t?s.push({name:e,err:t}):(a||(a=t),a===t&&n.add(e))}if(!a)throw Error(`no available backend found. ERR: ${s.map(e=>`[${e.name}] ${e.err}`).join(", ")}`);for(let{name:e,err:t}of s)r.includes(e)&&console.warn(`removing requested execution provider "${e}" from session options because it is not available: ${t}`);let o=t.filter(e=>n.has("string"==typeof e?e:e.name));return[a,new Proxy(e,{get:(e,t)=>"executionProviders"===t?o:Reflect.get(e,t)})]},y=async()=>{let e=[];for(let t of h){if("function"!=typeof p.get(t).backend.createLoraAdapterHandler)continue;let r=await m(t);if("string"!=typeof r)return r;e.push({name:t,err:r})}let t=0===e.length?"":` ERR: ${e.map(e=>`[${e.name}] ${e.err}`).join(", ")}`;throw Error(`no available backend supports LoRA adapters.${t}`)}}),b=u(()=>{_()}),w=u(()=>{$="1.31.1"}),S=u(()=>{w(),v="warning",Object.defineProperty(x={wasm:{},webgl:{},webgpu:{},versions:{common:$},set logLevel(e){if(void 0!==e){if("string"!=typeof e||-1===["verbose","info","warning","error","fatal"].indexOf(e))throw Error(`Unsupported logging level: ${e}`);v=e}},get logLevel(){return v}},"logLevel",{enumerable:!0})}),E=u(()=>{S(),T=x}),R=u(()=>{S(),k=(e,t)=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.timeStamp(`${e}::ORT::${t}`)},I=(e,t)=>{let r=Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let a=0;a<r.length;a++){if(i&&!r[a].includes("TRACE_FUNC")){let i=`FUNC_${e}::${r[a].trim().split(" ")[1]}`;t&&(i+=`::${t}`),k("CPU",i);return}r[a].includes("TRACE_FUNC")&&(i=!0)}},C=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&I("BEGIN",e)},z=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&I("END",e)},A=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.time(`ORT::${e}`)},O=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.timeEnd(`ORT::${e}`)}}),M=u(()=>{_(),R(),B=class e{constructor(e,t){this.backend=e,this.handler=t}static async create(t){if(C(),"string"!=typeof t&&!(t instanceof Uint8Array))throw TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let r=await y(),i=await r.createLoraAdapterHandler(t);return z(),new e(r,i)}async release(){return this.handler.dispose()}}}),U=u(()=>{D=(e,t)=>{let r="u">typeof document?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(null!=i){let a,s;t?.tensorLayout!==void 0&&"NHWC"===t.tensorLayout?(a=e.dims[2],s=e.dims[3]):(a=e.dims[3],s=e.dims[2]);let n=t?.format!==void 0?t.format:"RGB",o=t?.norm,u,l;void 0===o||void 0===o.mean?u=[255,255,255,255]:"number"==typeof o.mean?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],void 0!==o.mean[3]&&(u[3]=o.mean[3])),void 0===o||void 0===o.bias?l=[0,0,0,0]:"number"==typeof o.bias?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],void 0!==o.bias[3]&&(l[3]=o.bias[3]));let d=s*a,p=0,h=d,c=2*d,f=-1;"RGBA"===n?(p=0,h=d,c=2*d,f=3*d):"RGB"===n?(p=0,h=d,c=2*d):"RBG"===n&&(p=0,c=d,h=2*d);for(let t=0;t<s;t++)for(let r=0;r<a;r++)i.fillStyle="rgba("+(e.data[p++]-l[0])*u[0]+","+(e.data[h++]-l[1])*u[1]+","+(e.data[c++]-l[2])*u[2]+","+(-1===f?255:(e.data[f++]-l[3])*u[3])+")",i.fillRect(r,t,1,1);if("toDataURL"in r)return r.toDataURL();throw Error("toDataURL is not supported")}throw Error("Can not access image data")},P=(e,t)=>{let r="u">typeof document?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(null!=r){let a,s,n;t?.tensorLayout!==void 0&&"NHWC"===t.tensorLayout?(a=e.dims[2],s=e.dims[1],n=e.dims[3]):(a=e.dims[3],s=e.dims[2],n=e.dims[1]);let o=void 0!==t&&void 0!==t.format?t.format:"RGB",u=t?.norm,l,d;void 0===u||void 0===u.mean?l=[255,255,255,255]:"number"==typeof u.mean?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],void 0!==u.mean[3]&&(l[3]=u.mean[3])),void 0===u||void 0===u.bias?d=[0,0,0,0]:"number"==typeof u.bias?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],void 0!==u.bias[3]&&(d[3]=u.bias[3]));let p=s*a;if(void 0!==t&&(void 0!==t.format&&4===n&&"RGBA"!==t.format||3===n&&"RGB"!==t.format&&"BGR"!==t.format))throw Error("Tensor format doesn't match input tensor dims");let h=0,c=1,f=2,m=3,g=0,y=p,_=2*p,b=-1;"RGBA"===o?(g=0,y=p,_=2*p,b=3*p):"RGB"===o?(g=0,y=p,_=2*p):"RBG"===o&&(g=0,_=p,y=2*p),i=r.createImageData(a,s);for(let t=0;t<s*a;h+=4,c+=4,f+=4,m+=4,t++)i.data[h]=(e.data[g++]-d[0])*l[0],i.data[c]=(e.data[y++]-d[1])*l[1],i.data[f]=(e.data[_++]-d[2])*l[2],i.data[m]=-1===b?255:(e.data[b++]-d[3])*l[3]}else throw Error("Can not access image data");return i}}),W=u(()=>{et(),L=(e,t)=>{if(void 0===e)throw Error("Image buffer must be defined");if(void 0===t.height||void 0===t.width)throw Error("Image height and width must be defined");if("NHWC"===t.tensorLayout)throw Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},s,n;s="number"==typeof a.mean?[a.mean,a.mean,a.mean,a.mean]:[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],n="number"==typeof a.bias?[a.bias,a.bias,a.bias,a.bias]:[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=void 0!==t.format?t.format:"RGBA",u=void 0!==t.tensorFormat&&void 0!==t.tensorFormat?t.tensorFormat:"RGB",l=r*i,d=new Float32Array("RGBA"===u?4*l:3*l),p=4,h=0,c=1,f=2,m=3,g=0,y=l,_=2*l,b=-1;"RGB"===o&&(p=3,h=0,c=1,f=2,m=-1),"RGBA"===u?b=3*l:"RBG"===u?(g=0,_=l,y=2*l):"BGR"===u&&(_=0,y=l,g=2*l);for(let t=0;t<l;t++,h+=p,f+=p,c+=p,m+=p)d[g++]=(e[h]+n[0])/s[0],d[y++]=(e[c]+n[1])/s[1],d[_++]=(e[f]+n[2])/s[2],-1!==b&&-1!==m&&(d[b++]=(e[m]+n[3])/s[3]);return"RGBA"===u?new ee("float32",d,[1,4,r,i]):new ee("float32",d,[1,3,r,i])},N=async(e,t)=>{let r="u">typeof HTMLImageElement&&e instanceof HTMLImageElement,i="u">typeof ImageData&&e instanceof ImageData,a="u">typeof ImageBitmap&&e instanceof ImageBitmap,s="string"==typeof e,n,o=t??{},u=()=>{if("u">typeof document)return document.createElement("canvas");if("u">typeof OffscreenCanvas)return new OffscreenCanvas(1,1);throw Error("Canvas is not supported")},l=e=>"u">typeof HTMLCanvasElement&&e instanceof HTMLCanvasElement||e instanceof OffscreenCanvas?e.getContext("2d"):null;if(r){let r=u();r.width=e.width,r.height=e.height;let i=l(r);if(null!=i){let r=e.height,a=e.width;if(void 0!==t&&void 0!==t.resizedHeight&&void 0!==t.resizedWidth&&(r=t.resizedHeight,a=t.resizedWidth),void 0!==t){if(o=t,void 0!==t.tensorFormat)throw Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=r,o.width=a}else o.tensorFormat="RGBA",o.height=r,o.width=a;i.drawImage(e,0,0),n=i.getImageData(0,0,a,r).data}else throw Error("Can not access image data")}else if(i){let r,i;if(void 0!==t&&void 0!==t.resizedWidth&&void 0!==t.resizedHeight?(r=t.resizedHeight,i=t.resizedWidth):(r=e.height,i=e.width),void 0!==t&&(o=t),o.format="RGBA",o.height=r,o.width=i,void 0!==t){let t=u();t.width=i,t.height=r;let a=l(t);if(null!=a)a.putImageData(e,0,0),n=a.getImageData(0,0,i,r).data;else throw Error("Can not access image data")}else n=e.data}else if(a){if(void 0===t)throw Error("Please provide image config with format for Imagebitmap");let r=u();r.width=e.width,r.height=e.height;let i=l(r);if(null!=i){let t=e.height,r=e.width;return i.drawImage(e,0,0,r,t),n=i.getImageData(0,0,r,t).data,o.height=t,o.width=r,L(n,o)}throw Error("Can not access image data")}else{if(s)return new Promise((t,r)=>{let i=u(),a=l(i);if(!e||!a)return r();let s=new Image;s.crossOrigin="Anonymous",s.src=e,s.onload=()=>{i.width=s.width,i.height=s.height,a.drawImage(s,0,0,i.width,i.height);let e=a.getImageData(0,0,i.width,i.height);o.height=i.height,o.width=i.width,t(L(e.data,o))}});throw Error("Input data provided is not supported - aborted tensor creation")}if(void 0!==n)return L(n,o);throw Error("Input data provided is not supported - aborted tensor creation")},V=(e,t)=>{let{width:r,height:i,download:a,dispose:s}=t;return new ee({location:"texture",type:"float32",texture:e,dims:[1,i,r,4],download:a,dispose:s})},q=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new ee({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:s})},F=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new ee({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:s})},G=(e,t,r)=>new ee({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Q=u(()=>{H=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),j=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),K=!1,Z=()=>{if(!K){K=!0;let e="u">typeof BigInt64Array&&BigInt64Array.from,t="u">typeof BigUint64Array&&BigUint64Array.from,r=globalThis.Float16Array,i="u">typeof r&&r.from;e&&(H.set("int64",BigInt64Array),j.set(BigInt64Array,"int64")),t&&(H.set("uint64",BigUint64Array),j.set(BigUint64Array,"uint64")),i?(H.set("float16",r),j.set(r,"float16")):H.set("float16",Uint16Array)}}}),J=u(()=>{et(),X=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if("number"!=typeof i||!Number.isSafeInteger(i))throw TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},Y=(e,t)=>{switch(e.location){case"cpu":return new ee(e.type,e.data,t);case"cpu-pinned":return new ee({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new ee({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new ee({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new ee({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),et=u(()=>{U(),W(),Q(),J(),ee=class{constructor(e,t,r){let i,a;if(Z(),"object"==typeof e&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let t=H.get(i);if(!t)throw TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof t))throw TypeError(`buffer should be of type ${t.name}`);this.cpuData=e.data;break}case"texture":if("float32"!==i)throw TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break;case"gpu-buffer":if("float32"!==i&&"float16"!==i&&"int32"!==i&&"int64"!==i&&"uint32"!==i&&"uint8"!==i&&"bool"!==i&&"uint4"!==i&&"int4"!==i)throw TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break;case"ml-tensor":if("float32"!==i&&"float16"!==i&&"int32"!==i&&"int64"!==i&&"uint32"!==i&&"uint64"!==i&&"int8"!==i&&"uint8"!==i&&"bool"!==i&&"uint4"!==i&&"int4"!==i)throw TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break;default:throw Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,n;if("string"==typeof e)if(i=e,n=r,"string"===e){if(!Array.isArray(t))throw TypeError("A string tensor's data must be a string array.");s=t}else{let r=H.get(e);if(void 0===r)throw TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if("float16"===e&&r===Uint16Array||"uint4"===e||"int4"===e)throw TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${r.name} as data.`);s="uint64"===e||"int64"===e?r.from(t,BigInt):r.from(t)}else if(t instanceof r)s=t;else if(t instanceof Uint8ClampedArray)if("uint8"===e)s=Uint8Array.from(t);else throw TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if("float16"===e&&t instanceof Uint16Array&&r!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw TypeError(`A ${i} tensor's data must be type of ${r}`)}else if(n=t,Array.isArray(e)){if(0===e.length)throw TypeError("Tensor type cannot be inferred from an empty array.");let t=typeof e[0];if("string"===t)i="string",s=e;else if("boolean"===t)i="bool",s=Uint8Array.from(e);else throw TypeError(`Invalid element type of data array: ${t}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let t=j.get(e.constructor);if(void 0===t)throw TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=t,s=e}if(void 0===n)n=[s.length];else if(!Array.isArray(n))throw TypeError("A tensor's dims must be a number array");a=n,this.cpuData=s,this.dataLocation="cpu"}let s=X(a);if(this.cpuData&&s!==this.cpuData.length&&("uint4"!==i&&"int4"!==i||Math.ceil(s/2)!==this.cpuData.length))throw Error(`Tensor's size(${s}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=s}static async fromImage(e,t){return N(e,t)}static fromTexture(e,t){return V(e,t)}static fromGpuBuffer(e,t){return q(e,t)}static fromMLTensor(e,t){return F(e,t)}static fromPinnedBuffer(e,t,r){return G(e,t,r)}toDataURL(e){return D(this,e)}toImageData(e){return P(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":if(!this.downloader)throw Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}default:throw Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if("none"===this.dataLocation)throw Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw Error("Cannot reshape a tensor that owns GPU resource.");return Y(this,e)}}}),ei=u(()=>{et(),er=ee}),es=u(()=>{_(),M(),ei(),R(),ea=class e{constructor(e,t){this.handler=e,this.backend=t}async run(e,t,r){let i;C(),A("InferenceSession.run");let a={},s={};if("object"!=typeof e||null===e||e instanceof er||Array.isArray(e))throw TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let n=!0;if("object"==typeof t){if(null===t)throw TypeError("Unexpected argument[1]: cannot be null.");if(t instanceof er)throw TypeError("'fetches' cannot be a Tensor");if(Array.isArray(t)){if(0===t.length)throw TypeError("'fetches' cannot be an empty array.");for(let e of(n=!1,t)){if("string"!=typeof e)throw TypeError("'fetches' must be a string array or an object.");if(-1===this.outputNames.indexOf(e))throw RangeError(`'fetches' contains invalid output name: ${e}.`);a[e]=null}if("object"==typeof r&&null!==r)s=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else{let e=!1,i=Object.getOwnPropertyNames(t);for(let r of this.outputNames)if(-1!==i.indexOf(r)){let i=t[r];(null===i||i instanceof er)&&(e=!0,n=!1,a[r]=i)}if(e){if("object"==typeof r&&null!==r)s=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else s=t}}else if("u">typeof t)throw TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let t of this.inputNames)if(typeof e[t]>"u")throw Error(`input '${t}' is missing in 'feeds'.`);if(n)for(let e of this.outputNames)a[e]=null;if(void 0!==s.activeLoraAdapters){if(!Array.isArray(s.activeLoraAdapters))throw TypeError("'activeLoraAdapters' must be an array.");i=s.activeLoraAdapters.map(e=>{if(!(e instanceof B))throw TypeError("'activeLoraAdapters' must be an array of LoraAdapter objects.");if(e.backend!==this.backend)throw Error("LoRA adapter was created by a different backend than the session.");return e.handler})}let o=await this.handler.run(e,a,s,i),u={};for(let e in o)if(Object.hasOwnProperty.call(o,e)){let t=o[e];t instanceof er?u[e]=t:u[e]=new er(t.type,t.data,t.dims)}return O("InferenceSession.run"),z(),u}async release(){return this.handler.dispose()}static async create(t,r,i,a){C(),A("InferenceSession.create");let s,n={};if("string"==typeof t){if(s=t,"object"==typeof r&&null!==r)n=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(s=t,"object"==typeof r&&null!==r)n=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||"u">typeof SharedArrayBuffer&&t instanceof SharedArrayBuffer){let e=0,o=t.byteLength;if("object"==typeof r&&null!==r)n=r;else if("number"==typeof r){if(!Number.isSafeInteger(e=r))throw RangeError("'byteOffset' must be an integer.");if(e<0||e>=t.byteLength)throw RangeError(`'byteOffset' is out of range [0, ${t.byteLength}).`);if(o=t.byteLength-e,"number"==typeof i){if(!Number.isSafeInteger(o=i))throw RangeError("'byteLength' must be an integer.");if(o<=0||e+o>t.byteLength)throw RangeError(`'byteLength' is out of range (0, ${t.byteLength-e}].`);if("object"==typeof a&&null!==a)n=a;else if("u">typeof a)throw TypeError("'options' must be an object.")}else if("u">typeof i)throw TypeError("'byteLength' must be a number.")}else if("u">typeof r)throw TypeError("'options' must be an object.");s=new Uint8Array(t,e,o)}else throw TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await g(n),l=await o.createInferenceSessionHandler(s,u);return O("InferenceSession.create"),z(),new e(l,o)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),eo=u(()=>{es(),en=ea}),el=u(()=>{M(),eu=B}),ed=u(()=>{}),ep=u(()=>{}),eh=u(()=>{}),ec=u(()=>{}),l(ef={},{InferenceSession:()=>en,LoraAdapter:()=>eu,TRACE:()=>k,TRACE_EVENT_BEGIN:()=>A,TRACE_EVENT_END:()=>O,TRACE_FUNC_BEGIN:()=>C,TRACE_FUNC_END:()=>z,Tensor:()=>er,env:()=>T,registerBackend:()=>f}),em=u(()=>{b(),E(),eo(),el(),ei(),ed(),ep(),R(),eh(),ec()}),eg=u(()=>{}),l(ey={},{default:()=>eb}),e$=u(()=>{n0(),eU(),eA(),(e_=globalThis.self?.name==="ort-wasm-proxy-worker")&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":eD(r.wasm).then(()=>{nU(r).then(()=>{postMessage({type:t})},e=>{postMessage({type:t,err:e})})},e=>{postMessage({type:t,err:e})});break;case"init-ep":{let{epName:e,env:i}=r;nL(i,e).then(()=>{postMessage({type:t})},e=>{postMessage({type:t,err:e})});break}case"copy-from":{let{buffer:e}=r,i=nq(e);postMessage({type:t,out:i});break}case"create":{let{model:e,options:i}=r;nF(e,i).then(e=>{postMessage({type:t,out:e})},e=>{postMessage({type:t,err:e})});break}case"release":nG(r),postMessage({type:t});break;case"run":{let{sessionId:e,inputIndices:i,inputs:a,outputIndices:s,options:n}=r;nX(e,i,a,s,Array(s.length).fill(null),n).then(e=>{e.some(e=>"cpu"!==e[3])?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:e},nJ([...a,...e]))},e=>{postMessage({type:t,err:e})});break}case"end-profiling":nY(r),postMessage({type:t})}}catch(e){postMessage({type:t,err:e})}}),eb=e_?null:e=>new Worker(e??ev,{type:"classic",name:"ort-wasm-proxy-worker"})}),eA=u(()=>{eg(),ew=typeof location>"u"?void 0:location.origin,ev="u">typeof document?document.currentScript?.src:"u">typeof self?self.location?.href:void 0,ex=()=>{if(ev&&!ev.startsWith("blob:"))return ev.substring(0,ev.lastIndexOf("/")+1)},eS=(e,t)=>{try{let r=t??ev;return(r?new URL(e,r):new URL(e)).origin===ew}catch{return!1}},eT=async e=>{let t=await (await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},eE=async e=>(await import(e)).default,ek=(e$(),d(ey)).default,eI=async()=>{if(!ev)throw Error("Failed to load proxy worker: cannot determine the script source URL.");if(eS(ev))return[void 0,ek()];let e=await eT(ev);return[e,ek(e)]},eC=void 0,ez=async(e,t,r,i)=>{let a=eC&&!(e||t);if(a)if(ev)a=eS(ev)||i&&!r;else if(i&&!r)a=!0;else throw Error("cannot determine the script source URL.");if(a)return[void 0,eC];{let i,a,s="ort-wasm-simd-threaded.jsep.mjs",n=e??((e,t)=>{let r=t??ev;try{return(r?new URL(e,r):new URL(e)).href}catch{return}})(s,t),o=r&&n&&!eS(n,t),u=o?await eT(n):n??(i=s,a=t,`${a??"./"}${i}`);return[o?u:void 0,await eE(u)]}}}),eU=u(()=>{eA(),eR=!1,eB=!1,eM=!1,eD=async e=>{if(eR)return Promise.resolve();if(eB)throw Error("multiple calls to 'initializeWebAssembly()' detected.");if(eM)throw Error("previous call to 'initializeWebAssembly()' failed.");eB=!0;let t=e.initTimeout,r=e.numThreads;if(!1!==e.simd){if("relaxed"===e.simd){if(!(()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}})())throw Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!(()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}})())throw Error("WebAssembly SIMD is not supported in the current environment.")}let i=(()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return"u">typeof MessageChannel&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}})();r>1&&!i&&("u">typeof self&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,s="string"==typeof a?a:void 0,n=a?.mjs,o=n?.href??n,u=a?.wasm,l=u?.href??u,d=e.wasmBinary,[p,h]=await ez(o,s,r>1,!!d||!!l),c=!1,f=[];if(t>0&&f.push(new Promise(e=>{setTimeout(()=>{c=!0,e()},t)})),f.push(new Promise((e,t)=>{let i={numThreads:r};if(d)i.wasmBinary=d,i.locateFile=e=>e;else if(l||s)i.locateFile=e=>l??s+e;else if(o&&0!==o.indexOf("blob:"))i.locateFile=e=>new URL(e,o).href;else if(p){let e=ex();e&&(i.locateFile=t=>e+t)}h(i).then(t=>{eB=!1,eR=!0,eO=t,e(),p&&URL.revokeObjectURL(p)},e=>{eB=!1,eM=!0,t(e)})})),await Promise.race(f),c)throw Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},eP=()=>{if(eR&&eO)return eO;throw Error("WebAssembly is not initialized yet.")}}),eq=u(()=>{eU(),eL=(e,t)=>{let r=eP(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},eN=(e,t,r,i)=>{if("object"==typeof e&&null!==e){if(r.has(e))throw Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([e,a])=>{let s=t?t+e:e;if("object"==typeof a)eN(a,s+".",r,i);else if("string"==typeof a||"number"==typeof a)i(s,a.toString());else if("boolean"==typeof a)i(s,a?"1":"0");else throw Error(`Can't handle extra config type: ${typeof a}`)})},eV=e=>{let t=eP(),r=t.stackSave();try{let r=t.PTR_SIZE,i=t.stackAlloc(2*r);t._OrtGetLastError(i,i+r);let a=Number(t.getValue(i,4===r?"i32":"i64")),s=t.getValue(i+r,"*"),n=s?t.UTF8ToString(s):"";throw Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${n}`)}finally{t.stackRestore(r)}}}),eG=u(()=>{eU(),eq(),eF=(e,t)=>{let r=eP(),i=0,a=[],s=e||{};try{if(e?.logSeverityLevel===void 0)s.logSeverityLevel=2;else if("number"!=typeof e.logSeverityLevel||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)s.logVerbosityLevel=0;else if("number"!=typeof e.logVerbosityLevel||!Number.isInteger(e.logVerbosityLevel))throw Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(s.terminate=!1);let n=0;for(let o of(e?.tag!==void 0&&(n=eL(e.tag,a)),i=r._OrtCreateRunOptions(s.logSeverityLevel,s.logVerbosityLevel,!!s.terminate,n),0===i&&eV("Can't create run options."),e?.extra!==void 0&&eN(e.extra,"",new WeakSet,(e,t)=>{let s=eL(e,a),n=eL(t,a);0!==r._OrtAddRunConfigEntry(i,s,n)&&eV(`Can't set a run config entry: ${e} - ${t}.`)}),t))0!==r._OrtRunOptionsAddActiveLoraAdapter(i,o)&&eV("Can't add an active LoRA adapter.");return[i,a]}catch(e){throw 0!==i&&r._OrtReleaseRunOptions(i),a.forEach(e=>r._free(e)),e}}}),eK=u(()=>{eU(),eq(),eW=(e,t,r,i)=>{let a=eL(t,i),s=eL(r,i);0!==eP()._OrtAddSessionConfigEntry(e,a,s)&&eV(`Can't set a session config entry: ${t} - ${r}.`)},eH=async(e,t,r)=>{for(let i of t.executionProviders){let t,a="string"==typeof i?i:i.name,s=[],n;switch(a){case"webnn":if(a="WEBNN",eW(e,"session.disable_quant_qdq","1",r),eW(e,"session.disable_qdq_constant_folding","1",r),"string"!=typeof i){let t=i?.deviceType;t&&eW(e,"deviceType",t,r)}break;case"webgpu":if(a="JS","string"!=typeof i&&i?.preferredLayout){if("NCHW"!==i.preferredLayout&&"NHWC"!==i.preferredLayout)throw Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${i.preferredLayout}`);eW(e,"preferredLayout",i.preferredLayout,r)}break;case"wasm":case"cpu":continue;default:throw Error(`not supported execution provider: ${a}`)}let o=s.length,u=0,l=0;if(o>0){u=eP()._malloc(o*eP().PTR_SIZE),r.push(u),l=eP()._malloc(o*eP().PTR_SIZE),r.push(l);for(let e=0;e<o;e++)eP().setValue(u+e*eP().PTR_SIZE,s[e][0],"*"),eP().setValue(l+e*eP().PTR_SIZE,s[e][1],"*")}if(void 0!==n){let i=eP()._malloc(eP().PTR_SIZE);r.push(i),eP().setValue(i,n[0],"*"),t=await eP()._OrtAppendExecutionProviderV2(e,i,1,u,l,o)}else{let i=eL(a,r);t=await eP()._OrtAppendExecutionProvider(e,i,u,l,o)}0!==t&&eV(`Can't append execution provider: ${a}.`)}},ej=async e=>{var t;let r,i=eP(),a=0,s=[],n=e||{};(t=n).extra||(t.extra={}),t.extra.session||(t.extra.session={}),(r=t.extra.session).use_ort_model_bytes_directly||(r.use_ort_model_bytes_directly="1"),t.executionProviders&&t.executionProviders.some(e=>("string"==typeof e?e:e.name)==="webgpu")&&(t.enableMemPattern=!1);try{let e=(e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw Error(`unsupported graph optimization level: ${e}`)}})(n.graphOptimizationLevel??"all"),t=(e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw Error(`unsupported execution mode: ${e}`)}})(n.executionMode??"sequential"),r="string"==typeof n.logId?eL(n.logId,s):0,o=n.logSeverityLevel??2;if(!Number.isInteger(o)||o<0||o>4)throw Error(`log severity level is not valid: ${o}`);let u=n.logVerbosityLevel??0;if(!Number.isInteger(u)||u<0||u>4)throw Error(`log verbosity level is not valid: ${u}`);let l="string"==typeof n.optimizedModelFilePath?eL(n.optimizedModelFilePath,s):0;if(a=i._OrtCreateSessionOptions(e,!!n.enableCpuMemArena,!!n.enableMemPattern,t,!!n.enableProfiling,0,r,o,u,l),0===a&&eV("Can't create session options."),n.executionProviders&&await eH(a,n,s),void 0!==n.enableGraphCapture){if("boolean"!=typeof n.enableGraphCapture)throw Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);eW(a,"enableGraphCapture",n.enableGraphCapture.toString(),s)}if(n.freeDimensionOverrides)for(let[e,t]of Object.entries(n.freeDimensionOverrides)){if("string"!=typeof e)throw Error(`free dimension override name must be a string: ${e}`);if("number"!=typeof t||!Number.isInteger(t)||t<0)throw Error(`free dimension override value must be a non-negative integer: ${t}`);let r=eL(e,s);0!==i._OrtAddFreeDimensionOverride(a,r,t)&&eV(`Can't set a free dimension override: ${e} - ${t}.`)}return void 0!==n.extra&&eN(n.extra,"",new WeakSet,(e,t)=>{eW(a,e,t,s)}),[a,s]}catch(e){throw 0!==a&&0!==i._OrtReleaseSessionOptions(a)&&eV("Can't release session options."),s.forEach(e=>i._free(e)),e}}}),e3=u(()=>{eZ=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw Error(`unsupported data type: ${e}`)}},eQ=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw Error(`unsupported data type: ${e}`)}},eX=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i="number"==typeof t?t:t.reduce((e,t)=>e*t,1);return r>0?Math.ceil(i*r):void 0},eY=e=>{switch(e){case"float16":return"u">typeof Float16Array?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":case"bool":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw Error(`unsupported type: ${e}`)}},eJ=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw Error(`unsupported logging level: ${e}`)}},e0=e=>"float32"===e||"float16"===e||"int32"===e||"int64"===e||"uint32"===e||"uint8"===e||"bool"===e||"uint4"===e||"int4"===e,e1=e=>"float32"===e||"float16"===e||"int32"===e||"int64"===e||"uint32"===e||"uint64"===e||"int8"===e||"uint8"===e||"bool"===e||"uint4"===e||"int4"===e,e2=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw Error(`unsupported data location: ${e}`)}}}),e6=u(()=>{eg(),e4=async e=>{if("string"!=typeof e)return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e);{let t=await fetch(e);if(!t.ok)throw Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<0x40000000)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw Error(`failed to load external data file: ${e}, no response body.`);let r=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(e){if(e instanceof RangeError){let e=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:e,maximum:e}).buffer}else throw e}let s=0;for(;;){let{done:e,value:t}=await r.read();if(e)break;let i=t.byteLength;new Uint8Array(a,s,i).set(t),s+=i}return new Uint8Array(a,0,i)}}}}),tt=u(()=>{e3(),e8=["V","I","W","E","F"],e9=(e,t)=>{e5=e,e7=t},te=(...e)=>{e7&&((e,t)=>{var r,i;let a=eJ(e);a>=eJ(e5)&&(r=a,i="function"==typeof t?t():t,console.log(`[${e8[r]},${new Date().toISOString()}]${i}`))})(...e)}}),tl=u(()=>{tr=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},ti=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(0===i)return t;if(0===a)return e;let s=Math.max(e.length,t.length),n=Array(s);if(r){if(i<2||a<2)return;let r=tr.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(void 0===r)return;[n[s-2],n[s-1]]=r}for(let o=r?3:1;o<=s;o++){let r=i-o<0?1:e[i-o],u=a-o<0?1:t[a-o];if(r!==u&&r>1&&u>1)return;let l=Math.max(r,u);if(r&&u)n[s-o]=Math.max(r,u);else{if(l>1)return;n[s-o]=0}}return n}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(1!==e[r-a]&&e[r-a]!==t[i-a])return!1;return!0}},ta=class e{static size(t){return e.getSizeFromDimensionRange(t,0,t.length)}static convertShape(e,t=4){let r=e.length;if(0===r)return[];let i=Array(r),a=r-1;for(;a>=0;){if(e[a]%t==0){i[a]=e[a]/t;break}if(t%e[a]!=0)throw Error("cannot convert shape");i[a]=1,t/=e[a],a--}for(a--;a>=0;a--)i[a]=e[a];return i}static sizeFromDimension(t,r){if(r<0||r>t.length)throw Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return e.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return e.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(e,t,r){let i=1;for(let a=t;a<r;a++){if(e[a]<0)throw Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");i*=Number(e[a])}return i}static computeStrides(e){let t=e.length;if(0===t)return[];if(1===t)return[1];let r=Array(t);r[t-1]=1,r[t-2]=e[t-1];for(let i=t-3;i>=0;--i)r[i]=r[i+1]*e[i+1];return r}static normalizeAxis(e,t){if(e<-t&&e>=t)throw Error("unsupported axis for this operation.");return e<0?e+t:e}static normalizeAxes(e,t){return e.map(r=>this.normalizeAxis(r,t??e.length))}static sortBasedOnPerm(e,t){return t?t.map(t=>e[t]):e.slice().reverse()}static padShape(e,t){let r=e.length;return e.map((e,i)=>e+t[i]+t[i+r])}static areEqual(e,t){return e.length===t.length&&e.every((e,r)=>e===t[r])}},ts=class e{static adjustPoolAttributes(e,t,r,i,a,s){if(!e&&r.length!==t.length-2)throw Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(e)for(let e=0;e<t.length-2;e++)e>=r.length?r.push(t[e+2]):r[e]=t[e+2];for(let e=0;e<r.length;e++)if(e<i.length){if(i[e]<0)throw Error("strides should be greater than or equal to 1")}else i.push(1);for(let e=0;e<r.length;e++)if(e<a.length){if(a[e]<0)throw Error("dilations should be greater than or equal to 1")}else a.push(1);for(let e=0;e<2*r.length;e++)if(e<s.length){if(s[e]<0)throw Error("pad should be greater than or equal to 1")}else s.push(0);for(let e=0;e<r.length;e++){if(r[e]<=0)throw Error("kernel shapes need to be greater than 0");if(s[e]>=r[e]||s[e+r.length]>=r[e])throw Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,s,n,o){if(o){if(s.length!==2*(t.length-2))throw Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)e.adjustPadAndReturnShape(t[u+(n?1:2)],r[u],i[u],a[u],s,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,i,a,s,n,o,u=0){if(r.length<=0)throw Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return e.computeShapeHelper(t,r,l,i,a,s,n,o,u),l}static computeConvOutputShape(t,r,i,a,s,n,o){if(t.length<=0||r.length<=0)throw Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return e.computeShapeHelper(!1,t,u,i,a,s,n,o),u}static computeShapeHelper(t,r,i,a,s,n,o,u,l=0){if(t)for(let e=0;e<r.length-2;e++)i.push(1);else for(let t=0;t<r.length-2;t++)i.push(e.adjustPadAndReturnShape(r[t+2],a[t],s[t],n[t],o,t,t+r.length-2,u,l))}static computeOutputSize(e,t,r,i,a){let s=Math.floor(e/t)+1;return 1===a&&((s=Math.ceil(e/t)+1)-1)*t>=r+i&&(s-=1),s}static adjustPadAndReturnShape(t,r,i,a,s,n,o,u,l=0){let d=i*(a-1)+1;if(!u||"NOTSET"===u)return e.computeOutputSize(t+s[n]+s[o]-d,r,t,s[n],l);switch(u){case"VALID":return s[n]=0,s[o]=0,e.computeOutputSize(t-d,r,t,0,l);case"SAME_LOWER":case"SAME_UPPER":if(1!==i)throw Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let i=(Math.floor((t+r-1)/r)-1)*r+a-t;return s[n]=Math.floor("SAME_LOWER"===u?(i+1)/2:i/2),s[o]=i-s[n],e.computeOutputSize(t+s[n]+s[o]-d,r,t,s[n],l)}default:throw Error("Unsupported AutoPad type")}}},tn=class{static getShapeOfGemmResult(e,t,r,i,a){let s,n,o;if(2!==e.length||2!==r.length)throw Error("shape need to be of size 2");t?(s=e[1],n=e[0]):(s=e[0],n=e[1]);let u=-1;if(i?(o=r[0],u=1):(o=r[1],u=0),r[u]!==n)throw Error("dimension mismatch");if(s<=0||o<=0||n<=0)throw Error("invalid shape specified");if(a&&!ti.isValidBroadcast(a,[s,o]))throw Error("gemm: invalid bias shape for broadcast");return[s,o,n]}},to=-34028234663852886e22,tu=34028234663852886e22}),tp=u(()=>{e3(),td=(e,t)=>new(eY(t))(e)}),tv=u(()=>{e3(),tt(),th=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),tc=(e,t)=>{if("int32"===t)return e;if(e.byteLength%4!=0)throw Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":return new Uint8Array(BigInt64Array.from(i,BigInt).buffer);case"uint64":if(i.some(e=>e<0))throw Error("Can not convert int32 data to uin64 - negative value found.");return new Uint8Array(BigUint64Array.from(i,BigInt).buffer);case"int8":if(i.some(e=>e<-128||e>127))throw Error("Can not convert int32 data to int8 - value out of range.");return new Uint8Array(Int8Array.from(i,Number).buffer);case"uint8":if(i.some(e=>e<0||e>255))throw Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number);case"uint32":if(i.some(e=>e<0))throw Error("Can not convert int32 data to uint32 - negative value found.");return new Uint8Array(Uint32Array.from(i,Number).buffer);default:throw Error(`Unsupported data conversion from 'int32' to ${t}`)}},tf=1,tm=()=>tf++,tg=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),ty=(e,t)=>{let r=th.get(e);if(!r)throw Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((e,t)=>e*t)*r/8):0},t_=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:s,fallbackDataType:n}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=s,this.fallbackDataType=n}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return ty(this.dataType,this.tensorShape)}destroy(){te("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(!this.fallbackDataType)return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor);{let t=tc(new Uint8Array(await this.mlContext.readTensor(this.mlTensor)),this.dataType);return e?void(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(t):new Uint8Array(t).buffer}}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((e,t)=>e===r[t])}setIsDataConverted(e){this.isDataConverted=e}},tb=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),s=this.tensorManager.getMLOpSupportLimits(e),n;if(!s?.input.dataTypes.includes(t)){if(!(n=tg.get(t))||!s?.input.dataTypes.includes(n))throw Error(`WebNN backend does not support data type: ${t}`);te("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${n}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==ty(t,r))throw Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,o,!0,!0,n),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if("int32"===this.wrapper.fallbackType)t=((e,t)=>{if("int32"===t)return e;let r=th.get(t);if(!r)throw Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!=0)throw Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,s=new(eY(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let e=new Int32Array(a);for(let t=0;t<a;t++){let r=s[t];if(r>2147483647n||r<-2147483648n)throw Error("Can not convert int64 data to int32 - value out of range.");e[t]=Number(r)}return new Uint8Array(e.buffer)}case"int8":case"uint8":case"uint32":if("uint32"===t&&s.some(e=>e>0x7fffffff))throw Error("Can not convert uint32 data to int32 - value out of range.");return new Uint8Array(Int32Array.from(s,Number).buffer);default:throw Error(`Unsupported data conversion from ${t} to 'int32'`)}})(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength)return void this.wrapper.write(t);te("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?tc(this.activeUpload,this.wrapper?.type):this.activeUpload;return e?void(e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t)):t.buffer}if(!this.wrapper)throw Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},t$=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=tm();return this.tensorTrackersById.set(e,new tb(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){te("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let s=this.tensorTrackersById.get(t);if(!s)throw Error("Tensor not found.");return s.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw Error("Tensor not found.");r.upload(t)}async download(e,t){te("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),s=tm(),n=new t_({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(s,new tb(this,n)),this.externalTensors.add(n),s}async getCachedTensor(e,t,r,i,a,s,n){let o=this.getMLContext(e);for(let[i,a]of this.freeTensors.entries())if(a.canReuseTensor(o,t,r)){te("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${n?`fallbackDataType: ${n},`:""} shape: ${r}`);let a=this.freeTensors.splice(i,1)[0];return a.sessionId=e,a}te("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${n?`fallbackDataType: ${n},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:n??t,shape:r,dimensions:r,usage:i,writable:a,readable:s});return new t_({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:n})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},tw=(...e)=>new t$(...e)}),tT=u(()=>{e3(),eU(),tp(),tv(),tt(),tx=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),tS=class{constructor(e){this.tensorManager=tw(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,e9(e.logLevel,!!e.debug)}get currentSessionId(){if(void 0===this.activeSessionId)throw Error("No active session");return this.activeSessionId}onRunStart(e){te("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){te("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let e of t)te("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let t=this.mlContextCache.findIndex(t=>t.gpuDevice===e);if(-1!==t)return this.mlContextCache[t].mlContext;{let t=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:t}),t}}if(void 0===e){let e=this.mlContextCache.findIndex(e=>void 0===e.options&&void 0===e.gpuDevice);if(-1!==e)return this.mlContextCache[e].mlContext;{let e=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:e}),e}}let t=this.mlContextCache.findIndex(t=>((e,t)=>{if(e===t)return!0;if(void 0===e||void 0===t)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((r,a)=>r===i[a]&&e[r]===t[r])})(t.options,e));if(-1!==t)return this.mlContextCache[t].mlContext;{let t=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:t}),t}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),0===r.size){this.sessionIdsByMLContext.delete(t);let e=this.mlContextCache.findIndex(e=>e.mlContext===t);-1!==e&&this.mlContextCache.splice(e,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){te("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let s=tx.get(r);if(!s)throw Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,s,i,a)}async createTemporaryTensor(e,t,r){te("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=tx.get(t);if(!i)throw Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let s=this.temporarySessionTensorIds.get(e);return s?s.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!eP().shouldTransferToMLTensor)throw Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");te("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return td(r,t)}}registerMLTensor(e,t,r,i){let a=tx.get(r);if(!a)throw Error(`Unsupported ONNX data type: ${r}`);let s=this.tensorManager.registerTensor(e,t,a,i);return te("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${s}}`),s}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return!!r&&r.includes(t)}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return!!r&&r.includes(t)}isGraphInputOutputTypeSupported(e,t,r=!0){let i=tx.get(eZ(t)),a=this.mlOpSupportLimitsBySessionId.get(e);return!(typeof i>"u")&&(r?!!a?.input.dataTypes.includes(i):!!a?.output.dataTypes.includes(i))}flush(){}}}),tE=u(()=>{}),tM=u(()=>{tt(),tE(),tk=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[0xc00000,10],[0x1000000,10],[0x1900000,15],[0x2000000,22],[0x2a30000,2],[0x3840000,6],[0x4000000,6],[0x8000000,6],[0xa000000,6]]),tI=[],tC=e=>16*Math.ceil(Number(e)/16),tz=1,tA=()=>tz++,tO=async(e,t,r,i)=>{let a=tC(r),s=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let n=e.getCommandEncoder();e.endComputePass(),n.copyBufferToBuffer(t,0,s,0,a),e.flush(),await s.mapAsync(GPUMapMode.READ);let o=s.getMappedRange();if(!i)return new Uint8Array(o.slice(0,r));{let e=i();return e.set(new Uint8Array(o,0,r)),e}}finally{s.destroy()}},tR=class{constructor(e){for(let[t]of(this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map,tk))tI.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,s=tC(a),n=this.storageCache.get(e);if(!n)throw Error("gpu data for uploading does not exist");if(Number(n.originalSize)!==a)throw Error(`inconsistent data size. gpu data size=${n.originalSize}, data size=${a}`);if(s===a&&i%4==0)this.backend.device.queue.writeBuffer(n.gpuData.buffer,0,r,i,a);else{let e=new Uint8Array(s);e.set(t),this.backend.device.queue.writeBuffer(n.gpuData.buffer,0,e,0,s)}te("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw Error("inconsistent source and destination gpu data size");let a=tC(r.originalSize),s=this.backend.getCommandEncoder();this.backend.endComputePass(),s.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=tA();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),te("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){void 0!==e&&(this.storageCache.delete(e),te("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=(e=>{for(let t=0;t<tI.length;t++){let r=tI[t];if(e<=r)return r}return 16*Math.ceil(e/16)})(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,s=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||s){let e=(a?this.freeBuffers:this.freeUniformBuffers).get(r);i=e&&e.length>0?e.pop():this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let n={id:tA(),type:0,buffer:i};return this.storageCache.set(n.id,{gpuData:n,originalSize:Number(e)}),te("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${n.id}`),n}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t="bigint"==typeof e?Number(e):e,r=this.storageCache.get(t);if(!r){if(0===this.storageCache.size)return 0;throw Error("releasing data does not exist")}return te("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw Error("data does not exist");await tO(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(0!==this.buffersPending.length)if("default"===this.backend.sessionStatus){for(let e of this.buffersPending){let t=tk.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];void 0===t||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];void 0===t||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);for(let t of(e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e)),this.buffersPending))e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(e=>{e.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(e=>{e.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(e=>{e.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(e=>{e.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,0===this.sessionCount&&(te("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.storageCache=new Map)}},tB=(...e)=>new tR(...e)}),tU=u(()=>{tD=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},tP=e=>new tD(e)}),t2=u(()=>{e3(),tl(),tL=64,tN=(e,t)=>{if(3===t)throw Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(4!==t)throw Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw Error(`Unknown data type: ${e}`)}},tV=(e,t=1)=>{let r=tN(e,t);return"string"==typeof r?r:r[0]},tq=(e,t=1)=>{let r=tN(e,t);return"string"==typeof r?r:r[1]},tF=(...e)=>{let t=[];return e.forEach(e=>{0!==e.length&&t.push({type:12,data:e},{type:12,data:ta.computeStrides(e)})}),t},tG=e=>e%4==0?4:e%2==0?2:1,tW=(e="f32",t,r="0")=>t&&1!==t?`vec${t}<${e}>(${r})`:`${e}(${r})`,tH=(e,t,r)=>"f32"===e?r:1===t?`f32(${r})`:`vec${t}<f32>(${r})`,tj=(e,t)=>4===t?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:2===t?`(${e}.x + ${e}.y)`:3===t?`(${e}.x + ${e}.y + ${e}.z)`:e,tK=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?"string"==typeof t?"f16"===i?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:"f16"===i?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,tZ=(e,t,r,i,a)=>{let s,n,o,u,l="number"==typeof r,d=l?r:r.length,p=[...Array(d).keys()],h=d<2?"u32":d<=4?`vec${d}<u32>`:`array<u32, ${d}>`,c=tN(t,a),f="string"==typeof c?c:c[1],m={indices:h,value:f,storage:"string"==typeof c?c:c[0],tensor:t},g=e=>"string"==typeof e?e:`${e}u`,y={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},_=l?"uniforms.":"",b=`${_}${e}_shape`,$=`${_}${e}_strides`,w="";for(let e=0;e<d-1;e++)w+=`
    let dim${e} = current / ${tK($,e,d)};
    let rest${e} = current % ${tK($,e,d)};
    indices[${e}] = dim${e};
    current = rest${e};
    `;w+=`indices[${d-1}] = current;`;let v=d<2?"":`
  fn o2i_${e}(offset: u32) -> ${m.indices} {
    var indices: ${m.indices};
    var current = offset;
    ${w}
    return indices;
  }`,x=[];if(d>=2)for(let e=d-1;e>=0;e--)x.push(`${tK($,e,d)} * (indices[${e}])`);let S=d<2?"":`
  fn i2o_${e}(indices: ${m.indices}) -> u32 {
    return ${x.join("+")};
  }`,T=(...e)=>0===d?"0u":`${m.indices}(${e.map(g).join(",")})`,E=(e,t)=>d<2?`${e}`:`${tK(e,t,d)}`,k={},I=(t,r)=>(()=>{if(m.storage===m.value)return`${e}[${t}]=${r};`;if("vec2<u32>"===m.storage&&"i32"===m.value)return`${e}[${t}]=vec2<u32>(u32(${r}), select(0u, 0xFFFFFFFFu, ${r} < 0));`;if("vec2<u32>"===m.storage&&"u32"===m.value)return`${e}[${t}]=vec2<u32>(u32(${r}), 0u);`;if("u32"===m.storage&&"vec4<bool>"===m.value)return`${e}[${t}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${r}));`;throw Error(`not supported combination of storage type ${m.storage} and value type ${m.value} yet`)})(),C=t=>(()=>{if(m.storage===m.value)return`${e}[${t}]`;if("vec2<u32>"===m.storage&&"i32"===m.value)return`i32(${e}[${t}].x)`;if("vec2<u32>"===m.storage&&"u32"===m.value)return`u32(${e}[${t}].x)`;if("u32"===m.storage&&"vec4<bool>"===m.value)return`vec4<bool>(bool(${e}[${t}] & 0xFFu), bool(${e}[${t}] & 0xFF00u), bool(${e}[${t}] & 0xFF0000u), bool(${e}[${t}] & 0xFF000000u))`;throw Error(`not supported combination of storage type ${m.storage} and value type ${m.value} yet`)})(),z=d<2?"":`
  fn get_${e}ByIndices(indices: ${m.indices}) -> ${f} {
    return ${C(`i2o_${e}(indices)`)};
  }`,A=d<2?"":(s=p.map(e=>`d${e}: u32`).join(", "),n=p.map(e=>`d${e}`).join(", "),`
  fn get_${e}(${s}) -> ${f} {
    return get_${e}ByIndices(${T(n)});
  }`),O=d<2?"":`
  fn set_${e}ByIndices(indices: ${m.indices}, value: ${f}) {
    ${I(`i2o_${e}(indices)`,"value")}
  }`,R=d<2?"":(o=p.map(e=>`d${e}: u32`).join(", "),u=p.map(e=>`d${e}`).join(", "),`
  fn set_${e}(${o}, value: ${f}) {
    set_${e}ByIndices(${T(u)}, value);
  }`);return{impl:()=>{let e=[],t=!1;return y.offsetToIndices&&(e.push(v),t=!0),y.indicesToOffset&&(e.push(S),t=!0),y.broadcastedIndicesToOffset&&(Object.values(k).forEach(t=>e.push(t)),t=!0),y.set&&(e.push(R),t=!0),y.setByIndices&&(e.push(O),t=!0),y.get&&(e.push(A),t=!0),y.getByIndices&&(e.push(z),t=!0),!l&&t&&e.unshift(`const ${b} = ${m.indices}(${r.join(",")});`,`const ${$} = ${m.indices}(${ta.computeStrides(r).join(",")});`),e.join(`
`)},type:m,offsetToIndices:t=>(y.offsetToIndices=!0,d<2?t:`o2i_${e}(${t})`),indicesToOffset:t=>(y.indicesToOffset=!0,d<2?t:`i2o_${e}(${t})`),broadcastedIndicesToOffset:(t,r)=>{y.broadcastedIndicesToOffset=!0;let i=`${r.name}broadcastedIndicesTo${e}Offset`;if(i in k)return`${i}(${t})`;let a=[];for(let e=d-1;e>=0;e--){let t=r.indicesGet("outputIndices",e+r.rank-d);a.push(`${E($,e)} * (${t} % ${E(b,e)})`)}return k[i]=`fn ${i}(outputIndices: ${r.type.indices}) -> u32 {
             return ${a.length>0?a.join("+"):"0u"};
           }`,`${i}(${t})`},indices:T,indicesGet:E,indicesSet:(e,t,r)=>d<2?`${e}=${r};`:`${tK(e,t,d)}=${r};`,set:(...t)=>{if(t.length!==d+1)throw Error(`indices length must be ${d}`);let r=t[d];if("string"!=typeof r)throw Error("value must be string");let i=t.slice(0,d).map(g).join(",");return 0===d?I("0u",r):1===d?I(i[0],r):(y.set=!0,y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}(${i}, ${r})`)},setByOffset:I,setByIndices:(t,r)=>d<2?I(t,r):(y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}ByIndices(${t}, ${r});`),get:(...t)=>{if(t.length!==d)throw Error(`indices length must be ${d}`);let r=t.map(g).join(",");return 0===d?C("0u"):1===d?C(r[0]):(y.get=!0,y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}(${r})`)},getByOffset:C,getByIndices:t=>d<2?C(t):(y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}ByIndices(${t})`),usage:i,name:e,strides:$,shape:b,rank:d}},tQ=(e,t,r,i=1)=>tZ(e,t,r,"input",i),tX=(e,t,r,i=1)=>tZ(e,t,r,"output",i),tY=(e,t,r)=>tZ(e,t,r,"atomicOutput",1),tJ=(e,t,r,i=1)=>tZ(e,t,r,"internal",i),t0=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${"number"==typeof e?`${e}u`:e}) { return; }`}mainStart(e=tL){let t="number"==typeof e?e:e[0],r="number"==typeof e?1:e[1],i="number"==typeof e?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=1===this.normalizedDispatchGroup[1]&&1===this.normalizedDispatchGroup[2],s=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,n=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${s}) {
    ${n}
  `}appendVariableUniforms(e){0!==e.rank&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if("internal"===e.usage)throw Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r="input"===e.usage?"read":"read_write",i="atomicOutput"===e.usage?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(e=>this.declareVariable(e,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if("internal"!==e.usage)throw Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(e=>this.registerInternalVariable(e)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(0===this.uniforms.length)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)"f16"===r?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=null==i||1===i?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(0!==this.uniforms.length)return this.uniforms.map(e=>[[12,10,1,6][["u32","f16","f32","i32"].indexOf(e.type)],e.length??1])}},t1=(e,t)=>new t0(e,t)}),t5=u(()=>{e3(),tl(),tU(),t2(),t3=(e,t)=>0!==t.length?t:[...Array(e).keys()].reverse(),t4=(e,t)=>{let r,i,a=e.dataType,s=e.dims.length,n=t3(s,t),o=(r=e.dims,i=n,ta.sortBasedOnPerm(r,t3(r.length,i))),u=e.dims,l=o;if(s<2||((e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(1!==t[e[i]]){if(e[i]<r)return!1;r=e[i]}return!0})(n,e.dims))return{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let t=ta.size(o);return{outputs:[{dims:o,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(t/64/4)},programUniforms:[{type:12,data:Math.ceil(t/4)}]}},getShaderSource:e=>{let t=tQ("input",a,u,4),r=tX("output",a,l,4);return`
  ${e.registerUniform("output_size","u32").declareVariables(t,r)}
  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`}};let{newShape:d,newPerm:p}=((e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)1!==e[a]&&r.push(e[a]),1!==e[t[a]]&&i.push(t[a]);return{newShape:r,newPerm:i}})(e.dims,n),h=ta.areEqual(p,[2,3,1]),c=ta.areEqual(p,[3,1,2]);return 2===d.length||h||c?(l=[(u=h?[d[0],d[1]*d[2]]:c?[d[0]*d[1],d[2]]:d)[1],u[0]],{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let t=ta.size(o);return{outputs:[{dims:o,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(l[1]/16),y:Math.ceil(l[0]/16)},programUniforms:[{type:12,data:t},...tF(u,l)]}},getShaderSource:e=>{let t=tQ("a",a,u.length),r=tX("output",a,l.length);return`
  ${e.registerUniform("output_size","u32").declareVariables(t,r)}
  var<workgroup> tile : array<array<${r.type.value}, 17>, 16>;
  ${e.mainStart([16,16,1])}
    let stride = (uniforms.output_shape[1] - 1) / 16 + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * 16u + local_id.x;
    let input_row = workgroup_id_x * 16u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${t.getByIndices(`${t.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * 16u + local_id.x;
    let output_row = workgroup_id_y * 16u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${r.setByIndices(`${r.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`}}):{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let t=ta.size(o);return{outputs:[{dims:o,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(t/64)},programUniforms:[{type:12,data:t},...tF(u,l)]}},getShaderSource:e=>{let t=tQ("a",a,u.length),r=tX("output",a,l.length);return`
  ${e.registerUniform("output_size","u32").declareVariables(t,r)}

  ${((e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let r=0;r<t;++r)a+=`a[${e[r]}]=i[${r}];`;return a+"return a;}"})(n,s,t,r)}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${r.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${r.setByOffset("global_idx",t.getByIndices("aIndices"))}
  }`}}},t6=(e,t)=>{((e,t)=>{if(!e||1!==e.length)throw Error("Transpose requires 1 input.");if(0!==t.length&&t.length!==e[0].dims.length)throw Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)})(e.inputs,t.perm),e.compute(t4(e.inputs[0],t.perm))},t8=e=>tP({perm:e.perm})}),rc=u(()=>{e3(),tl(),t2(),rz(),t5(),t7={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},t9={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},re={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},rt={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},rr=(e,t,r,i)=>{var a,s,n,o,u,l,d;let p,h,c,f,m,g,y,_=1===e.inputs.length?r:ry(e.inputs,r),b=_.axes;0!==b.length||_.noopWithEmptyAxes||(b=e.inputs[0].dims.map((e,t)=>t));let $=ta.normalizeAxes(b,e.inputs[0].dims.length),w=$,v=e.inputs[0],x=((e,t)=>{let r=[];if(!((e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0})(e,t)){for(let i=0;i<t;++i)-1===e.indexOf(i)&&r.push(i);e.forEach(e=>r.push(e))}return r})(w,e.inputs[0].dims.length);x.length>0&&(v=e.compute(t4(e.inputs[0],x),{inputs:[0],outputs:[-1]})[0],w=((e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r})(w.length,v.dims.length));let[S,T]=((e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)-1===t.indexOf(a)&&r.push(e[a]);return[r,t.map(t=>e[t])]})(v.dims,w),E=S;_.keepDims&&(E=((e,t)=>{let r=e.length+t.length,i=[],a=0;for(let s=0;s<r;s++)-1===t.indexOf(s)?i.push(e[a++]):i.push(1);return i})(S,$)),e.compute((a=t,s=_.cacheKey,n=[v],o=i,u=e.inputs[0].dataType,l=E,d=T,p=n[0].dims,h=ta.size(l),c=ta.size(d),f=tQ("_A",n[0].dataType,p),m=tX("output",u,l),g=64,1===h&&(g=256),y=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,{name:a,shaderCache:{hint:`${s};${g}`,inputDependencies:["type"]},getShaderSource:e=>`
        ${e.registerUniform("reduceSize","u32").declareVariables(f,m)}
        ${y}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${e.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${re[o]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${f.getByOffset("offset + k")});
           bestValue = ${t7[o]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${t9[o]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${m.setByOffset("outputIndex",`${"mean"===o?`${m.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${m.type.storage}(${rt[o]})`}`)};
         }
        }`,getRunData:()=>({outputs:[{dims:l,dataType:u}],dispatchGroup:{x:h},programUniforms:[{type:12,data:c}]})}),{inputs:[v]})},ri=(e,t)=>{rr(e,"ReduceMeanShared",t,"mean")},ra=(e,t)=>{rr(e,"ReduceL1Shared",t,"l1")},rs=(e,t)=>{rr(e,"ReduceL2Shared",t,"l2")},rn=(e,t)=>{rr(e,"ReduceLogSumExpShared",t,"logSumExp")},ro=(e,t)=>{rr(e,"ReduceMaxShared",t,"max")},ru=(e,t)=>{rr(e,"ReduceMinShared",t,"min")},rl=(e,t)=>{rr(e,"ReduceProdShared",t,"prod")},rd=(e,t)=>{rr(e,"ReduceSumShared",t,"sum")},rp=(e,t)=>{rr(e,"ReduceSumSquareShared",t,"sumSquare")},rh=(e,t)=>{rr(e,"ReduceLogSumShared",t,"logSum")}}),rz=u(()=>{e3(),tl(),tU(),t2(),rc(),rf=e=>{if(!e||0===e.length||e.length>2)throw Error("Reduce op requires 1 or 2 inputs.");if(2===e.length&&1!==e[1].dims.length)throw Error("Invalid axes input dims.")},rm=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],rg=(e,t,r,i,a,s,n=!1,o=!1)=>{let u=[],l=r[0].dims,d=l.length,p=ta.normalizeAxes(a,d),h=!o&&0===p.length;l.forEach((e,t)=>{h||p.indexOf(t)>=0?n&&u.push(1):u.push(e)});let c=u.length,f=ta.size(u);return{name:e,shaderCache:t,getShaderSource:e=>{let t=[],a=tQ("_A",r[0].dataType,d),o=tX("output",s,c),u=i(a,o,p),f=u[2];for(let e=0,r=0;e<d;e++)h||p.indexOf(e)>=0?(n&&r++,f=`for(var j${e}: u32 = 0; j${e} < ${l[e]}; j${e}++) {
                  ${u[2].includes("last_index")?`let last_index = j${e};`:""}
                  ${a.indicesSet("input_indices",e,`j${e}`)}
                  ${f}
                }`):(t.push(`${a.indicesSet("input_indices",e,o.indicesGet("output_indices",r))};`),r++);return`

        ${e.registerUniform("output_size","u32").declareVariables(a,o)}

        ${e.mainStart()}
          ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${a.type.indices};
          let output_indices = ${o.offsetToIndices("global_idx")};

          ${t.join(`
`)}
          ${u[0]}       // init ops for reduce max/min
          ${u[1]}
          ${f}
          ${u[3]}
          ${4===u.length?o.setByOffset("global_idx","value"):u.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:s}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...tF(l,u)]})}},ry=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(e=>r.push(Number(e))),tP({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},r_=(e,t,r,i)=>{let a=e.inputs,s=1===a.length?r:ry(a,r);e.compute(rg(t,{hint:s.cacheKey,inputDependencies:["rank"]},[a[0]],s.noopWithEmptyAxes&&0===s.axes.length?rm:i,s.axes,a[0].dataType,s.keepDims,s.noopWithEmptyAxes),{inputs:[0]})},rb=(e,t,r)=>{if(0===t.length)return r;let i=1,a=1;for(let r=0;r<t.length;r++)-1===t.indexOf(r)?i*=e[r]:a*=e[r];return a<32&&i>1024},r$=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceMean",i,(e,t,i)=>{let a=1;for(let t=0;t<e.rank;t++)(i.indexOf(t)>=0||0===i.length)&&(a*=r.inputs[0].dims[t]);return["var sum = f32(0);","",`sum += f32(${e.getByIndices("input_indices")});`,`let value = ${t.type.value}(sum / ${a});`]})):ri(e,t)},rw=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceL1",i,(e,t)=>[`var value = ${t.type.storage}(0);`,"",`value += abs(${e.getByIndices("input_indices")});`,""])):ra(e,t)},rv=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceL2",i,(e,t)=>[`var t = ${t.type.value}(0); var value = ${t.type.value}(0);`,"",`t = ${e.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])):rs(e,t)},rx=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceLogSumExp",i,(e,t)=>[`var value = ${t.type.storage}(0);`,"",`value += exp(${e.getByIndices("input_indices")});`,"value = log(value);"])):rn(e,t)},rS=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceMax",i,(e,t,r)=>{let i=[];for(let t=0;t<e.rank;t++)(r.indexOf(t)>=0||0===r.length)&&i.push(e.indicesSet("input_indices",t,0));return[`${i.join(`
`)}`,`var value = ${e.getByIndices("input_indices")};`,`value = max(value, ${e.getByIndices("input_indices")});`,""]})):ro(e,t)},rT=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceMin",i,(e,t,r)=>{let i=[];for(let t=0;t<e.rank;t++)(r.indexOf(t)>=0||0===r.length)&&i.push(`input_indices[${t}] = 0;`);return[`${i.join(`
`)}`,`var value = ${e.getByIndices("input_indices")};`,`value = min(value, ${e.getByIndices("input_indices")});`,""]})):ru(e,t)},rE=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceProd",i,(e,t)=>[`var value = ${t.type.storage}(1);`,"",`value *= ${e.getByIndices("input_indices")};`,""])):rl(e,t)},rk=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceSum",i,(e,t)=>[`var value = ${t.type.storage}(0);`,"",`value += ${e.getByIndices("input_indices")};`,""])):rd(e,t)},rI=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceSumSquare",i,(e,t)=>[`var t = ${t.type.value}(0); var value = ${t.type.value}(0);`,"",`t = ${e.getByIndices("input_indices")}; value += t * t;`,""])):rp(e,t)},rC=(e,t)=>{var r,i;rb(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?(r=e,i=t,rf(r.inputs),r_(r,"ReduceLogSum",i,(e,t)=>[`var value = ${t.type.storage}(0);`,"",`value += ${e.getByIndices("input_indices")};`,"value = log(value);"])):rh(e,t)}}),rM=u(()=>{e3(),tU(),rz(),rA=e=>{if(!e||0===e.length||e.length>2)throw Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(1!==e[0].dataType)throw Error("Invalid input type.")},rO=(e,t)=>{rA(e.inputs),e.compute(rg("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],(e,r,i)=>{let a=[];for(let t=0;t<e.rank;t++)(i.indexOf(t)>=0||0===i.length)&&a.push(`input_indices[${t}] = 0;`);return[`${a.join(`
`)}`,`var value = ${e.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${e.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${e.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",r.setByOffset("global_idx","best_index")]},[t.axis],7,t.keepDims),{inputs:[0]})},rR=(e,t)=>{rA(e.inputs),e.compute(rg("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],(e,r,i)=>{let a=[];for(let t=0;t<e.rank;t++)(i.indexOf(t)>=0||0===i.length)&&a.push(`input_indices[${t}] = 0;`);return[`${a.join(`
`)}`,`var value = ${e.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${e.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${e.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",r.setByOffset("global_idx","best_index")]},[t.axis],7,t.keepDims),{inputs:[0]})},rB=e=>tP(e)}),rL=u(()=>{e3(),tl(),tE(),t2(),rD=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,rP=(e,t,r,i,a,s,n,o,u,l,d,p)=>{var h,c,f,m,g,y,_,b,$,w,v,x,S,T,E,k,I,C,z,A,O,R,B,M,D;let P,U,L,N,V,q,F,G,W,H,j,K,Z,Q,X,Y,J,ee,et,er,ei,ea,es,en,eo,eu,el,ed,ep,eh,ec,ef,em,eg=Math.min(e.outputCount,1+ +!!n+ +!!o),ey=eg>1?n:void 0,e_=eg>1?o:void 0,eb=eg>1?l.pastSequenceLength:0,e$=eb+l.kvSequenceLength,ew=u&&ta.size(u.dims)>0?u:void 0,ev=[t,r];ey&&ta.size(ey.dims)>0&&ev.push(ey),ew&&ev.push(ew),d&&ev.push(d),p&&ev.push(p);let ex=e.compute((h=eg,c=t,f=r,m=ey,g=ew,y=l,_=eb,b=d,$=p,P=_+y.kvSequenceLength,U=[y.batchSize,y.numHeads,y.sequenceLength,P],L=h>1&&m,N=y.kvNumHeads?y.kvNumHeads:y.numHeads,V=L?[y.batchSize,N,P,y.headSize]:void 0,q=y.nReps?y.nReps:1,F=0===y.scale?1/Math.sqrt(y.headSize):y.scale,G=tG(y.headSize),W=y.headSize/G,H={x:Math.ceil(P/12),y:Math.ceil(y.sequenceLength/12),z:y.batchSize*y.numHeads},j=[{type:12,data:y.sequenceLength},{type:12,data:W},{type:12,data:P},{type:12,data:y.numHeads},{type:12,data:y.headSize},{type:1,data:F},{type:12,data:_},{type:12,data:y.kvSequenceLength},{type:12,data:q}],K=L&&m&&ta.size(m.dims)>0,Z=["type","type"],K&&Z.push("type"),g&&Z.push("type"),b&&Z.push("type"),$&&Z.push("type"),Q=[{dims:U,dataType:c.dataType,gpuDataType:0}],L&&Q.push({dims:V,dataType:c.dataType,gpuDataType:0}),{name:"AttentionProbs",shaderCache:{hint:`${G};${void 0!==g};${void 0!==m};${h}`,inputDependencies:Z},getRunData:()=>({outputs:Q,dispatchGroup:H,programUniforms:j}),getShaderSource:e=>{let t=tQ("q",c.dataType,c.dims,G),r=[t,tQ("key",f.dataType,f.dims,G)];if(K){let e=tQ("past_key",m.dataType,m.dims,G);r.push(e)}g&&r.push(tQ("attention_bias",g.dataType,g.dims));let i=b?tQ("seq_lens",b.dataType,b.dims):void 0;i&&r.push(i);let a=$?tQ("total_sequence_length_input",$.dataType,$.dims):void 0;a&&r.push(a);let s=tX("output",c.dataType,U),n=[s];L&&n.push(tX("present_key",c.dataType,V,G));let o=tq(1,G);return`
  const TILE_SIZE = 12u;

  var<workgroup> tileQ: array<${t.type.storage}, 144>;
  var<workgroup> tileK: array<${t.type.storage}, 144>;
  ${e.registerUniforms([{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}]).declareVariables(...r,...n)}
  ${e.mainStart([12,12,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${1===q?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${1===q?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${rD(i,a,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${K&&L?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${L?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${o}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${K&&L?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${L?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${o}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(G){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw Error(`Unsupported components: ${G}`)}})()};
        output[outputIdx] = ${s.type.value} (sum * uniforms.alpha) + ${g?"attention_bias[outputIdx]":"0.0"};
    }
  }`}}),{inputs:ev,outputs:eg>1?[-1,1]:[-1]})[0];e.compute((w=ex,v=l.batchSize,x=l.numHeads,S=eb,T=l.sequenceLength,E=e$,k=d,I=p,X=tG(k?1:E),Y=64,(J=E/X)<64&&(Y=32),ee=[{type:12,data:v},{type:12,data:x},{type:12,data:S},{type:12,data:T},{type:12,data:J},{type:12,data:Math.ceil(E/X/Y)}],et=tV(w.dataType,X),er=tq(1,X),ei=["type"],k&&ei.push("type"),I&&ei.push("type"),{name:"AttentionProbsSoftmax",shaderCache:{hint:`${Y};${et};${X}`,inputDependencies:ei},getShaderSource:e=>{let t=tX("x",w.dataType,w.dims,X),r=[t],i=k?tQ("seq_lens",k.dataType,k.dims):void 0;i&&r.push(i);let a=I?tQ("total_sequence_length_input",I.dataType,I.dims):void 0;a&&r.push(a);let s=tq(w.dataType);return`
  var<workgroup> thread_max: array<f32, ${Y}>;
  var<workgroup> thread_sum: array<f32, ${Y}>;
  ${e.registerUniforms([{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}]).declareVariables(...r)}
  ${e.mainStart([Y,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${rD(i,a,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${Y}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${k?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${er}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${er}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(X){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw Error(`Unsupported components: ${X}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${Y}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${er}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${er}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(X){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw Error(`Unsupported components: ${X}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${Y}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${t.type.value}(${s}(1.0) / ${s}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${er}(x[offset + i]);
        x[offset + i] = ${t.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${k?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${t.type.value}(${s}(0));
        }`:""};
  }`},getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:T,z:v*x},programUniforms:ee})}),{inputs:d&&p?[ex,d,p]:[ex],outputs:[]});let eS=[ex,i];e_&&ta.size(e_.dims)>0&&eS.push(e_),d&&eS.push(d),p&&eS.push(p),e.compute((C=eg,z=ex,A=i,O=e_,R=l,B=eb,M=d,D=p,ea=B+R.kvSequenceLength,es=R.nReps?R.nReps:1,en=R.vHiddenSize*es,eo=C>1&&O,eu=R.kvNumHeads?R.kvNumHeads:R.numHeads,el=eo?[R.batchSize,eu,ea,R.headSize]:void 0,ed=[R.batchSize,R.sequenceLength,en],ep={x:Math.ceil(R.vHeadSize/12),y:Math.ceil(R.sequenceLength/12),z:R.batchSize*R.numHeads},eh=[{type:12,data:R.sequenceLength},{type:12,data:ea},{type:12,data:R.vHeadSize},{type:12,data:R.numHeads},{type:12,data:R.headSize},{type:12,data:en},{type:12,data:B},{type:12,data:R.kvSequenceLength},{type:12,data:es}],ec=eo&&O&&ta.size(O.dims)>0,ef=["type","type"],ec&&ef.push("type"),M&&ef.push("type"),D&&ef.push("type"),em=[{dims:ed,dataType:z.dataType,gpuDataType:0}],eo&&em.push({dims:el,dataType:z.dataType,gpuDataType:0}),{name:"AttentionScore",shaderCache:{hint:`${void 0!==O};${C}`,inputDependencies:ef},getRunData:()=>({outputs:em,dispatchGroup:ep,programUniforms:eh}),getShaderSource:e=>{let t=tQ("probs",z.dataType,z.dims),r=[t,tQ("v",A.dataType,A.dims)];ec&&r.push(tQ("past_value",O.dataType,O.dims));let i=M?tQ("seq_lens",M.dataType,M.dims):void 0;M&&r.push(i);let a=D?tQ("total_sequence_length_input",D.dataType,D.dims):void 0;D&&r.push(a);let s=[tX("output",z.dataType,ed)];return eo&&s.push(tX("present_value",z.dataType,el)),`
  const TILE_SIZE = 12u;
  var<workgroup> tileQ: array<${t.type.value}, 144>;
  var<workgroup> tileV: array<${t.type.value}, 144>;
  ${e.registerUniforms([{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}]).declareVariables(...r,...s)}
  ${e.mainStart([12,12,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${1===es?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${1===es?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${rD(i,a,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${ec&&eo?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${eo?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${t.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${ec&&eo?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${eo?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`}}),{inputs:eS,outputs:eg>1?[0,2]:[0]})},rU=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p=((e,t)=>{let r=e[0],i=e[1],a=e[2],s=e[3],n=e[4],o=e[5];if(n&&o)throw Error("Attention cannot have both past and attention_bias");if(3!==r.dims.length)throw Error('Input "input" must have 3 dimensions');let u=r.dims[0],l=r.dims[1],d=r.dims[2];if(1!==a.dims.length)throw Error('Input "bias" is expected to have 1 dimensions');if(2!==i.dims.length)throw Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==d)throw Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=a.dims[0]/3,h=p,c=h;if(t.qkvHiddenSizes.length>0){if(3!==t.qkvHiddenSizes.length)throw Error("qkv_hidden_sizes attribute should have 3 elements");for(let e of t.qkvHiddenSizes)if(e%t.numHeads!=0)throw Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],c=t.qkvHiddenSizes[2]}if(p!==h)throw Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==p+h+c)throw Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let f=0;if(n){if(h!==c)throw Error('Input "past" expect k_hidden_size == v_hidden_size');if(5!==n.dims.length)throw Error('Input "past" must have 5 dimensions');if(2!==n.dims[0])throw Error('Input "past" first dimension must be 2');if(n.dims[1]!==u)throw Error('Input "past" second dimension must be batch_size');if(n.dims[2]!==t.numHeads)throw Error('Input "past" third dimension must be num_heads');if(n.dims[4]!==h/t.numHeads)throw Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(f=n.dims[3])}let m=l+f;if(s)throw Error("Mask not supported");if(n)throw Error("past is not supported");if(o){if(4!==o.dims.length)throw Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==m)throw Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:f,kvSequenceLength:l,totalSequenceLength:m,maxSequenceLength:-1,inputHiddenSize:d,hiddenSize:p,vHiddenSize:c,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(c/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:0,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}})(e.inputs,t),[h,c,f]=(r=e,a=[(i=p).batchSize,i.numHeads,i.sequenceLength,i.headSize],s=i.sequenceLength,n=i.inputHiddenSize,o=i.headSize,u={x:Math.ceil(i.headSize/12),y:Math.ceil(i.sequenceLength/12),z:i.batchSize*i.numHeads},l=[r.inputs[0],r.inputs[1],r.inputs[2]],d=[{type:12,data:s},{type:12,data:n},{type:12,data:o},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:12,data:i.hiddenSize},{type:12,data:i.hiddenSize+i.hiddenSize+i.vHiddenSize}],r.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:a,dataType:r.inputs[0].dataType,gpuDataType:0},{dims:a,dataType:r.inputs[0].dataType,gpuDataType:0},{dims:a,dataType:r.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:d}),getShaderSource:e=>{let t=tX("output_q",l[0].dataType,a),r=tX("output_k",l[0].dataType,a),i=tX("output_v",l[0].dataType,a),s=tQ("input",l[0].dataType,l[0].dims),n=tQ("weight",l[1].dataType,l[1].dims),o=tQ("bias",l[2].dataType,l[2].dims),u=s.type.storage;return`
  const TILE_SIZE = 12u;
  var<workgroup> tileInput: array<${u}, 144>;
  var<workgroup> tileWeightQ: array<${u}, 144>;
  var<workgroup> tileWeightK: array<${u}, 144>;
  var<workgroup> tileWeightV: array<${u}, 144>;
  ${e.registerUniforms([{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}]).declareVariables(s,n,o,t,r,i)}
  ${e.mainStart([12,12,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${u}(0);
    var valueK = ${u}(0);
    var valueV = ${u}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`}},{inputs:l,outputs:[-1,-1,-1]}));return rP(e,h,c,f,e.inputs[4],void 0,void 0,void 0,e.inputs[5],p)}}),rV=u(()=>{em(),e3(),tl(),tU(),t2(),rN=(e,t)=>{let r,{inputs:i,outputCount:a}=e,s=(r={...t,outputCount:a},tP(r));if(T.webgpu.validateInputContent&&((e,t)=>{if(!e||5!==e.length)throw Error("BatchNormalization requires 5 inputs");let r=(e,t,r)=>{let i=t.length;if(i!==e.length)throw Error(`${r}: num dimensions != ${i}`);t.forEach((t,i)=>{if(t!==e[i])throw Error(`${r}: dim[${i}] do not match`)})};if(e[0].dims.length>1){let i="NHWC"===t.format?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")})(i,s),t.trainingMode)throw Error("BatchNormalization trainingMode is not supported yet.");e.compute(((e,t)=>{let{epsilon:r,spatial:i,format:a}=t,s=e[0].dims,n=i?tG(s[s.length-1]):1,o="NHWC"===a&&s.length>1?n:1,u=ta.size(s)/n,l=i?s.length:s,d=tQ("x",e[0].dataType,e[0].dims,n),p=tQ("scale",e[1].dataType,e[1].dims,o),h=tQ("bias",e[2].dataType,e[2].dims,o),c=tQ("inputMean",e[3].dataType,e[3].dims,o),f=tQ("inputVar",e[4].dataType,e[4].dims,o),m=tX("y",e[0].dataType,l,n);return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${n}`,inputDependencies:i?["rank","type","type","type","type"]:void 0},getShaderSource:e=>`
  const epsilon = ${r};
  ${e.registerUniform("outputSize","u32").declareVariables(d,p,h,c,f,m)}
  ${e.mainStart()}
  ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${m.offsetToIndices(`global_idx * ${n}`)};
    ${(()=>{let e="";if(i)e=`let cOffset = ${1===s.length?"0u":"NHWC"===a?`outputIndices[${s.length-1}] / ${n}`:"outputIndices[1]"};`;else if("NCHW"===a)e=`
            ${m.indicesSet("outputIndices","0","0")}
            let cOffset = ${m.indicesToOffset("outputIndices")};`;else{e=`var cIndices = ${p.type.indices}(0);
                       cIndices[0] = outputIndices[${s.length-1}];`;for(let t=1;t<p.rank;t++)e+=`cIndices[${t}] = outputIndices[${t}];`;e+=`let cOffset = ${p.indicesToOffset("cIndices")};`}return e})()}
    let scale = ${p.getByOffset("cOffset")};
    let bias = ${h.getByOffset("cOffset")};
    let inputMean = ${c.getByOffset("cOffset")};
    let inputVar = ${f.getByOffset("cOffset")};
    let x = ${d.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${m.setByOffset("global_idx","value")}
  }`,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:i?[{type:12,data:u},...tF(s)]:[{type:12,data:u}]})}})(i,s))}}),rF=u(()=>{tl(),t2(),rq=e=>{var t;let r,i,a,s,n,o,u,l;(e=>{if(3!==e[0].dims.length)throw Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw Error("number of channels should be 320, 640 or 1280");if(1!==e[1].dims.length)throw Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw Error("last dimension of input and bias are not the same")})(e.inputs),e.compute((r=(t=e.inputs)[0].dims,i=t[0].dims[2],a=ta.size(r)/4,s=t[0].dataType,n=tQ("input",s,r,4),o=tQ("bias",s,[i],4),u=tQ("residual",s,r,4),l=tX("output",s,r,4),{name:"BiasAdd",getRunData:()=>({outputs:[{dims:r,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:e=>`
  const channels = ${i}u / 4;
  ${e.declareVariables(n,o,u,l)}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let value = ${n.getByOffset("global_idx")}
      + ${o.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}))}}),iT=u(()=>{e3(),tl(),tU(),t2(),rG=(e,t,r,i,a,s=e.dataType,n,o)=>{let u=[{type:12,data:Math.ceil(ta.size(e.dims)/4)}];return n&&u.push(...n),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:t=>{var a,n,u,l,d,p,h;let c,f,m,g,y;return a=t,n=ta.size(e.dims),u=e.dataType,l=s,d=r,p=i,h=o,c=Math.ceil(n/4),f="",f="string"==typeof d?`${d}(a)`:d("a"),m=tQ("inputData",u,[c],4),g=tX("outputData",l,[c],4),y=[{name:"vec_size",type:"u32"}],h&&y.push(...h),`
      ${a.registerUniforms(y).declareVariables(m,g)}

  ${p??""}

  ${a.mainStart()}
    ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${m.getByOffset("global_idx")};
    ${g.setByOffset("global_idx",f)}
  }`},getRunData:t=>({outputs:[{dims:e.dims,dataType:s}],dispatchGroup:{x:Math.ceil(ta.size(t[0].dims)/64/4)},programUniforms:u})}},rW=e=>{e.compute(rG(e.inputs[0],"Abs","abs"))},rH=e=>{e.compute(rG(e.inputs[0],"Acos","acos"))},rj=e=>{e.compute(rG(e.inputs[0],"Acosh","acosh"))},rK=e=>{e.compute(rG(e.inputs[0],"Asin","asin"))},rZ=e=>{e.compute(rG(e.inputs[0],"Asinh","asinh"))},rQ=e=>{e.compute(rG(e.inputs[0],"Atan","atan"))},rX=e=>{e.compute(rG(e.inputs[0],"Atanh","atanh"))},rY=e=>tP(e),rJ=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(rG(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},r0=(e,t)=>{let r=t||(e=>{let t,r,i=e.length>=2&&0!==e[1].data,a=e.length>=3&&0!==e[2].data;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw Error("Unsupport data type")}return tP({min:t,max:r})})(e.inputs),i=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"Clip",e=>`clamp(${e}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},r1=e=>{e.compute(rG(e.inputs[0],"Ceil","ceil"))},r2=e=>{e.compute(rG(e.inputs[0],"Cos","cos"))},r3=e=>{e.compute(rG(e.inputs[0],"Cosh","cosh"))},r4=e=>tP(e),r6=(e,t)=>{let r=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"Elu",e=>`elu_vf32(${e})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},r8=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,r5=e=>{let t=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"Erf",e=>`erf_vf32(${e})`,r8(t)))},r7=e=>{e.compute(rG(e.inputs[0],"Exp","exp"))},r9=e=>{e.compute(rG(e.inputs[0],"Floor","floor"))},ie=e=>{let t=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"Gelu",e=>`0.5 * ${e} * (1.0 + erf_vf32(${e} * 0.7071067811865475))`,r8(t)))},it=(e,t)=>{let r=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"LeakyRelu",e=>`select(leaky_relu_alpha_ * ${e}, ${e}, ${e} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},ir=e=>{e.compute(rG(e.inputs[0],"Not",e=>`!${e}`))},ii=e=>{e.compute(rG(e.inputs[0],"Neg",e=>`-${e}`))},ia=e=>{e.compute(rG(e.inputs[0],"Reciprocal",e=>`1.0/${e}`))},is=e=>{let t=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"Relu",e=>`select(vec4<${t}>(0.0), ${e}, ${e} > vec4<${t}>(0.0))`))},io=e=>{e.compute(rG(e.inputs[0],"Sigmoid",e=>`(1.0 / (1.0 + exp(-${e})))`))},iu=e=>tP(e),il=(e,t)=>{let r=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"HardSigmoid",e=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${e} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},id=e=>{let t=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"HardSwish",e=>`${e} * max(vec4<${t}>(0.0), min(vec4<${t}>(1.0), vec4<${t}>(${t}(1.0 / 6.0)) * ${e} + vec4<${t}>(0.5)))`))},ip=e=>{e.compute(rG(e.inputs[0],"Sin","sin"))},ih=e=>{e.compute(rG(e.inputs[0],"Sinh","sinh"))},ic=e=>{e.compute(rG(e.inputs[0],"Sqrt","sqrt"))},im=e=>{e.compute(rG(e.inputs[0],"Tan","tan"))},ig=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,iy=e=>{e.compute(rG(e.inputs[0],"Tanh",ig))},i_=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${ig("v")};
}
`,ib=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,i$=e=>{let t=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"FastGelu",ib,i_(t),void 0,e.inputs[0].dataType))},iw=(e,t)=>{let r=tq(e.inputs[0].dataType);return e.compute(rG(e.inputs[0],"ThresholdedRelu",e=>`select(vec4<${r}>(0.0), ${e}, ${e} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},iv=e=>{e.compute(rG(e.inputs[0],"Log","log"))},ix=e=>`quick_gelu_impl(${e})`,iS=(e,t)=>{let r,i,a=tq(e.inputs[0].dataType);e.compute(rG(e.inputs[0],"QuickGelu",ix,(r=a,i=t.alpha,`
const alpha = vec4<${r}>(${i});
const one = ${r}(1.0);
const zero = ${r}(0.0);

fn quick_gelu_impl(x: vec4<${r}>) -> vec4<${r}> {
  let v = x *alpha;
  var x1 : vec4<${r}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`),t.cacheKey,e.inputs[0].dataType))}}),ik=u(()=>{tl(),t2(),iT(),iE=e=>{var t;let r,i,a,s,n,o;(e=>{if(3!==e[0].dims.length)throw Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw Error("hidden state should be 2560, 5120 or 10240");if(1!==e[1].dims.length)throw Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw Error("last dimension of input and bias are not the same")})(e.inputs),e.compute(((r=(t=e.inputs)[0].dims.slice())[2]=r[2]/2,i=tQ("input",t[0].dataType,t[0].dims,4),a=tQ("bias",t[0].dataType,[t[0].dims[2]],4),s=tX("output",t[0].dataType,r,4),n=ta.size(r)/4,o=tV(t[0].dataType),{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:r,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:e=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${t[0].dims[2]/4/2}u;

  ${e.declareVariables(i,a,s)}

  ${r8(o)}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${s.setByOffset("global_idx","valueLeft * geluRight")}
  }`}))}}),iL=u(()=>{e3(),tl(),t2(),iI=(e,t,r,i,a,s)=>{e.compute(((e,t,r,i,a,s,n=r.dataType)=>{let o=r.dims.map(Number),u=i.dims.map(Number),l=!ta.areEqual(o,u),d=o,p=ta.size(o),h=!1,c=!1,f=[l];if(l){let e=ti.calcShape(o,u,!1);if(!e)throw Error("Can't perform binary op on the given tensors");d=e.slice(),p=ta.size(d);let t=1===ta.size(o),r=1===ta.size(u),i=o.length>0&&o[o.length-1]%4==0,a=u.length>0&&u[u.length-1]%4==0;f.push(t),f.push(r),f.push(i),f.push(a);let s=1;for(let e=1;e<d.length;e++){let t=o[o.length-e];if(t===u[u.length-e])s*=t;else break}s%4==0?(c=!0,h=!0):(t||r||i||a)&&(h=!0)}else h=!0;return f.push(h),{name:e,shaderCache:{hint:t+f.map(e=>e.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:e=>((e,t,r,i,a,s,n,o,u,l,d,p)=>{let h,c;"string"==typeof o?h=c=(e,t)=>`${o}((${e}),(${t}))`:"function"==typeof o?h=c=o:(h=o.scalar,c=o.vector);let f=tX("outputData",d,i.length,4),m=tQ("aData",u,t.length,4),g=tQ("bData",l,r.length,4),y;if(a)if(s){let e=1===ta.size(t),i=1===ta.size(r),a=t.length>0&&t[t.length-1]%4==0,s=r.length>0&&r[r.length-1]%4==0;y=e||i?f.setByOffset("global_idx",c(e?`${m.type.value}(${m.getByOffset("0")}.x)`:m.getByOffset("global_idx"),i?`${g.type.value}(${g.getByOffset("0")}.x)`:g.getByOffset("global_idx"))):`
            let outputIndices = ${f.offsetToIndices("global_idx * 4u")};
            let offsetA = ${m.broadcastedIndicesToOffset("outputIndices",f)};
            let offsetB = ${g.broadcastedIndicesToOffset("outputIndices",f)};
            ${f.setByOffset("global_idx",c(n||a?m.getByOffset("offsetA / 4u"):`${m.type.value}(${m.getByOffset("offsetA / 4u")}[offsetA % 4u])`,n||s?g.getByOffset("offsetB / 4u"):`${g.type.value}(${g.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else y=f.setByOffset("global_idx",c(m.getByOffset("global_idx"),g.getByOffset("global_idx")));else{if(!s)throw Error("no necessary to use scalar implementation for element-wise binary op implementation.");let e=(e,t,r="")=>{let i=`aData[indexA${t}][componentA${t}]`,a=`bData[indexB${t}][componentB${t}]`;return`
            let outputIndices${t} = ${f.offsetToIndices(`global_idx * 4u + ${t}u`)};
            let offsetA${t} = ${m.broadcastedIndicesToOffset(`outputIndices${t}`,f)};
            let offsetB${t} = ${g.broadcastedIndicesToOffset(`outputIndices${t}`,f)};
            let indexA${t} = offsetA${t} / 4u;
            let indexB${t} = offsetB${t} / 4u;
            let componentA${t} = offsetA${t} % 4u;
            let componentB${t} = offsetB${t} % 4u;
            ${e}[${t}] = ${r}(${h(i,a)});
          `};y=9===d?`
            var data = vec4<u32>(0);
            ${e("data",0,"u32")}
            ${e("data",1,"u32")}
            ${e("data",2,"u32")}
            ${e("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:`
            ${e("outputData[global_idx]",0)}
            ${e("outputData[global_idx]",1)}
            ${e("outputData[global_idx]",2)}
            ${e("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(m,g,f)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${y}
      }`})(e,o,u,d,h,l,c,a,r.dataType,i.dataType,n,s),getRunData:()=>({outputs:[{dims:d,dataType:n}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(ta.size(d)/4)},...tF(o,u,d)]})}})(t,a??"",e.inputs[0],e.inputs[1],r,i,s))},iC=e=>{iI(e,"Add",(e,t)=>`${e}+${t}`)},iz=e=>{iI(e,"Div",(e,t)=>`${e}/${t}`)},iA=e=>{iI(e,"Equal",{scalar:(e,t)=>`u32(${e}==${t})`,vector:(e,t)=>`vec4<u32>(${e}==${t})`},void 0,void 0,9)},iO=e=>{iI(e,"Mul",(e,t)=>`${e}*${t}`)},iR=e=>{let t=tQ("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;iI(e,"Pow",{scalar:(e,t)=>`pow_custom(${e},${t})`,vector:(e,t)=>`pow_vector_custom(${e},${t})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${"i32"===t?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},iB=e=>{iI(e,"Sub",(e,t)=>`${e}-${t}`)},iM=e=>{iI(e,"Greater",{scalar:(e,t)=>`u32(${e}>${t})`,vector:(e,t)=>`vec4<u32>(${e}>${t})`},void 0,void 0,9)},iD=e=>{iI(e,"Less",{scalar:(e,t)=>`u32(${e}<${t})`,vector:(e,t)=>`vec4<u32>(${e}<${t})`},void 0,void 0,9)},iP=e=>{iI(e,"GreaterOrEqual",{scalar:(e,t)=>`u32(${e}>=${t})`,vector:(e,t)=>`vec4<u32>(${e}>=${t})`},void 0,void 0,9)},iU=e=>{iI(e,"LessOrEqual",{scalar:(e,t)=>`u32(${e}<=${t})`,vector:(e,t)=>`vec4<u32>(${e}<=${t})`},void 0,void 0,9)}}),iF=u(()=>{e3(),tl(),tU(),t2(),iN=(e,t,r,i,a=0)=>{let s=e.reduce((e,t)=>e+ta.size(t.dims),0),n=Array(e.length),o=Array(e.length),u=Array(e.length),l=0,d=a,p=[],h=[],c=[{type:12,data:s}];for(let r=0;r<e.length;++r)n[r]=l,o[r]=d,l+=ta.size(e[r].dims),d+=e[r].dims[t],h.push(e[r].dims.length),u[r]=tQ(`input${r}`,i,h[r]),p.push("rank"),c.push({type:12,data:n[r]}),c.push({type:12,data:o[r]});for(let t=0;t<e.length;++t)c.push(...tF(e[t].dims));c.push(...tF(r));let f=tX("output",i,r.length),m=u.map((r,i)=>{let a=`
        let inputOffset = global_idx - uniforms.inputOffset${i};
        var outputIndices = ${r.offsetToIndices("inputOffset")};
        ${f.indicesGet("outputIndices",t)} += uniforms.outputAxisOffset${i};
        ${f.setByIndices("outputIndices",r.getByOffset("inputOffset"))}`;return 1===e.length?a:0===i?`if (inputIndex == 0u) {${a}}`:i===e.length-1?`else {${a}}`:`else if (inputIndex == ${i}u) {${a}}`}).join(`
`);return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:c}),getShaderSource:t=>`

  ${(()=>{t.registerUniform("outputSize","u32");for(let r=0;r<e.length;r++)t.registerUniform(`inputOffset${r}`,"u32"),t.registerUniform(`outputAxisOffset${r}`,"u32");return t.declareVariables(...u,f)})()}

  fn calculateInputIndex(global_idx: u32) -> u32 {
    ${u.slice(1).map((e,t)=>`if (global_idx < uniforms.inputOffset${t+1}) {
      return ${t}u;
    }`).join(`
`)}
    return ${e.length-1}u;
  }

  ${t.mainStart()}
    ${t.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    let inputIndex = calculateInputIndex(global_idx);
    ${m}
  }`}},iV=(e,t)=>{let r=e.inputs,i=r[0].dims,a=ta.normalizeAxis(t.axis,i.length);var s=r,n=a;if(!s||s.length<1)throw Error("too few inputs");let o=s[0],u=o.dataType,l=o.dims.length;s.forEach((e,t)=>{if(0!==t){if(e.dataType!==u)throw Error("input tensors should be one type");if(e.dims.length!==l)throw Error("input tensors should have the same shape");e.dims.forEach((e,t)=>{if(t!==n&&e!==o.dims[t])throw Error("non concat dimensions must match")})}});let d=i.slice();d[a]=r.reduce((e,t)=>e+(t.dims.length>a?t.dims[a]:0),0);let p=r.filter(e=>ta.size(e.dims)>0);if(0===p.length)return void e.output(0,d);let h=e.deviceLimits.maxStorageBuffersPerShaderStage-1,c=0;for(let t=0;t<p.length;t+=h){let i=p.slice(t,t+h);e.compute(iN(i,a,d,r[0].dataType,c),{inputs:i,outputs:[0]}),c+=i.reduce((e,t)=>e+t.dims[a],0)}},iq=e=>tP({axis:e.axis})}),iK=u(()=>{e3(),tl(),iG=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw Error(`Unsupported activation ${e.activation}`)}},iW=(e,t)=>{"Clip"===e.activation?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):"HardSigmoid"===e.activation?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):"LeakyRelu"===e.activation&&t.push({type:1,data:e.alpha})},iH=(e,t)=>{"Clip"===e.activation?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):"HardSigmoid"===e.activation?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):"LeakyRelu"===e.activation&&t.push({name:"alpha",type:"f32"})},ij=e=>{let t=e?.activation||"";if("HardSigmoid"===t){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}if("Clip"===t){let[r,i]=e?.activation_params||[to,tu];return{activation:t,clipMax:i,clipMin:r}}if("LeakyRelu"===t){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),iX=u(()=>{iZ=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw Error(`${e}-component is not supported.`)}},iQ=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),iJ=u(()=>{iY=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),i2=u(()=>{e3(),tl(),t2(),iK(),i0=(e,t,r,i,a)=>{let s=i-r;return`
      ${Array.from({length:r}).map((r,n)=>`
      if (${tK(t.shape,n,t.rank)} != 1) {
        ${t.indicesSet(e,n,tK(a,n+s,i))}
      } else {
        ${t.indicesSet(e,n,0)}
      }`).join("")}
`},i1=(e,t,r,i,a=!1,s)=>{let n=e[0].dims,o=e[1].dims,u=n[n.length-2],l=o[o.length-1],d=n[n.length-1],p=tG(l),h=tG(d),c=tG(u),f=ta.size(r)/p/c,m=e.length>2,g=i?i.slice(0,-2):r.slice(0,-2),y=[ta.size(g),u,l],_=[{type:12,data:f},{type:12,data:u},{type:12,data:l},{type:12,data:d}];return iW(t,_),_.push(...tF(g,n,o)),m&&_.push(...tF(e[2].dims)),_.push(...tF(y)),{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${c};${a}`,inputDependencies:m?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:s?s(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:_}),getShaderSource:i=>{let s=tJ("batch_dims",e[0].dataType,g.length),u=tQ("a",e[0].dataType,n.length,h),l=tQ("b",e[1].dataType,o.length,p),d=tX("output",e[0].dataType,y.length,p),f=tV(d.type.tensor),_=iG(t,d.type.value,f),b=[u,l],$="";if(m){let t=a?p:1;b.push(tQ("bias",e[2].dataType,e[2].dims.length,t)),$=`${a?`value += bias[col / ${t}];`:`value += ${d.type.value}(bias[row + i]);`}`}let w=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];return iH(t,w),`
  ${i.registerUniforms(w).registerInternalVariables(s).declareVariables(...b,d)}
  ${i.mainStart()}
    ${i.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${c};
    let row = (index1 % stride1) * ${c};
    let batch = index1 / stride1;

    ${2===r.length?"":`let batch_indices = ${s.offsetToIndices("batch")};`}

    var a_indices: ${u.type.indices};
    ${i0("a_indices",u,u.rank-2,s.rank,"batch_indices")}
    ${u.indicesSet("a_indices",u.rank-2,0)}
    ${u.indicesSet("a_indices",u.rank-1,0)}
    let a_offset = ${u.indicesToOffset("a_indices")};

    var b_indices: ${l.type.indices};
    ${i0("b_indices",l,l.rank-2,s.rank,"batch_indices")}
    ${l.indicesSet("b_indices",l.rank-2,0)}
    ${l.indicesSet("b_indices",l.rank-1,0)}
    let b_offset = ${l.indicesToOffset("b_indices")};
    var values: array<${d.type.value}, ${c}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${(()=>{let e=`var a_data: ${u.type.value};`;for(let t=0;t<h;t++)e+=`
              let b_data${t} = b[(b_offset + (k + ${t}) * uniforms.N + col) / ${p}];`;for(let t=0;t<c;t++){e+=`a_data = a[(a_offset + (row + ${t}) * uniforms.K + k) / ${h}];`;for(let r=0;r<h;r++)e+=`
            values[${t}] = fma(${l.type.value}(a_data${1===h?"":`[${r}]`}), b_data${r}, values[${t}]);
`}return e})()}
    }
    for (var i = 0u; i < ${c}u; i++) {
      var value = values[i];
      ${$}
      ${_}
      let cur_indices = ${d.type.indices}(batch, row + i, col);
      let offset = ${d.indicesToOffset("cur_indices")};
      ${d.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `}}}}),i5=u(()=>{e3(),tl(),t2(),iK(),i2(),iX(),i3=(e,t,r="f32",i,a=!1,s=32,n=!1,o=32)=>{let u,l,d,p,h=t[1]*e[1],c=t[0]*e[0],f=a?h:s,m=a?s:h,g=f/t[0],y=s/t[1];if(!((a&&4===g&&4===e[1]||!a&&(3===g||4===g))&&f%t[0]==0&&s%t[1]==0&&4===e[0]))throw Error(`If transposeA ${a} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${f} must be divisible by workgroupSize[0]${t[0]}. tileInner ${s} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${f/g}>, ${m}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${c/e[0]}>, ${s}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
const tileInner = ${s};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${n?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${h};

  let num_tiles = ${n?`${Math.ceil(o/s)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${n?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${y};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${u=a,l=i,u?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${l?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${l?", batchIndices":""});
        `}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${3===g?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${d=a,p=g,d?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${3===p?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${3===p?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${3===p?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},i4=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,i6=(e,t,r="f32",i,a=!1,s=32,n=!1,o=32,u=!1)=>{let l=e[1]*t[1],d=e[0]*t[0],p=a?l:s,h=a?s:l;if(h%t[1]!=0||p%t[0]!=0||s%t[1]!=0)throw Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${s} must be divisible by workgroupSize[1]${t[1]}`);let c=h/t[1],f=p/t[0],m=s/t[1],g=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${d};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${i4(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${s}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${d}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${l};

let tileRowA = i32(localId.y) * ${c};
let tileColA = i32(localId.x) * ${f};
let tileRowB = i32(localId.y) * ${m};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${c}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${f}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${i4(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${m}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${a?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];"}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${p}>, ${h}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${d}>, ${s}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${s};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${n?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${n?`${Math.ceil(o/s)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${n?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${g}
  }
`},i8=(e,t,r,i,a=!1,s)=>{let n=e[0].dims,o=e[1].dims,u=n.slice(0,-2),l=o.slice(0,-2),d=i?i.slice(0,-2):r.slice(0,-2),p=ta.size(d),h=n[n.length-2],c=n[n.length-1],f=o[o.length-1],m=c%4==0&&f%4==0,g=h<=8?[4,1,1]:[4,4,1],y=[8,8,1],_=[Math.ceil(f/y[0]/g[0]),Math.ceil(h/y[1]/g[1]),Math.ceil(p/y[2]/g[2])],b=m?4:1,$=[...u,h,c/b],w=$.length,v=[...l,c,f/b],x=v.length,S=[p,h,f/b],T=[{type:6,data:h},{type:6,data:f},{type:6,data:c}];iW(t,T),T.push(...tF(d,$,v));let E=["rank","rank"],k=e.length>2;return k&&(T.push(...tF(e[2].dims)),E.push("rank")),T.push(...tF(S)),{name:"MatMul",shaderCache:{hint:`${g};${t.activation};${m};${a}`,inputDependencies:E},getRunData:()=>({outputs:[{dims:s?s(r):r,dataType:e[0].dataType}],dispatchGroup:{x:_[0],y:_[1],z:_[2]},programUniforms:T}),getShaderSource:r=>{let i=d.length,s=tJ("batchDims",e[0].dataType,i,1),n=tV(e[0].dataType),o=tQ("a",e[0].dataType,w,b),u=tQ("b",e[1].dataType,x,b),l=tX("result",e[0].dataType,S.length,b),p=[o,u];if(k){let t=a?b:1;p.push(tQ("bias",e[2].dataType,e[2].dims.length,t))}let h=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];iH(t,h);let c=tV(l.type.tensor),f=((e,t,r,i,a=!1)=>{let[s,n,o,u]=i,l=tV(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${s.type.indices}) -> ${iZ(e,l)} {
      var value = ${iZ(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${n.type.indices};
        ${i0("aIndices",n,n.rank-2,s.rank,"batchIndices")}
        ${n.indicesSet("aIndices",n.rank-2,"u32(row)")}
        ${n.indicesSet("aIndices",n.rank-1,"u32(colIn)")}
        value = ${n.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${s.type.indices}) -> ${iZ(e,l)} {
      var value = ${iZ(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${i0("bIndices",o,o.rank-2,s.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${iZ(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${iZ(e,l)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `})(b,k,iG(t,l.type.value,c),[s,o,u,l],a);return`
  ${r.registerUniforms(h).registerInternalVariables(s).declareVariables(...p,l)}
  ${f}
  ${m?i3(g,y,n,s):i6(g,y,n,s)}
                   `}}}}),i9=u(()=>{e3(),tt(),t2(),iK(),iX(),iJ(),i5(),i7=(e,t,r,i,a,s,n,o,u)=>{let l="NHWC"===t.format,d=l?e[0].dims[3]:e[0].dims[1],p=r[0],h=l?r[2]:r[3],c=l?r[1]:r[2],f=l?r[3]:r[1],m=l&&(d%4==0||d%3==0)&&f%4==0,g=l?f:h*c,y=l?h*c:f,_=[8,8,1],b=i<=8?[4,1,1]:[4,4,1],$=[Math.ceil(g/_[0]/b[0]),Math.ceil(y/_[1]/b[1]),Math.ceil(p/_[2]/b[2])];te("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${$}`);let w=m?l&&d%4!=0?3:4:1,v=_[1]*b[1],x=_[0]*b[0],S=Math.max(_[0]*w,_[1]),T=i%v==0,E=a%x==0,k=s%S==0,I=m?[w,4,4]:[1,1,1],C=[{type:6,data:i},{type:6,data:a},{type:6,data:s},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];iW(t,C),C.push(...tF(e[0].dims,e[1].dims));let z=["rank","rank"];return n&&(C.push(...tF(e[2].dims)),z.push("rank")),C.push(...tF(r)),{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${w};${m};${T};${E};${k};${v};${x};${S}`,inputDependencies:z},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:$[0],y:$[1],z:$[2]},programUniforms:C}),getShaderSource:i=>{let a=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];iH(t,a);let s=m?4:1,u=tV(e[0].dataType),d=`
      fn setOutputAtIndex(flatIndex : i32, value : ${m?`vec4<${u}>`:u}) {
        result[flatIndex] = ${m?`vec4<${u}>`:u}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${m?`vec4<${u}>`:u}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${m?"/ 4":""}, value);
      }`,p=[tQ("x",e[0].dataType,e[0].dims.length,3===w?1:w),tQ("w",e[1].dataType,e[1].dims.length,s)],h=tX("result",e[0].dataType,r.length,s);if(n){let t=tQ("bias",e[2].dataType,e[2].dims.length,s);p.push(t),d+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${m?`vec4<${u}>`:u} {
          return bias[coords.${l?"w":"y"}${m?"/ 4":""}];
        }`}return`
        ${iY("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${i.registerUniforms(a).declareVariables(...p,h)}
        ${d}
        ${((e,t,r,i,a=!1,s,n=4,o=4,u=4,l="f32")=>{let d=e=>{switch(e){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw Error(`innerElementSize ${e} is not supported.`)}},p=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,h=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,c=e?"row":"col",f=e?"col":"row",m=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${c} / outWidth;
    let outCol = ${c} % outWidth;

    let WRow = ${f} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${f} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${f} % inChannels;
    var resData = ${iZ(n,l)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])"} && xCol >= 0 && xCol < ${e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])"}) {
      ${p}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${(e=>{switch(e){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw Error(`innerElementSize ${e} is not supported.`)}})(n)}
    }
    return resData;`,g=e?t&&i?`
    let col = colIn * ${n};
    ${m}`:`
    let col = colIn * ${n};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${m}
    }
    return ${iZ(n,l)}(0.0);`:i&&r?`
    let col = colIn * ${n};
    ${m}`:`
    let col = colIn * ${n};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${m}
    }
    return ${iZ(n,l)}(0.0);`,y=e?i&&r?d(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${d(o)}
    }
    return ${iZ(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${d(o)}
    }
    return ${iZ(o,l)}(0.0);`,_=iZ(u,l),b=e?iZ(n,l):iZ(o,l),$=e?iZ(o,l):iZ(n,l),w=iG(s,_,l);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${b} {
      ${e?g:y}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${$} {
      ${e?y:g}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${_}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${h}
      ${iQ(a)}
      ${w}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`})(l,T,E,k,n,t,I[0],I[1],I[2],u)}
        ${m?i3(b,_,u,void 0,!l,S):i6(b,_,u,void 0,!l,S,!1,void 0,o)}`}}}}),as=u(()=>{e3(),tt(),tl(),t2(),iK(),iX(),ae=e=>"number"==typeof e?[e,e,e]:e,at=(e,t)=>t<=1?e:e+(e-1)*(t-1),ar=(e,t,r,i,a)=>{null==a&&(a=((e,t,r,i=1)=>{let a=at(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)})(e,t[0],i[0]));let s=[0,0,0,r];for(let r=0;r<3;r++)e[r]+2*a>=t[r]&&(s[r]=Math.trunc((e[r]-t[r]+2*a)/i[r]+1));return s},ai=(e,t,r,i,a,s=!1,n="channelsLast")=>{let o,u,l,d,p;if("channelsLast"===n)[o,u,l,d,p]=e;else if("channelsFirst"===n)[o,p,u,l,d]=e;else throw Error(`Unknown dataFormat ${n}`);let[h,,c,f,m]=t,[g,y,_]=ae(r),[b,$,w]=ae(i),v=at(c,b),x=at(f,$),S=at(m,w),{padInfo:T,outDepth:E,outHeight:k,outWidth:I}=((e,t,r,i,a,s,n,o,u,l)=>{let d,p,h,c;if("VALID"===e&&(e=0),"number"==typeof e){d={top:e,bottom:e,left:e,right:e,front:e,back:e};let f=ar([t,r,i,1],[o,u,l],1,[a,s,n],e);p=f[0],h=f[1],c=f[2]}else if(Array.isArray(e)){if(!e.every((e,t,r)=>e===r[0]))throw Error(`Unsupported padding parameter: ${e}`);d={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let f=ar([t,r,i,1],[o,u,l],1,[a,s,n],e[0]);p=f[0],h=f[1],c=f[2]}else if("SAME_UPPER"===e){p=Math.ceil(t/a),h=Math.ceil(r/s),c=Math.ceil(i/n);let e=(p-1)*a+o-t,f=(h-1)*s+u-r,m=(c-1)*n+l-i,g=Math.floor(e/2),y=Math.floor(f/2),_=Math.floor(m/2);d={top:y,bottom:f-y,left:_,right:m-_,front:g,back:e-g}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:d,outDepth:p,outHeight:h,outWidth:c}})(a,u,l,d,g,y,_,v,x,S),C=s?h*p:h,z=[0,0,0,0,0];return"channelsFirst"===n?z=[o,C,E,k,I]:"channelsLast"===n&&(z=[o,E,k,I,C]),{batchSize:o,dataFormat:n,inDepth:u,inHeight:l,inWidth:d,inChannels:p,outDepth:E,outHeight:k,outWidth:I,outChannels:C,padInfo:T,strideDepth:g,strideHeight:y,strideWidth:_,filterDepth:c,filterHeight:f,filterWidth:m,effectiveFilterDepth:v,effectiveFilterHeight:x,effectiveFilterWidth:S,dilationDepth:b,dilationHeight:$,dilationWidth:w,inShape:e,outShape:z,filterShape:t}},aa=(e,t,r,i,a,s)=>{let n="channelsLast"===s,o=[Math.ceil((e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t})((n?e[0].dims[3]:e[0].dims[1],{x:r.map((e,t)=>t)}).x.map(e=>r[e]))/64),1,1];te("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${o}`);let u=[{type:12,data:ta.size(r)},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];iW(t,u),u.push(...tF(e[0].dims,e[1].dims));let l=["rank","rank"],d=3===e.length;return d&&(u.push(...tF(e[2].dims)),l.push("rank")),u.push(...tF(r)),{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${n};1;${d}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:o[0],y:o[1],z:o[2]},programUniforms:u}),getShaderSource:s=>{let o=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];iH(t,o);let u=tV(e[0].dataType),l=tQ("x",e[0].dataType,e[0].dims.length,1),p=tQ("W",e[1].dataType,e[1].dims.length,1),h=[l,p],c=tX("result",e[0].dataType,r.length,1),f="";if(d){let t=tQ("bias",e[2].dataType,e[2].dims.length,1);h.push(t),f+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${u} {
          return bias[${n?tK("coords",4,5):tK("coords",1,5)}];
        }`}let m=iZ(1,u),g=iG(t,m,u);return`
            ${f}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> ${u} {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${l.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> ${u} {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${p.getByIndices("aIndices")};
            }
          ${s.registerUniforms(o).declareVariables(...h,c)}
          ${s.mainStart()}
          ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${c.offsetToIndices("global_idx")};
              let batch = ${tK("coords",0,l.rank)};
              let d2 = ${n?tK("coords",l.rank-1,l.rank):tK("coords",1,l.rank)};
              let xFRCCorner = vec3<u32>(${n?tK("coords",1,l.rank):tK("coords",2,l.rank)},
              ${n?tK("coords",2,l.rank):tK("coords",3,l.rank)},
              ${n?tK("coords",3,l.rank):tK("coords",4,l.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${n?tK("uniforms.x_shape",1,l.rank):tK("uniforms.x_shape",2,l.rank)};
              let xShapeZ = ${n?tK("uniforms.x_shape",2,l.rank):tK("uniforms.x_shape",3,l.rank)};
              let xShapeW = ${n?tK("uniforms.x_shape",3,l.rank):tK("uniforms.x_shape",4,l.rank)};
              let xShapeU = ${n?tK("uniforms.x_shape",4,l.rank):tK("uniforms.x_shape",1,l.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = ${u}(0);
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${n?`let xValues = vec4<${u}>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<${u}>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<${u}>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${n?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${n?`let xValues = vec2<${u}>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<${u}>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<${u}>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${n?`let xValues = vec3<${u}>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<${u}>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<${u}>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${d?"value = value + getBiasByOutputCoords(coords)":""};
              ${g}
              result[global_idx] = ${u}(value);
          }`}}}}),au=u(()=>{e3(),tl(),t2(),iK(),an=(e,t,r,i)=>{let a=e.length>2,s=a?"value += b[output_channel];":"",n=e[0].dims,o=e[1].dims,u="NHWC"===t.format,l=u?r[3]:r[1],d=l/t.group,p=u&&d>=4?tG(l):1,h=ta.size(r)/p,c=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:d}];return iW(t,c),c.push(...tF(n,[o[0],o[1],o[2],o[3]/p])),c.push(...tF([r[0],r[1],r[2],r[3]/p])),{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:a?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:c}),getShaderSource:i=>{let l=tX("output",e[0].dataType,r.length,p),d=tV(l.type.tensor),h=iG(t,l.type.value,d),c=tQ("x",e[0].dataType,n.length),f=tQ("w",e[1].dataType,o.length,p),m=[c,f];a&&m.push(tQ("b",e[2].dataType,e[2].dims,p));let g=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];iH(t,g);let y=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${c.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${f.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${c.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${f.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${i.registerUniforms(g).declareVariables(...m,l)}

  ${i.mainStart()}
    ${i.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${l.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${p} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${l.type.value} = ${l.type.value}(0);
    ${y}
    ${s}
    ${h}
    ${l.setByOffset("global_idx","value")}
  }`}}},ao=(e,t,r,i)=>{let a=e.length>2,s=tG(r[3]),n=tG(r[2]),o=ta.size(r)/s/n,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/s],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/s],d=[r[0],r[1],r[2],r[3]/s],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];iW(t,p),p.push(...tF(u,l,d));let h=(n-1)*t.strides[1]+l[1];return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${s};${n};${h};${l[0]};${l[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:r=>{let i=tX("output",e[0].dataType,d.length,s),o=tV(i.type.tensor),p=iG(t,i.type.value,o),c=tQ("x",e[0].dataType,u.length,s),f=tQ("w",e[1].dataType,l.length,s),m=[c,f];a&&m.push(tQ("b",e[2].dataType,e[2].dims,s));let g=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return iH(t,g),`
  ${r.registerUniforms(g).declareVariables(...m,i)}
  ${r.mainStart()}
    ${r.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${n}u;
    let col = (index1 % width1) * ${n}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${c.type.value}, ${h}>;
    var values: array<${i.type.value}, ${n}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${h}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${c.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${c.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${l[1]}; w_width++) {
          let w_val = ${f.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${n}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${n}u; i++) {
      var value = values[i];
      ${a?"value += b[output_channel];":""}
      ${p}
      ${i.set("batch","row","col + i","output_channel","value")};
    }
  }`}}}}),af=u(()=>{tl(),i9(),as(),i5(),au(),iK(),i2(),t5(),al=[2,3,1,0],ad=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let e=2;e<t[1].dims.length;++e)0===r[e-2]&&(r[e-2]=t[1].dims[e]);let i=e.pads.slice();ts.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,"NHWC"===e.format,e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},ap=e=>{let t=ij(e),r=e.format;return{autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],format:r,dilations:e.dilations,group:e.group,kernelShape:e.kernel_shape,pads:e.pads,strides:e.strides,wIsConst:e.w_is_const(),...t,cacheKey:`${e.format};${t.activation};`}},ah=(e,t,r,i)=>{var a,s,n,o,u,l;let d,p,h,c,f,m,g="NHWC"===r.format,y=(a=t[0].dims,s=t[1].dims,n=r.dilations,o=r.pads,u=r.strides,l=g,d=a[0],h=(p=a.slice(l?1:2,l?3:4)).length,c=s[0],f=s.slice(2).map((e,t)=>e+(e-1)*(n[t]-1)),(m=p.map((e,t)=>e+o[t]+o[t+h]).map((e,t)=>Math.floor((e-f[t]+u[t])/u[t]))).splice(0,0,d),m.splice(l?3:1,0,c),m);if(1!==r.group){let a=[t[0]];if(g){let i=e.kernelCustomData.wT??e.compute(t4(t[1],al),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=i),a.push(i)}else a.push(t[1]);3===t.length&&a.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&g&&t[1].dims[0]===r.group&&1===t[1].dims[1]&&1===r.dilations[0]&&1===r.dilations[1]?e.compute(ao(a,r,y,i),{inputs:a}):e.compute(an(a,r,y,i),{inputs:a});return}let _=3===t.length,b=t[0].dims[g?1:2],$=t[0].dims[g?2:3],w=t[0].dims[g?3:1],v=t[1].dims[2],x=t[1].dims[3],S=y[g?1:2],T=y[g?2:3],E=y[g?3:1],k=g&&v===b&&x===$&&0===r.pads[0]&&0===r.pads[1];if(k||1===v&&1===x&&1===r.dilations[0]&&1===r.dilations[1]&&1===r.strides[0]&&1===r.strides[1]&&0===r.pads[0]&&0===r.pads[1]){let a=y[0],s,n,o,u=[];if(g){let i=e.kernelCustomData.wT??e.compute(t4(t[1],al),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=i),k){let e=b*$*w;s=t[0].reshape([1,a,e]),n=i.reshape([1,e,E]),o=[1,a,E]}else s=t[0].reshape([a,b*$,w]),n=i.reshape([1,w,E]),o=[a,S*T,E];u.push(s),u.push(n)}else s=t[0].reshape([a,w,b*$]),n=t[1].reshape([1,E,w]),o=[a,E,S*T],u.push(n),u.push(s);_&&u.push(t[2]);let l=o[2],d=u[0].dims[u[0].dims.length-1];l<8&&d<8?e.compute(i1(u,r,y,o,g,i),{inputs:u}):e.compute(i8(u,r,y,o,g,i),{inputs:u});return}let I=e.kernelCustomData.wT??e.compute(t4(t[1],al),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=I);let C=[t[0],I];_&&C.push(t[2]);let z=g?S*T:E,A=g?E:S*T,O=v*x*w;e.compute(i7(C,r,y,z,A,O,_,!0,i),{inputs:C})},ac=(e,t)=>{var r,i,a,s,n;if(((e,t)=>{if(!e||2!==e.length&&3!==e.length)throw Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw Error("filter does not have same dimension as input");if(e[0].dims["NHWC"===t.format?e[0].dims.length-1:1]!==e[1].dims[1]*t.group)throw Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(3===e.length&&(1!==e[2].dims.length||e[1].dims[0]!==e[2].dims[0]))throw Error("invalid bias");let r=e[0].dims.length-2;if(t.dilations.length!==r)throw Error(`dilations should be ${r}D`);if(t.strides.length!==r)throw Error(`strides should be ${r}D`);if(t.pads.length!==2*r)throw Error(`pads should be ${2*r}D`);if(0!==t.kernelShape.length&&t.kernelShape.length!==e[1].dims.length-2)throw Error("invalid kernel shape")})(e.inputs,t),3===e.inputs[0].dims.length){let a,s,n,o,u,l,d;r=e,a="NHWC"===(i=t).format,s=[r.inputs[0].reshape(a?[r.inputs[0].dims[0],1,r.inputs[0].dims[1],r.inputs[0].dims[2]]:[r.inputs[0].dims[0],r.inputs[0].dims[1],1,r.inputs[0].dims[2]]),r.inputs[1].reshape([r.inputs[1].dims[0],r.inputs[1].dims[1],1,r.inputs[1].dims[2]])],3===r.inputs.length&&s.push(r.inputs[2]),n=[0,i.pads[0],0,i.pads[1]],o=[1].concat(i.strides),u=[1].concat(i.dilations),l=[1].concat(i.kernelShape),d=ad({...i,pads:n,strides:o,dilations:u,kernelShape:l},s),ah(r,s,d,e=>a?[e[0],e[2],e[3]]:[e[0],e[1],e[3]])}else if(5===e.inputs[0].dims.length){let r,i,o,u;a=e,s=e.inputs,r="NHWC"===(n=t).format?"channelsLast":"channelsFirst",i=ad(n,s),o="NOTSET"===n.autoPad?n.pads:n.autoPad,u=ai(s[0].dims,s[1].dims,n.strides,n.dilations,o,!1,r),a.compute(aa(s,i,u.outShape,[u.filterDepth,u.filterHeight,u.filterWidth],[u.padInfo.front,u.padInfo.top,u.padInfo.left],r))}else{let r=ad(t,e.inputs);ah(e,e.inputs,r)}}}),ag=u(()=>{e3(),tt(),tl(),t2(),am=(e,t,r)=>{let i=e.length>2,a=t.outputShape,s="NHWC"===t.format,n=t.group,o=e[1].dims,u=o[2]/n,l=o[3],d=s?tG(u):1,p=s&&1===l&&u>=4,h=p?4*Math.floor(u/4):Math.floor(u/d)*d,c=u-h,f=s?tG(l):1,m=s?1===l?d:f:1,g=ta.size(a)/f,y=[Math.ceil(g/64),1,1];te("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${y}`);let _=["rank","rank"],b=[t.strides[0],t.strides[1]],$=[t.kernelShape[s?1:2],t.kernelShape[s?2:3]],w=[t.dilations[0],t.dilations[1]],v=[$[0]+(t.dilations[0]<=1?0:(t.kernelShape[s?1:2]-1)*(t.dilations[0]-1)),$[1]+(t.dilations[1]<=1?0:(t.kernelShape[s?2:3]-1)*(t.dilations[1]-1))],x=[v[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),v[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],S=[{type:12,data:g},{type:12,data:b},{type:12,data:$},{type:12,data:w},{type:12,data:v},{type:6,data:x},{type:12,data:h},{type:12,data:u},{type:12,data:l},...tF(e[0].dims,e[1].dims)];return i&&(S.push(...tF(e[2].dims)),_.push("rank")),S.push(...tF(a)),{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${d}${m}${f}${p}${c}`,inputDependencies:_},getRunData:()=>({dispatchGroup:{x:y[0],y:y[1],z:y[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:S}),getShaderSource:t=>{let r=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:b.length},{name:"filter_dims",type:"u32",length:$.length},{name:"dilations",type:"u32",length:$.length},{name:"effective_filter_dims",type:"u32",length:v.length},{name:"pads",type:"i32",length:x.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],n=tV(e[0].dataType),o=s?1:2,u=s?2:3,l=s?3:1,h=tQ("W",e[1].dataType,e[1].dims.length,m),g=tQ("Dy",e[0].dataType,e[0].dims.length,d),y=[g,h];i&&y.push(tQ("bias",e[2].dataType,[a[l]].length,f));let _=tX("result",e[0].dataType,a.length,f),w=`
            let outputIndices = ${_.offsetToIndices(`global_idx * ${f}`)};
            let batch = ${_.indicesGet("outputIndices",0)};
            let d1 = ${_.indicesGet("outputIndices",l)};
            let r = ${_.indicesGet("outputIndices",o)};
            let c = ${_.indicesGet("outputIndices",u)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${_.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${n}(dyRCorner) + ${n}(wR)) / ${n}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${n}(uniforms.Dy_shape[${o}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${n}(dyCCorner) + ${n}(wC)) / ${n}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${n}(uniforms.Dy_shape[${u}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${g.indicesToOffset(`${g.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d};
                var w_offset = ${h.indicesToOffset(`${h.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${m};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:d}) {
                  ${(()=>{let e="";if(p)4===d?e+=`
        let xValue = ${g.getByOffset("x_offset")};
        let wValue = ${h.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:2===d?e+=`
          dotProd = dotProd + dot(vec4<${n}>(${g.getByOffset("x_offset")}, ${g.getByOffset("x_offset + 1u")}), vec4<${n}>(${h.getByOffset("w_offset")}, ${h.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:1===d&&(e+=`
          dotProd = dotProd + dot(vec4<${n}>(${g.getByOffset("x_offset")}, ${g.getByOffset("x_offset + 1u")}, ${g.getByOffset("x_offset + 2u")}, ${g.getByOffset("x_offset + 3u")}), vec4<${n}>(${h.getByOffset("w_offset")}, ${h.getByOffset("w_offset + 1u")}, ${h.getByOffset("w_offset + 2u")}, ${h.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(e+=`
                  let xValue = ${s?g.getByOffset(`${g.indicesToOffset(`${g.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d}`):g.get("batch","inputChannel","idyR","idyC")};
        `,1===d)e+=`
          let w_offset = ${h.indicesToOffset(`${h.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${h.getByOffset(`w_offset / ${m}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let t=0;t<d;t++)e+=`
            let wValue${t} = ${h.getByOffset(`${h.indicesToOffset(`${h.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${t}, wOutChannel)`)} / ${m}`)};
            dotProd = dotProd + xValue[${t}] * wValue${t};`;return e})()}
                  inputChannel = inputChannel + ${p?4:d};
                }
                ${(()=>{if(0===c)return"";if(!p)throw Error(`packInputAs4 ${p} is not true.`);let e="";if(1===d){e+="dotProd = dotProd";for(let t=0;t<c;t++)e+=`
            + ${g.getByOffset(`x_offset + ${t}`)} * ${h.getByOffset(`w_offset + ${t}`)}`;e+=";"}else if(2===d){if(2!==c)throw Error(`Invalid inputChannelsRemainder ${c}.`);e+=`
          let xValue = ${g.getByOffset("x_offset")};
          let wValue = ${h.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return e})()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${f}]`:""};
            ${_.setByOffset("global_idx","value")};
          `;return`
    ${t.registerUniforms(r).declareVariables(...y,_)}
      ${t.mainStart()}
      ${t.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${w}}`}}}}),ax=u(()=>{ag(),iK(),t5(),ay=(e,t,r,i,a,s)=>(e-1)*t+r+(i-1)*a+1-s,a_=(e,t,r,i,a)=>{let s=Math.floor(e/2);"SAME_UPPER"===t?(r[i]=s,r[a]=e-s):"SAME_LOWER"===t&&(r[i]=e-s,r[a]=s)},ab=(e,t)=>{let r=e.kernelShape.slice();if(0===e.kernelShape.length||0===e.kernelShape.reduce((e,t)=>e*t,1)){r.length=0;for(let e=2;e<t[1].dims.length;++e)r.push(t[1].dims[e])}let i="NHWC"===e.format;r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),s=e.outputShape.slice(),n=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();0===u.reduce((e,t)=>e+t,0)&&(u=Array(t[0].dims.length-2).fill(1));let l=e.strides.slice();0===l.reduce((e,t)=>e+t,0)&&(l=Array(t[0].dims.length-2).fill(1)),((e,t,r,i,a,s,n,o,u,l)=>{let d=e.length-2,p=0===l.length;u.length<d&&u.push(...Array(d-u.length).fill(0));let h=e[0],c=t[o?3:1]*a;for(let a=0,h=e.length-d-!!o;a<d;++a,++h){let o=e[h],c=p?o*n[a]:l[a];a_(ay(o,n[a],s[a],t[h],r[a],c),i,s,a,a+d),p&&l.push(n[a]*(o-1)+u[a]+(t[h]-1)*r[a]+1-s[a]-s[a+d])}l.splice(0,0,h),l.splice(o?3:1,0,c)})(o,r,u,e.autoPad,e.group,a,l,i,n,s);let d=Object.assign({},e);return Object.assign(d,{kernelShape:r,pads:a,outputPadding:n,outputShape:s,dilations:u,strides:l}),d},a$=e=>{let t=ij(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,s=e.group??1,n=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst();return{autoPad:i,format:r,dilations:a,group:s,kernelShape:n,outputPadding:e.outputPadding,outputShape:e.outputShape,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},aw=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(t4(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let s=[t[0],a];3===t.length&&s.push(t[2]),e.compute(am(s,r,i),{inputs:s})},av=(e,t)=>{if(((e,t)=>{if(!e||2!==e.length&&3!==e.length)throw Error("Conv requires 2 or 3 inputs");if(4!==e[0].dims.length&&3!==e[0].dims.length)throw Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw Error("filter does not have same dimension as input");if(e[0].dims["NHWC"===t.format?e[0].dims.length-1:1]!==e[1].dims[0])throw Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let r=e[1].dims[1]*t.group;if(3===e.length&&(1!==e[2].dims.length||e[2].dims[0]!==r))throw Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.reduce((e,t)=>e+t,0)>0&&t.dilations.length!==i)throw Error(`dilations should be ${i}D`);if(t.strides.reduce((e,t)=>e+t,0)>0&&t.strides.length!==i)throw Error(`strides should be ${i}D`);if(t.pads.reduce((e,t)=>e+t,0)>0&&t.pads.length!==2*i)throw Error(`pads should be ${2*i}D`);if(t.outputPadding.length!==i&&0!==t.outputPadding.length)throw Error(`output_padding should be ${i}D`);if(t.kernelShape.reduce((e,t)=>e+t,0)>0&&0!==t.kernelShape.length&&t.kernelShape.length!==e[1].dims.length-2)throw Error("invalid kernel shape");if(0!==t.outputShape.length&&t.outputShape.length!==e[0].dims.length-2)throw Error("invalid output shape")})(e.inputs,t),3===e.inputs[0].dims.length){var r,i;let a,s,n,o,u,l,d,p;r=e,a="NHWC"===(i=t).format,s=[r.inputs[0].reshape(a?[r.inputs[0].dims[0],1,r.inputs[0].dims[1],r.inputs[0].dims[2]]:[r.inputs[0].dims[0],r.inputs[0].dims[1],1,r.inputs[0].dims[2]]),r.inputs[1].reshape([r.inputs[1].dims[0],r.inputs[1].dims[1],1,r.inputs[1].dims[2]])],3===r.inputs.length&&s.push(r.inputs[2]),(0===(n=i.kernelShape).length||0===n[0])&&(n=[r.inputs[1].dims[2]]),(0===(o=i.dilations).length||0===o[0])&&(o=[1]),(0===(u=i.strides).length||0===u[0])&&(u=[1]),0===(l=i.pads).length&&(l=[0,0]),l=[0,l[0],0,l[1]],u=[1].concat(u),o=[1].concat(o),n=[1].concat(n),d=[0].concat(d=i.outputPadding),p=ab({...i,pads:l,strides:u,dilations:o,kernelShape:n,outputPadding:d},s),aw(r,s,p,e=>a?[e[0],e[2],e[3]]:[e[0],e[1],e[3]])}else{let r=ab(t,e.inputs);aw(e,e.inputs,r)}}}),aE=u(()=>{e3(),tl(),tU(),t2(),aS=(e,t)=>{var r,i,a,s;let n,o,u,l,d,p,h=e.inputs[0].dims,c=e.inputs[0].dataType,f=e.inputs[1];e.compute((r=c,i=h,a=f,s=t,n=ta.size(i),o=i.length,u=tQ("input",r,o),l=tX("output",r,o),d=6===a.dataType?a.getInt32Array()[0]:Number(a.getBigInt64Array()[0]),p=ta.normalizeAxis(d,o),{name:"CumSum",shaderCache:{hint:s.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:i,dataType:r}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:p},...tF(i,i)]}),getShaderSource:e=>{let t=` i32(${u.indicesGet("inputIndices","uniforms.axis")}) `,r=tK("uniforms.input_shape","uniforms.axis",o),i=s.reverse?t+(s.exclusive?" + 1":""):"0",a=s.reverse?r:t+(s.exclusive?"":" + 1");return`
                ${e.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(u,l)}
                ${e.mainStart()}
                  ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${l.offsetToIndices("global_idx")};
                  var sum = ${l.type.value}(0);
                  let first : i32 = ${i};
                  let last : i32 = ${a};
                  for (var i : i32 = first; i < last; i++) {
                    ${u.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${u.getByIndices("inputIndices")};
                  }
                  ${l.setByOffset("global_idx","sum")};
                }`}}),{inputs:[0]})},aT=e=>{let t=1===e.exclusive,r=1===e.reverse;return tP({exclusive:t,reverse:r})}}),aC=u(()=>{e3(),tl(),tU(),t2(),ak=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h,c,f,m,g,y;(e=>{if(!e||1!==e.length)throw Error("DepthToSpace requires 1 input.");if(4!==e[0].dims.length)throw Error("DepthToSpace requires 4D input.")})(e.inputs),e.compute((r=e.inputs[0],d="NHWC"===(i=t).format,p=i.blocksize,h="DCR"===i.mode,d?([a,s,n,o]=r.dims,u=h?[a,s,n,p,p,o/p**2]:[a,s,n,o/p**2,p,p],l=h?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([a,s,n,o]=[r.dims[0],r.dims[2],r.dims[3],r.dims[1]],u=h?[a,p,p,o/p**2,s,n]:[a,o/p**2,p,p,s,n],l=h?[0,3,4,1,5,2]:[0,1,4,2,5,3]),f=(c=r.reshape(u)).dims.length,m=r.dataType,g=tQ("a",m,f),y=tX("output",m,f),{name:"DepthToSpace",shaderCache:{hint:`${r.dims};${i.blocksize};${i.mode}`,inputDependencies:["rank"]},getRunData:e=>{let t=d?[a,s*p,n*p,o/p**2]:[a,o/p**2,s*p,n*p],r=ta.size(t),i=c.dims,u=ta.sortBasedOnPerm(i,l);return{outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:[{type:12,data:r},...tF(i,u)]}},getShaderSource:e=>`
  ${e.registerUniform("output_size","u32").declareVariables(g,y)}

  ${((e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let i=0;i<t;++i)a.push(r.indicesSet("a",e[i],`i[${i}]`));return a.push("return a;}"),a.join(`
`)})(l,f,g,y)}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",g.getByIndices("aIndices"))}
  }`}))},aI=e=>tP({blocksize:e.blocksize,mode:e.mode,format:e.format})}),aN=u(()=>{e3(),tl(),tU(),t2(),az=2*Math.PI,aA=e=>{let t=[],r=e;for(let e of[4,2,3,5])for(;r%e==0;)t.push(e),r/=e;return 1===r?t:void 0},aO=e=>{let t=e.toPrecision(9);return/[.eE]/.test(t)?t:`${t}.0`},aR=(e,t,r,i,a)=>{let s=r/e,n=512-i,o=e=>`smem[${n}u + base + ${e*t}u]`,u=`  for (var t = local_idx; t < ${s}u; t += 256u) {
`;u+=`    let twiddleIndex = t % ${t}u;
    let angleUnit = f32(twiddleIndex);
    var leg: array<vec2<f32>, 5>;
`;for(let r=0;r<e;r++){let n=`${i}u + t + ${r*s}u`;if(0===r)u+=`    leg[0] = smem[${n}];
`;else{let i=a*az*r/(e*t);u+=`    { let a = ${aO(i)} * angleUnit; leg[${r}] = cmul(smem[${n}], vec2<f32>(cos(a), sin(a))); }
`}}if(u+=`    let base = (t / ${t}u) * ${t*e}u + twiddleIndex;
`,2===e)u+=`    ${o(0)} = leg[0] + leg[1];
    ${o(1)} = leg[0] - leg[1];
`;else if(4===e)u+=`    let evenSum = leg[0] + leg[2]; let evenDiff = leg[0] - leg[2];
    let oddSum = leg[1] + leg[3]; let oddDiff = leg[1] - leg[3];
    let oddRot = ${a<0?"vec2<f32>(oddDiff.y, -oddDiff.x)":"vec2<f32>(-oddDiff.y, oddDiff.x)"};
    ${o(0)} = evenSum + oddSum;
    ${o(1)} = evenDiff + oddRot;
    ${o(2)} = evenSum - oddSum;
    ${o(3)} = evenDiff - oddRot;
`;else for(let t=0;t<e;t++){let r=["leg[0]"];for(let i=1;i<e;i++){let s=a*az*(i*t)/e,n=aO(Math.cos(s)),o=aO(Math.sin(s));r.push(`vec2<f32>(leg[${i}].x*${n} - leg[${i}].y*${o}, leg[${i}].x*${o} + leg[${i}].y*${n})`)}u+=`    ${o(t)} = ${r.join(" + ")};
`}return`${u}  }
  workgroupBarrier();
`},aB=(e,t)=>[t,e.length,e.inputComponents,e.outputComponents,e.inverse,e.onesided].join(";"),aM=e=>[{type:12,data:e.batch},{type:12,data:e.signalLength},{type:12,data:e.inner},{type:12,data:e.outputLength}],aD=(e,t,r)=>e.registerUniform("batch","u32").registerUniform("signalLength","u32").registerUniform("inner","u32").registerUniform("outputLength","u32").declareVariables(t,r),aP=e=>{if(!e||0===e.dataType)return;if(1!==ta.size(e.dims))throw Error("DFT optional scalar inputs must have exactly 1 element.");if(6===e.dataType)return e.getInt32Array()[0];let t=Number(e.getBigInt64Array()[0]);if(!Number.isSafeInteger(t))throw Error("DFT optional scalar inputs are out of JavaScript safe integer range.");return t},aU=(e,t)=>{var r=e.inputs;if(!r||r.length<1)throw Error("DFT requires at least 1 input.");let i=r[0].dims;if(i.length<2)throw Error("DFT input must have at least 2 dimensions.");let a=i[i.length-1];if(1!==a&&2!==a)throw Error("DFT input's innermost dimension must be 1 (real) or 2 (complex).");let s=e.inputs[0],n=s.dims.length,o=0!==t.inverse,u=0!==t.onesided,l=aP(e.inputs[1]);if(void 0!==l&&l<=0)throw Error("dft_length must be greater than zero.");let d=ta.normalizeAxis(aP(e.inputs[2])??t.axis,n);if(d===n-1)throw Error("DFT axis must refer to a signal dimension, not the innermost (real/imaginary) dimension.");if(o&&u&&2!==s.dims[n-1])throw Error("Inverse one-sided DFT (IRFFT) requires complex-valued input (innermost dimension 2).");let p=((e,t,r,i,a)=>{let s=e.dims,n=s.length,o=s[n-1],u=s[t],l=r&&i?(u-1)*2:u;void 0!==a&&(l=a);let d=r&&i?1:2,p=i&&!r?Math.floor(l/2)+1:l,h=s.slice();h[t]=p,h[n-1]=d;let c=1;for(let e=t+1;e<n-1;e++)c*=s[e];let f=ta.size(s)/o/u;return{dataType:e.dataType,outputDims:h,length:l,signalLength:u,inner:c,batch:f,inputComponents:o,outputComponents:d,outputLength:p,inverse:r,onesided:i}})(s,d,o,u,l);if(p.length<=0)throw Error(`Invalid DFT length: ${p.length}`);let h=p.length<=512&&void 0!==aA(p.length)?(e=>{let{dataType:t,length:r,inputComponents:i,outputComponents:a,inverse:s,onesided:n}=e,o=tq(t),u=s?1:-1,l=s?1/r:1,d=aA(r);return{name:"DFT",shaderCache:{hint:aB(e,"fft"),inputDependencies:["type"]},getShaderSource:e=>{let p=tQ("x",t,[1]),h=tX("y",t,[1]),c=e=>{let t=`inBase + (${e}) * uniforms.inner * ${i}u`,r=`f32(${p.getByOffset(t)})`,a=2===i?`f32(${p.getByOffset(`${t} + 1u`)})`:"0.0";return`vec2<f32>(${r}, ${a})`},f;if(s&&n){let e=Math.floor(r/2)+1,t=r%2==0?`select(provided, provided - 1u, provided == ${e}u)`:"provided";f=`
    let provided = min(uniforms.signalLength, ${e}u);
    for (var i = local_idx; i < ${r}u; i += 256u) {
      if (i < provided) { smem[i] = ${c("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();
    for (var k = local_idx + 1u; k < ${t}; k += 256u) {
      let h = smem[k];
      smem[${r}u - k] = vec2<f32>(h.x, -h.y);
    }
    workgroupBarrier();`}else f=`
    let loadCount = min(uniforms.signalLength, ${r}u);
    for (var i = local_idx; i < ${r}u; i += 256u) {
      if (i < loadCount) { smem[i] = ${c("i")}; } else { smem[i] = vec2<f32>(0.0); }
    }
    workgroupBarrier();`;let{code:m,resultOffset:g}=((e,t,r)=>{let i="",a=1,s=0;for(let n of e)i+=aR(n,a,t,s,r),a*=n,s=512-s;return{code:i,resultOffset:s}})(d,r,u),y=1===l?`smem[${g}u + i]`:`smem[${g}u + i] * ${aO(l)}`,_=2===a?h.setByOffset("off + 1u",`${o}(v.y)`):"";return`
  ${aD(e,p,h)}
  var<workgroup> smem: array<vec2<f32>, 1024>;
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${e.mainStart(256)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${i}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${a}u;
    ${f}
${m}    for (var i = local_idx; i < uniforms.outputLength; i += 256u) {
      let v = ${y};
      let off = outBase + i * uniforms.inner * ${a}u;
      ${h.setByOffset("off",`${o}(v.x)`)}
      ${_}
    }
  }`},getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:aM(e),dispatchGroup:{x:e.batch}})}})(p):(e=>{let{dataType:t,length:r,inputComponents:i,outputComponents:a,inverse:s,onesided:n}=e,o=tq(t),u=s?1:-1,l=s?1/r:1;return{name:"DFT",shaderCache:{hint:aB(e,"direct"),inputDependencies:["type"]},getShaderSource:e=>{let d=tQ("x",t,[1]),p=tX("y",t,[1]),h=e=>{let t=`inBase + (${e}) * uniforms.inner * ${i}u`,r=`f32(${d.getByOffset(t)})`,a=2===i?`f32(${d.getByOffset(`${t} + 1u`)})`:"0.0";return`vec2<f32>(${r}, ${a})`},c=s&&n?`fn spectrum(inBase: u32, k: u32) -> vec2<f32> {
    let provided = min(uniforms.signalLength, ${Math.floor(r/2)+1}u);
    if (k < provided) { return ${h("k")}; }
    let m = ${r}u - k;
    if (m < provided) {
      let h = ${h("m")};
      return vec2<f32>(h.x, -h.y);
    }
    return vec2<f32>(0.0, 0.0);
  }`:`fn spectrum(inBase: u32, n: u32) -> vec2<f32> {
    if (n < uniforms.signalLength) { return ${h("n")}; }
    return vec2<f32>(0.0, 0.0);
  }`,f=`
      let angle = ${aO(u*az)} * f32(knMod) / ${aO(r)};
      acc += cmul(spectrum(inBase, n), vec2<f32>(cos(angle), sin(angle)));
      knMod += k;
      if (knMod >= ${r}u) { knMod -= ${r}u; }`,m=2===a?p.setByOffset("off + 1u",`${o}(v.y)`):"",g=1===l?"acc":`acc * ${aO(l)}`;return`
  ${aD(e,d,p)}
  fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }
  ${c}
  ${e.mainStart(256)}
    let row = workgroup_index;
    if (row >= uniforms.batch) { return; }
    let outer = row / uniforms.inner;
    let within = row % uniforms.inner;
    let inBase = (outer * uniforms.signalLength * uniforms.inner + within) * ${i}u;
    let outBase = (outer * uniforms.outputLength * uniforms.inner + within) * ${a}u;
    for (var k = local_idx; k < uniforms.outputLength; k += 256u) {
      var acc = vec2<f32>(0.0, 0.0);
      var knMod = 0u;
      for (var n = 0u; n < ${r}u; n++) {${f}
      }
      let v = ${g};
      let off = outBase + k * uniforms.inner * ${a}u;
      ${p.setByOffset("off",`${o}(v.x)`)}
      ${m}
    }
  }`},getRunData:()=>({outputs:[{dims:e.outputDims,dataType:t}],programUniforms:aM(e),dispatchGroup:{x:e.batch}})}})(p);e.compute(h,{inputs:[0]})},aL=e=>tP({axis:e.axis??1,inverse:e.inverse??0,onesided:e.onesided??0})}),aZ=u(()=>{e3(),tl(),tU(),t2(),aF="^"+(aq="("+(aV="[a-zA-Z]|\\.\\.\\.")+")+")+"$",aG="^"+("("+aq+",)*")+aq+"$",aW=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);void 0===r?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},aH=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=[],this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(aG)))throw Error("Invalid LHS term");if(r.split(",").forEach((t,r)=>{let i=e[r].dims.slice();if(!t.match(RegExp(aF)))throw Error("Invalid LHS term");let a=this.processTerm(t,!0,i,r);this.lhs.push(a)}),""===i)i+=[...this.symbolToInfo.entries()].filter(([e,t])=>1===t.count||"..."===e).map(([e])=>e).join("");else if(!i.match(RegExp(aq)))throw Error("Invalid RHS");i.match(RegExp(aV,"g"))?.forEach(e=>{if("..."===e)this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let t=this.symbolToInfo.get(e);if(void 0===t)throw Error("Invalid RHS symbol");this.outputDims.push(t.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(void 0!==i){if(i.dimValue!==t&&1!==i.count)throw Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,s=!1,n=[],o=0;if(!e.match(RegExp(aF))&&!t&&""!==e)throw Error("Invalid LHS term");let u=e.match(RegExp(aV,"g")),l=new aW(i);return u?.forEach((e,d)=>{if("..."===e){if(s)throw Error("Only one ellipsis is allowed per input term");s=!0;let e=a-u.length+1;if(e<0)throw Error("Ellipsis out of bounds");if(n=r.slice(o,o+e),this.hasEllipsis){if(this.ellipsisDims.length!==n.length||this.ellipsisDims.toString()!==n.toString())throw Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=n;else throw Error("Ellipsis must be specified in the LHS");for(let e=0;e<n.length;e++){let t=String.fromCharCode(48+e);l.addSymbol(t,d+e),this.addSymbol(t,r[o++],i)}}else l.addSymbol(e,d+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(e,r[o++],i)}),l}},aj=(e,t)=>{var r,i,a,s;let n,o,u,l,d=new aH(e.inputs,t.equation),p=d.outputDims,h=e.inputs.map((e,t)=>e.dims);e.compute((r=h,i=e.inputs[0].dataType,a=d,s=p,n=r.map(e=>e.length).map((e,t)=>tQ(`input${t}`,i,e)),o=ta.size(s),u=tX("output",i,s.length),l=[...a.symbolToInfo.keys()].filter(e=>!a.rhs.symbolToIndices.has(e)),{name:"Einsum",shaderCache:{hint:a.equation,inputDependencies:r.map(()=>"rank")},getRunData:()=>{let e=l.filter(e=>a.symbolToInfo.has(e)).map(e=>({type:12,data:a.symbolToInfo.get(e)?.dimValue||0}));e.push({type:12,data:o});let t=r.map((e,t)=>[...tF(e)]).reduce((e,t)=>e.concat(t),e);return t.push(...tF(s)),{outputs:[{dims:s,dataType:i}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:t}},getShaderSource:e=>{let t=[],r=[],i=[],s=[],o=[],d=a.symbolToInfo.size===a.rhs.symbolToIndices.size;a.symbolToInfo.forEach((e,l)=>{if(a.rhs.symbolToIndices.has(l)){let r=a.rhs.symbolToIndices.get(l)?.[0];void 0!==r&&a.lhs.forEach((i,a)=>{if(e.inputIndices.includes(a)){let e=i.symbolToIndices.get(l);if(void 0===e)throw Error("Invalid symbol error");e.forEach(e=>{t.push(`${n[a].indicesSet(`input${a}Indices`,e,u.indicesGet("outputIndices",r))}`)})}})}else a.lhs.forEach((t,i)=>{if(e.inputIndices.includes(i)){let e=t.symbolToIndices.get(l);if(void 0===e)throw Error("Invalid symbol error");e.forEach(e=>{r.push(`${n[i].indicesSet(`input${i}Indices`,e,`${l}`)}`)}),o.push(`prod *= ${n[i].getByIndices(`input${i}Indices`)};`)}}),i.push(`for(var ${l}: u32 = 0; ${l} < uniforms.${l+"_max"}; ${l}++) {`),s.push("}")});let p=d?[...t,`let sum = ${n.map((e,t)=>e.getByIndices(`input${t}Indices`)).join(" * ")};`]:[...t,"var sum = 0.0;",...i,...r,"var prod = 1.0;",...o,"sum += prod;",...s];return`
            ${e.registerUniforms(l.map(e=>({name:`${e+"_max"}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,u)}

            ${e.mainStart()}
            ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${u.offsetToIndices("global_idx")};
            ${n.map((e,t)=>`var input${t}Indices: ${n[t].type.indices};`).join(`
`)}
            ${p.join(`
`)};
            ${u.setByOffset("global_idx","sum")};
          }`}}))},aK=e=>{let t=e.equation.replace(/\s+/g,"");return tP({equation:t})}}),aY=u(()=>{e3(),tl(),t2(),aQ=(e,t)=>{let r=e.length-t.length,i=[];for(let t=0;t<r;++t)i.push(e[t]);for(let a=0;a<t.length;++a)i.push(1===t[a]?e[a+r]:t[a]);return i},aX=e=>{var t;let r,i,a,s,n,o,u,l,d,p;(e=>{if(!e||2!==e.length)throw Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&1!==r[i]&&1!==t[a])throw Error("Expand requires shape to be broadcastable to input")})(e.inputs),e.compute((s=(r=a=(t=e.inputs)[0].dims,i=Array.from(t[1].getBigInt64Array(),Number),r.length>i.length?aQ(r,i):aQ(i,r)),o=9===(n=t[0].dataType)||1===ta.size(a),u=9===n||a.length>0&&a[a.length-1]%4==0?4:1,l=o||s.length>0&&s[s.length-1]%4==0?4:1,p=[{type:12,data:d=Math.ceil(ta.size(s)/l)},...tF(a,s)],{name:"Expand",shaderCache:{hint:`${s.length};${u}${l}`,inputDependencies:["rank"]},getShaderSource:e=>{let t=tQ("input",n,a.length,u),r=tX("output",n,s.length,l),i;if(9===n){let e=(e,i,a="")=>`
          let outputIndices${i} = ${r.offsetToIndices(`outputOffset + ${i}u`)};
          let offset${i} = ${t.broadcastedIndicesToOffset(`outputIndices${i}`,r)};
          let index${i} = offset${i} / 4u;
          let component${i} = offset${i} % 4u;
          ${e}[${i}] = ${a}(${t.getByOffset(`index${i}`)}[component${i}]);
        `;i=`
        let outputOffset = global_idx * ${l};
        var data = vec4<u32>(0);
        ${e("data",0,"u32")}
        ${e("data",1,"u32")}
        ${e("data",2,"u32")}
        ${e("data",3,"u32")}
        ${r.setByOffset("global_idx","data")}
      }`}else i=`
        let outputIndices = ${r.offsetToIndices(`global_idx * ${l}`)};
        let inputOffset = ${t.broadcastedIndicesToOffset("outputIndices",r)};
        let data = ${r.type.value}(${t.getByOffset(`inputOffset / ${u}`)});
        ${r.setByOffset("global_idx","data")}
      }`;return`
    ${e.registerUniform("vec_size","u32").declareVariables(t,r)}
    ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${i}`},getRunData:()=>({outputs:[{dims:s,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p})}),{inputs:[0]})}}),a0=u(()=>{e3(),tl(),t2(),iT(),aJ=e=>{var t;let r,i,a,s;e.inputs.length<2||0===ta.size(e.inputs[1].dims)?i$(e):e.compute((r=(t=e.inputs)[0].dataType,i=ta.size(t[0].dims),s=(a=ta.size(t[1].dims))%4==0,{name:"FastGeluWithBias",shaderCache:{hint:`${s}`,inputDependencies:["type","type"]},getShaderSource:e=>{let t=tQ("x",r,[1],4),i=tQ("bias",r,[1],4),a=tX("y",r,[1],4),n=e=>`
      let bias${e}_offset: u32 = (global_idx * 4 + ${e}) % uniforms.bias_size;
      let bias${e} = ${i.getByOffset(`bias${e}_offset / 4`)}[bias${e}_offset % 4];`,o=s?`
      let bias = ${i.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${n(0)}${n(1)}${n(2)}${n(3)}
      let bias = ${t.type.value}(bias0, bias1, bias2, bias3);`;return`${e.registerUniforms([{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}]).declareVariables(t,i,a)}

    ${i_(tq(r))}

    ${e.mainStart(tL)}
      ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${t.getByOffset("global_idx")};
      ${o}
      let x_in = x + bias;
      ${a.setByOffset("global_idx",ib("x_in"))}
    }`},getRunData:e=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],programUniforms:[{type:12,data:Math.ceil(i/4)},{type:12,data:a}],dispatchGroup:{x:Math.ceil(i/tL/4)}})}))}}),a3=u(()=>{e3(),tl(),tU(),t2(),a1=e=>tP({axis:e.axis}),a2=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h;(e=>{if(!e||2!==e.length)throw Error("Gather requires 2 inputs.")})(e.inputs),e.compute((r=e.inputs,i=t,a=r[0].dims,s=r[1].dims,n=a.length,o=ta.normalizeAxis(i.axis,n),(u=a.slice(0)).splice(o,1,...s),l=a[o],d=9===r[0].dataType?4:1,h=[{type:12,data:p=Math.ceil(ta.size(u)/d)},{type:6,data:l},{type:12,data:o},...tF(r[0].dims,r[1].dims,u)],{name:"Gather",shaderCache:{hint:i.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:u,dataType:r[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:h}),getShaderSource:e=>{let t=tQ("data",r[0].dataType,r[0].dims.length,d),i=tQ("inputIndices",r[1].dataType,r[1].dims.length),a=tX("output",r[0].dataType,u.length,d),l=e=>{let r=s.length,a=`var indicesIndices${e}  = ${i.type.indices}(0);`;for(let t=0;t<r;t++)a+=`${r>1?`indicesIndices${e}[${t}]`:`indicesIndices${e}`} = ${u.length>1?`outputIndices${e}[uniforms.axis + ${t}]`:`outputIndices${e}`};`;a+=`
          var idx${e} = ${i.getByIndices(`indicesIndices${e}`)};
          if (idx${e} < 0) {
            idx${e} = idx${e} + uniforms.axisDimLimit;
          }
          var dataIndices${e} : ${t.type.indices};
        `;for(let t=0,i=0;t<n;t++)t===o?(a+=`${n>1?`dataIndices${e}[${t}]`:`dataIndices${e}`} = u32(idx${e});`,i+=r):(a+=`${n>1?`dataIndices${e}[${t}]`:`dataIndices${e}`} = ${u.length>1?`outputIndices${e}[${i}]`:`outputIndices${e}`};`,i++);return a},p;if(9===r[0].dataType){let e=(e,r,i="")=>`
          let outputIndices${r} = ${a.offsetToIndices(`outputOffset + ${r}u`)};
          ${l(r)};
          let offset${r} = ${t.indicesToOffset(`dataIndices${r}`)};
          let index${r} = offset${r} / 4u;
          let component${r} = offset${r} % 4u;
          ${e}[${r}] = ${i}(${t.getByOffset(`index${r}`)}[component${r}]);
        `;p=`
        let outputOffset = global_idx * ${d};
        var value = vec4<u32>(0);
        ${e("value",0,"u32")}
        ${e("value",1,"u32")}
        ${e("value",2,"u32")}
        ${e("value",3,"u32")}
        ${a.setByOffset("global_idx","value")}
      `}else p=`
      let outputIndices = ${a.offsetToIndices("global_idx")};
      ${l("")};
      let value = ${t.getByIndices("dataIndices")};
      ${a.setByOffset("global_idx","value")};
      `;return`
      ${e.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(t,i,a)}
      ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${p}
      }`}}))}}),a8=u(()=>{e3(),tl(),t2(),a4=(e,t)=>{var r,i,a,s,n,o;let u,l,d=e.inputs,p=d[0].dims,h=d[0].dataType,c=d[1].dims,f=c[c.length-1],m=ta.sizeToDimension(c,c.length-1),g=ta.sizeFromDimension(p,t.batchDims+f),y=ta.sizeToDimension(p,t.batchDims),_=ta.sizeFromDimension(p,t.batchDims),b=Array(f),$=g;for(let e=0;e<f;++e)b[f-1-e]=$,$*=p[t.batchDims+f-1-e];let w=(r=e,i=d[1],a=b,s=t.batchDims,n=p,u=[{type:12,data:o=m},{type:12,data:s},{type:12,data:n},{type:12,data:a},{type:12,data:m/y},{type:12,data:_},{type:12,data:f}],l=[o],u.push(...tF(i.dims,l)),r.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${a.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:l,dataType:r.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:e=>{let t=tQ("indices_data",i.dataType,i.dims.length),r=tX("input_slice_offsets_data",12,1,1),s=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:a.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${e.registerUniforms(s).declareVariables(t,r)}
  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${1===n.length?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${1===a.length?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`}},{inputs:[i],outputs:[-1]})[0]),v=t.batchDims+f;if(v>p.length)throw Error("last dimension of indices must not be larger than rank of input tensor");let x=c.slice(0,-1).concat(p.slice(v)),S=ta.size(x),T=[{type:12,data:S},{type:12,data:g},...tF(d[0].dims,w.dims,x)];e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:h}],dispatchGroup:{x:Math.ceil(S/64)},programUniforms:T}),getShaderSource:e=>{let t=tQ("data",d[0].dataType,d[0].dims.length),r=tQ("slice_offsets",12,w.dims.length),i=tX("output",d[0].dataType,x.length);return`
          ${e.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(t,r,i)}
            ${e.mainStart()}
            ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`}},{inputs:[d[0],w]})},a6=e=>({batchDims:e.batch_dims,cacheKey:""})}),a9=u(()=>{e3(),tl(),tU(),t2(),a5=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h,c;((e,t)=>{if(e.length<3||e.length>4)throw Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=ta.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],s=e[2],n=4===e.length?e[3]:void 0;if(s.dims.length!==a.dims.length||!a.dims.map((e,t)=>t===r?Math.ceil(e/i)===s.dims[t]:e===s.dims[t]).reduce((e,t)=>e&&t,!0))throw Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(n){if(n.dataType!==a.dataType)throw Error("Zero point must have the same data type as the input tensor.");if(n.dims.length!==s.dims.length||!n.dims.map((e,t)=>e===s.dims[t]).reduce((e,t)=>e&&t,!0))throw Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}})(e.inputs,t),e.compute((r=e.inputs,i=t,a=r[0].dims,s=r[1].dims,n=a.length,o=ta.normalizeAxis(i.gatherAxis,n),u=ta.normalizeAxis(i.quantizeAxis,n),(l=a.slice(0)).splice(o,1,...s),d=ta.size(l),p=r[2].dataType,h=22===r[0].dataType,c=[{type:12,data:d},{type:12,data:u},{type:12,data:o},{type:12,data:i.blockSize},...tF(...r.map((e,t)=>e.dims),l)],{name:"GatherBlockQuantized",shaderCache:{hint:`${i.cacheKey};${r.filter((e,t)=>1!==t).map(e=>e.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:r.length},(e,t)=>"rank")},getRunData:()=>({outputs:[{dims:l,dataType:p}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c}),getShaderSource:e=>{let t=tQ("data",r[0].dataType,r[0].dims.length),i=tQ("inputIndices",r[1].dataType,r[1].dims.length),n=tQ("scales",r[2].dataType,r[2].dims.length),u=r.length>3?tQ("zeroPoint",r[3].dataType,r[3].dims.length):void 0,d=tX("output",p,l.length),c=[t,i,n];return u&&c.push(u),`
        ${e.registerUniforms([{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}]).declareVariables(...c,d)}
        ${e.mainStart()}
        let output_indices = ${d.offsetToIndices("global_idx")};
        var indices_indices = ${i.type.indices}(0);
        ${s.length>1?`
          for (var i: u32 = 0; i < ${s.length}; i++) {
            let index = ${d.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${i.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${d.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${t.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${d.indicesGet("output_indices","i")};
          ${t.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${i.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${a[o]};
        }
        ${t.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${l.length}; i++) {
          let index = ${d.indicesGet("output_indices",`i + ${s.length} - 1`)};
          ${t.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${t.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${t.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${h?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${n.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${n.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${n.getByIndices("scale_indices")};
        ${u?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${u.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${u.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${h?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${tq(p)}(quantized_data - zero_point) * scale;
        ${d.setByOffset("global_idx","dequantized_data")};
    }`}}))},a7=e=>tP({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),sr=u(()=>{e3(),tl(),tU(),t2(),se=e=>tP({axis:e.axis}),st=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h,c,f,m,g;(e=>{if(!e||2!==e.length)throw Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)})(e.inputs),e.compute((r=e.inputs,i=t,a=r[0].dims,s=r[0].dataType,n=a.length,o=r[1].dims,u=r[1].dataType,d=a[l=ta.normalizeAxis(i.axis,n)],p=o.slice(0),h=ta.size(p),c=tQ("input",s,n),f=tQ("indicesInput",u,o.length),m=tX("output",s,p.length),(g=[{type:12,data:h},{type:6,data:d},{type:12,data:l}]).push(...tF(a,o,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:r[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:g}),getShaderSource:e=>`
      ${e.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(c,f,m)}
      ${e.mainStart()}
      ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${m.offsetToIndices("global_idx")};

      var idx = ${f.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${c.type.indices}(outputIndices);
      ${c.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${c.getByIndices("inputIndices")};

      ${m.setByOffset("global_idx","value")};
  }`}))}}),ss=u(()=>{e3(),tl(),t2(),si=e=>({transA:e.transA,transB:e.transB,alpha:e.alpha,beta:e.beta,cacheKey:`${e.transA};${e.transB};${1===e.alpha}`}),sa=(e,t)=>{(e=>{if(!e)throw Error("Input is missing");if(e.length<2||e.length>3)throw Error("Invaid input number.");if(3===e.length&&e[2].dims.length>2)throw Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||3===e.length&&e[0].dataType!==e[2].dataType)throw Error("Input types are mismatched")})(e.inputs),e.compute(((e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,s,n]=tn.getShapeOfGemmResult(r,t.transA,i,t.transB,3===e.length?e[2].dims:void 0),o=[a,s],u=Math.ceil(s/16),l=Math.ceil(a/16),d=(ta.size(o),[{type:12,data:u},{type:12,data:a},{type:12,data:s},{type:12,data:n},{type:1,data:t.alpha},{type:1,data:t.beta}]),p=["type","type"];return 3===e.length&&(d.push(...tF(e[2].dims)),p.push("rank")),d.push(...tF(o)),{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:u*l},programUniforms:d}),getShaderSource:r=>{let i=tQ("a",e[0].dataType,e[0].dims),a=tQ("b",e[1].dataType,e[1].dims),s=null,n=[i,a];3===e.length&&(s=tQ("c",e[2].dataType,e[2].dims.length),n.push(s));let u=tX("output",e[0].dataType,o.length);n.push(u);let l="",d="";t.transA&&t.transB?(d=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${i.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${a.type.value}(0);
      }
      `,l="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(d=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${i.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${a.type.value}(0);
      }
      `,l="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(d=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${i.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${a.type.value}(0);
      }
      `,l="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):t.transA||t.transB||(d=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${i.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${a.type.value}(0);
      }
      `,l="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let p=1===t.alpha?"":"value *= uniforms.alpha;";return`
  ${r.registerUniforms([{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}]).declareVariables(...n)}
  var<workgroup> tile_a: array<array<${i.type.storage}, 16>, 16>;
  var<workgroup> tile_b: array<array<${a.type.storage}, 16>, 16>;
  ${r.mainStart([16,16,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * 16;
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * 16;
    let num_tiles = (uniforms.K - 1) / 16 + 1;
    var k_start = 0u;
    var value = ${u.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${d}
      k_start = k_start + 16;
      workgroupBarrier();

      for (var k: u32 = 0u; k < 16; k++) {
        ${l}
      }
      workgroupBarrier();
    }

    ${p}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${null!=s?`let cOffset = ${s.broadcastedIndicesToOffset("vec2(m, n)",u)}; value += ${u.type.value}(uniforms.beta) * ${s.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`}}})(e.inputs,t))}}),sc=u(()=>{e3(),tl(),tU(),t2(),[sn,so,su,sl]=[0,1,2,3],sd=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,sp=(e,t)=>{var r,i;let a,s,n,o,u,l,d;(e=>{if(4!==e[0].dims.length)throw Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw Error("grid batch size must match input batch size")})(e.inputs),e.compute((r=e.inputs,i=t,a=tQ("x",r[0].dataType,r[0].dims.length),s=[r[1].dims[0],r[1].dims[1],r[1].dims[2]],n=tQ("grid",r[1].dataType,s.length,2),o=[r[0].dims[0],r[0].dims[1],r[1].dims[1],r[1].dims[2]],"NHWC"===i.format&&(o=[r[0].dims[0],r[1].dims[1],r[1].dims[2],r[0].dims[3]],[sn,so,su,sl]=[0,3,1,2]),u=tX("output",r[0].dataType,o.length),l=a.type.value,d=[{type:12,data:ta.size(o)},...tF(r[0].dims,s,o)],{name:"GridSample",shaderCache:{hint:`${i.cacheKey}`,inputDependencies:["type","type"]},getRunData:e=>{let t=ta.size(o);return{outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(t/64)},programUniforms:d}},getShaderSource:e=>{let t,r,s,o,d,p,h,c,f;return`
  ${e.registerUniform("output_size","u32").declareVariables(a,n,u)}
  ${sd}
  ${t=l,`
  fn gs_bicubic_interpolate(p: mat4x4<${t}>, x: f32, y: f32) -> ${t} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${t}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`}
  ${r=i,`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${0===r.alignCorners?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`}
  ${s=i,`
  ${"reflection"===s.paddingMode?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`}
  ${o=a,d=l,p=i,`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${d} {
     var pixel = ${d}(0);
     var indices = vec4<u32>(0);
     indices[${sn}] = batch;
     indices[${so}] = channel;`+(()=>{switch(p.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${su}] = u32(r);
            indices[${sl}] = u32(c);
          } else {
            return ${d}(0);
          }
        `;case"border":return`
          indices[${su}] = u32(clamp(r, 0, H - 1));
          indices[${sl}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${su}] = gs_reflect(r, border[1], border[3]);
          indices[${sl}] = gs_reflect(c, border[0], border[2]);
        `;default:throw Error(`padding mode ${p.paddingMode} is not supported`)}})()+`
    return ${o.getByIndices("indices")};
  }
`}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${su}]);
      let W_in = i32(uniforms.x_shape[${sl}]);

      ${0===i.alignCorners?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${u.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${sn}], indices[${su}], indices[${sl}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${h=u,c=l,f=i,(()=>{switch(f.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${sn}], indices[${so}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${sn}], indices[${so}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${sn}], indices[${so}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${sn}], indices[${so}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${sn}], indices[${so}], border);

          let dx2 = ${c}(f32(x2) - x);
          let dx1 = ${c}(x - f32(x1));
          let dy2 = ${c}(f32(y2) - y);
          let dy1 = ${c}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${c}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${sn}], indices[${so}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw Error(`mode ${f.mode} is not supported`)}})()+`${h.setByOffset("global_idx","result")}`}
  }`}}))},sh=e=>tP({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),sb=u(()=>{e3(),tl(),tU(),tE(),rL(),t2(),t5(),sf=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,sm=e=>tP({...e}),sg=tP({perm:[0,2,1,3]}),sy=(e,t,r,i,a,s,n,o)=>{var u,l,d,p,h,c,f;let m,g,y,_=s;if(!(n&&ta.size(n.dims)>0))return 3===s.dims.length&&(_=s.reshape([t,i,r,a])),1===r||1===i?_:e.compute(t4(_,sg.perm),{inputs:[_],outputs:[-1]})[0];if(1===i)throw Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return _=(u=e,l=s,d=n,p=t,h=i,c=r*a,f=o,m=[p,h,c],y=[{type:12,data:g=ta.size(m)},{type:12,data:f},{type:12,data:c}],_=u.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:m,dataType:l.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:y}),getShaderSource:e=>{let t=tX("qkv_with_bias",l.dataType,m),r=tQ("qkv",l.dataType,m),i=tQ("bias",d.dataType,m);return`
  ${e.registerUniforms([{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}]).declareVariables(r,i,t)}
  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`}},{inputs:[l,d],outputs:[-1]})[0]).reshape([t,i,r,a]),1===r||1===i?_:e.compute(t4(_,sg.perm),{inputs:[_],outputs:[-1]})[0]},s_=(e,t)=>{let r=((e,t)=>{let r,i=e[0],a=sf(e,1),s=sf(e,2),n=sf(e,3),o=sf(e,4),u=sf(e,5),l=sf(e,6),d=sf(e,7);if(3!==i.dims.length&&5!==i.dims.length)throw Error("Input query is expected to have 3 or 5 dimensions");let p=i.dims[0],h=i.dims[1],c=3===i.dims.length?i.dims[2]:t.numHeads*i.dims[4],f=h,m=0,g=0,y=Math.floor(c/t.numHeads);if(l&&d&&ta.size(l.dims)&&ta.size(d.dims)){if(4!==l.dims.length)throw Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==p||l.dims[1]!==t.numHeads||l.dims[3]!==y)throw Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==p||d.dims[1]!==t.numHeads||d.dims[3]!==y)throw Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==d.dims[2])throw Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(4!==d.dims.length)throw Error('Input "past_value" is expected to have 4 dimensions');m=l.dims[2],g=l.dims[2]}else if(l&&ta.size(l.dims)||d&&ta.size(d.dims))throw Error('Input "past_key" and "past_value" shall be both present or both absent');if(a&&ta.size(a.dims)>0){if(3!==i.dims.length)throw Error('Input "query" is expected to have 3 dimensions when key is given');if(a.dims.length<3||a.dims.length>5)throw Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(i.dims[0]!==a.dims[0])throw Error('Input "query" and "key" shall have same dim 0 (batch size)');if(3===a.dims.length){if(a.dims[2]!==i.dims[2])throw Error('Input "query" and "key" shall have same dim 2 (hidden_size)');r=2,f=a.dims[1]}else if(5===a.dims.length){if(a.dims[2]!==t.numHeads||2!==a.dims[3]||a.dims[4]!==y)throw Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(s)throw Error('Expect "value" be none when "key" has packed kv format.');r=5,f=a.dims[1]}else{if(a.dims[1]!==t.numHeads||a.dims[3]!==y)throw Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');r=0,f=a.dims[2]}}else{if(5!==i.dims.length)throw Error('Input "query" is expected to have 5 dimensions when key is empty');if(i.dims[2]!==t.numHeads||3!==i.dims[3])throw Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');r=3}if(n&&ta.size(n.dims)>0){if(1!==n.dims.length)throw Error('Input "bias" is expected to have 1 dimension');if(a&&5===a.dims.length&&2===a.dims[3])throw Error("bias is not allowed for packed kv.")}let _=m+f,b=0;if(o&&ta.size(o.dims)>0){b=8;let e=o.dims;throw 1===e.length?e[0]===p?b=1:e[0]===3*p+2&&(b=3):2===e.length&&e[0]===p&&e[1]===_&&(b=5),8===b?Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):Error("Mask not supported")}let $=!1,w=c;if(s&&ta.size(s.dims)>0){if(3!==s.dims.length&&4!==s.dims.length)throw Error('Input "value" is expected to have 3 or 4 dimensions');if(i.dims[0]!==s.dims[0])throw Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(3===s.dims.length){if(f!==s.dims[1])throw Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');w=s.dims[2]}else{if(f!==s.dims[2])throw Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');w=s.dims[1]*s.dims[3],$=!0}}if(o&&ta.size(o.dims)>0)throw Error("Key padding mask is not supported");if(u&&ta.size(u.dims)>0){if(4!==u.dims.length)throw Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==p||u.dims[1]!==t.numHeads||u.dims[2]!==h||u.dims[3]!==_)throw Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:p,sequenceLength:h,pastSequenceLength:m,kvSequenceLength:f,totalSequenceLength:_,maxSequenceLength:g,inputHiddenSize:0,hiddenSize:c,vHiddenSize:w,headSize:y,vHeadSize:Math.floor(w/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:$,qkvFormat:r}})(e.inputs,t),i=e.inputs[0],a=sf(e.inputs,1),s=sf(e.inputs,2),n=sf(e.inputs,3),o=sf(e.inputs,4),u=sf(e.inputs,5),l=sf(e.inputs,6),d=sf(e.inputs,7);if(5===i.dims.length)throw Error("Packed QKV is not implemented");if(a?.dims.length===5)throw Error("Packed KV is not implemented");let p=a&&s&&4===a.dims.length&&4===s.dims.length,h=sy(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,n,0);if(p)return rP(e,h,a,s,o,void 0,l,d,u,r);if(!a||!s)throw Error("key and value must be provided");let c=sy(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,n,r.hiddenSize),f=sy(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,s,n,2*r.hiddenSize);rP(e,h,c,f,o,void 0,l,d,u,r)}}),sx=u(()=>{e3(),tl(),tU(),t2(),s$=(e,t)=>{let r=e[0].dims,i=ta.size(r),a=e[0].dataType,s=ta.normalizeAxis(t.axis,r.length),n=Array(t.numOutputs),o=tQ("input",a,r.length),u=Array(t.numOutputs),l=[],d=[],p=0,h=[{type:12,data:i}];for(let i=0;i<t.numOutputs;i++){p+=t.splitSizes[i],u[i]=p;let o=r.slice();o[s]=t.splitSizes[i],d.push(o),n[i]=tX(`output${i}`,a,o.length),l.push({dims:d[i],dataType:e[0].dataType})}return h.push({type:12,data:u},...tF(r,...d)),{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:e=>{let t;return`
  ${e.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...n)}
  ${t=u.length,`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${t}u; i += 1u ) {
    if (index < ${tK("uniforms.size_in_split_axis","i",t)}) {
        return i;
    }
    }
    return ${t}u;
}`}
  ${(e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");1===t?r.push(a):0===i?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`})(n)}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",s)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${tK("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",s,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`},getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:h})}},sw=(e,t)=>{let r,i;var a,s,n=e.inputs;if(!n||n.length<1)throw Error("too few inputs");let o=1===e.inputs.length?t:(a=e.inputs,r=[],i=(s=t).numOutputs,a[1].dims[0]>0&&(a[1].getBigInt64Array().forEach(e=>r.push(Number(e))),i=r.length),tP({numOutputs:i,axis:s.axis,splitSizes:r}));e.compute(s$(e.inputs,o),{inputs:[0]})},sv=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw Error("numOutputs and splitSizes length must be equal");return tP({axis:t,numOutputs:i,splitSizes:r})}}),sE=u(()=>{e3(),tl(),tU(),t2(),sS=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:s}=t,n=e[0].dims[0],o=ta.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,d=e[2].dims[1],p=0===a?2*d:l/i,h=[n,u,l/p,p-d],c=ta.computeStrides(h),f=[{type:1,data:s},{type:12,data:h},{type:12,data:c},...3===e[0].dims.length?Array({type:12,data:[o,l,p,1]}):[],...4===e[0].dims.length?Array({type:12,data:[o,p,u*p,1]}):[],...tF(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)];return{name:"RotaryEmbedding",shaderCache:{hint:tP({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:t=>{let i=tQ("input",e[0].dataType,e[0].dims.length),a=tQ("position_ids",e[1].dataType,e[1].dims.length),s=tQ("cos_cache",e[2].dataType,e[2].dims.length),n=tQ("sin_cache",e[3].dataType,e[3].dims.length),o=tX("output",e[0].dataType,e[0].dims.length);return t.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:c.length},{name:"input_output_strides",type:"u32",length:c.length}]),`
        ${t.declareVariables(i,a,s,n,o)}

        ${t.mainStart(tL)}
          let half_rotary_emb_dim = uniforms.${s.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${t.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${a.broadcastedIndicesToOffset("bsnh.xy",tX("",a.type.tensor,2))};
            let position_id =
                u32(${a.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${i.getByOffset("i")} * ${s.get("position_id","bsnh[3]")} -
                ${i.getByOffset("j")} * ${n.get("position_id","bsnh[3]")};
            ${o.setByOffset("i","re")}
            let im = ${i.getByOffset("i")} * ${n.get("position_id","bsnh[3]")} +
                ${i.getByOffset("j")} * ${s.get("position_id","bsnh[3]")};
            ${o.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${o.setByOffset("k",i.getByOffset("k"))}
          }
        }`},getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(ta.size(h)/tL)},programUniforms:f})}},sT=(e,t)=>{((e,t)=>{let[r,i,a,s]=e,{numHeads:n,rotaryEmbeddingDim:o}=t;if(3!==r.dims.length&&4!==r.dims.length)throw Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!ta.areEqual(i.dims,[])&&!ta.areEqual(i.dims,[1])&&2!==i.dims.length)throw Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(2!==a.dims.length)throw Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(2!==s.dims.length)throw Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${s.dims.length}`);if(!ta.areEqual(a.dims,s.dims))throw Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&0===n)throw Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],l=r.dims[r.dims.length-2],d=a.dims[0],p=ta.sizeFromDimension(r.dims,1)/l,h=0===o?2*a.dims[1]:p/n;if(o>h)throw Error("rotary_embedding_dim must be less than or equal to head_size");if(2===i.dims.length){if(u!==i.dims[0])throw Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(l!==i.dims[1])throw Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(l>d)throw Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported");if(h/2!==a.dims[1]&&o/2!==a.dims[1])throw Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`)})(e.inputs,t),e.compute(sS(e.inputs,t))}}),sz=u(()=>{tU(),e3(),rL(),sb(),sx(),t5(),sE(),t2(),sk=tP({perm:[0,2,1,3]}),sI=(e,t,r)=>{let i=t,a=r.kvNumHeads;return 3===t.dims.length&&0!==r.kvSequenceLength&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(t4(i,sk.perm),{inputs:[i],outputs:[-1]})[0]),i},sC=(e,t)=>{if(e.inputs.length>14&&e.inputs[14]||e.inputs.length>15&&e.inputs[15])throw Error("GroupQueryAttention (JSEP): q_norm_weight / k_norm_weight inputs are not supported. The per-head Q/K RMS normalization prologue is implemented only on the CUDA and native WebGPU EPs.");let r=((e,t)=>{if(t.doRotary&&e.length<=7)throw Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],s=e[3],n=e[4];if(0!==t.doRotary&&e.length<=7)throw Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(-1!==t.localWindowSize)throw Error("Local attention is not supported");if(0!==t.softcap)throw Error("Softcap is not supported");if(0!==t.rotaryInterleaved)throw Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw Error("Smooth softmax is not supported");if(3!==r.dims.length&&5!==r.dims.length)throw Error("Input query is expected to have 3 or 5 dimensions");let o=r.dims[0],u=r.dims[1],l=3===r.dims.length?r.dims[2]:t.numHeads*r.dims[4],d=u,p=0,h=!i||0===i.dims.length,c=Math.floor(h?l/(t.numHeads+2*t.kvNumHeads):l/t.numHeads);h&&(l=c*t.numHeads);let f=s&&0!==s.dims.length,m=n&&0!==n.dims.length;if(f&&4===s.dims.length&&s.dims[0]===o&&s.dims[1]!==t.kvNumHeads&&s.dims[2]===t.kvNumHeads&&s.dims[3]===c)throw Error("BSNH pastKey/pastValue is not supported");if(f&&m){if(4!==s.dims.length)throw Error('Input "past_key" is expected to have 4 dimensions');if(4!==n.dims.length)throw Error('Input "past_value" is expected to have 4 dimensions');p=s.dims[2]}else if(f||m)throw Error('Input "past_key" and "past_value" shall be both present or both absent');let g=1;if(i&&i.dims.length>0){if(3!==r.dims.length)throw Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw Error('Input "query" and "key" shall have same dim 0 (batch size)');if(3===i.dims.length){if(r.dims[2]%i.dims[2]!=0)throw Error('Dimension 2 of "query" should be a multiple of "key"');d=i.dims[1]}else if(5===i.dims.length){if(i.dims[2]!==t.numHeads||2!==i.dims[3]||i.dims[4]!==c)throw Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw Error('Expect "value" be none when "key" has packed kv format.');d=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==c)throw Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');d=i.dims[2]}}else{if(3!==r.dims.length&&5!==r.dims.length)throw Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(5===r.dims.length&&(r.dims[2]!==t.numHeads||3!==r.dims[3]))throw Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');g=3}let y=!1,_=t.kvNumHeads?c*t.kvNumHeads:l;if(a&&a.dims.length>0){if(3!==a.dims.length&&4!==a.dims.length)throw Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(3===a.dims.length){if(d!==a.dims[1])throw Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');_=a.dims[2]}else{if(d!==a.dims[2])throw Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');_=a.dims[1]*a.dims[3],y=!0}}let b=e.length>4?e[5]:void 0;if(b){if(0===b.dims.length)throw Error("seqlens_k must be at least 1D, got scalar.");let e=b.dims.reduce((e,t)=>e*t,1);if(e!==o)throw Error(`seqlens_k must have batch_size (${o}) elements, got ${e}.`);for(let e=0;e<b.dims.length;e++)if(1!==b.dims[e]&&b.dims[e]!==o)throw Error(`seqlens_k has unexpected shape. Each dimension must be 1 or batch_size (${o}), got dims[${e}] = ${b.dims[e]}.`)}return{batchSize:o,sequenceLength:u,pastSequenceLength:p,kvSequenceLength:d,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:l,vHiddenSize:_,headSize:c,vHeadSize:Math.floor(_/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:0,scale:t.scale,broadcastResPosBias:!1,passPastInKv:y,qkvFormat:g}})(e.inputs,t);if(5===e.inputs[0].dims.length)throw Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,s=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,n=e.inputs[3]&&0!==e.inputs[3].dims.length?e.inputs[3]:void 0,o=e.inputs[4]&&0!==e.inputs[4].dims.length?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,d=r.kvNumHeads?r.kvNumHeads:r.numHeads,p=tP({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,d*r.headSize,d*r.headSize]}),[h,c,f]=a||s?[i,a,s]:e.compute(s$([i],p),{inputs:[i],outputs:[-1,-1,-1]}),m,g;if(t.doRotary){var y,_,b,$;let i,a,s,n=e.compute((y=r.batchSize,_=r.sequenceLength,b=u,$=l,i=[y*_],s=[{type:12,data:a=y*_},{type:12,data:_},{type:12,data:y}],{name:"GeneratePositionIds",shaderCache:{hint:`${y};${_}`,inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:i,dataType:7}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:s}),getShaderSource:e=>{let t=tQ("seq_lens",b.dataType,b.dims),r=tQ("total_seq_lens",$.dataType,$.dims),a=tX("pos_ids",7,i);return`
  ${e.registerUniforms([{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}]).declareVariables(t,r,a)}
  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${r.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${t.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${a.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${a.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${a.setByOffset("global_idx","seqlen")}
    };
  }
  `}}),{inputs:[u,l],outputs:[-1]})[0],o=e.inputs[7],d=e.inputs[8],p=tP({interleaved:0!==t.rotaryInterleaved,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),f=[h,n,o,d],w=[-1];m=e.compute(sS(f,p),{inputs:f,outputs:w})[0],f.splice(0,1,c);let v=tP({interleaved:0!==t.rotaryInterleaved,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});g=e.compute(sS(f,v),{inputs:f,outputs:w})[0]}let w=sy(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?m:h,void 0,0),v=sI(e,t.doRotary?g:c,r),x=sI(e,f,r);rP(e,w,v,x,void 0,void 0,n,o,void 0,r,u,l)}}),sR=u(()=>{e3(),tl(),t5(),t2(),sA=(e,t,r,i,a,s,n,o)=>{let u=tG(s),l=1===u?"f32":`vec${u}f`,d=1===u?"vec2f":`mat2x${u}f`,p=a*n,h=64;1===p&&(h=256);let c=[a,n,s/u],f=[a,n,2],m=[];return m.push(...tF(c,f)),e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:["rank","type","type"]},getRunData:()=>({outputs:[{dims:f,dataType:1}],dispatchGroup:{x:p},programUniforms:m}),getShaderSource:e=>{let a=tQ("x",t.dataType,3,u),s=[a,tQ("scale",r.dataType,r.dims),tQ("bias",i.dataType,i.dims),tX("output",1,3,2)];return`
  var<workgroup> workgroup_shared : array<${d}, ${h}>;
  const workgroup_size = ${h}u;
  ${e.declareVariables(...s)}
  ${e.mainStart(h)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${l}(0);
    var squared_sum = ${l}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${l}(${a.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${d}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${tj("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${tj("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`}},{inputs:[t,r,i],outputs:[-1]})[0]},sO=(e,t)=>{var r,i,a;let s,n,o,u,l,d,p,h,c;"NHWC"===t.format?((e,t,r)=>{let i=t[0].dims,a=i[0],s=i[i.length-1],n=ta.sizeFromDimension(i,1)/s,o=tG(s),u=ta.size(i)/o,l=[{type:12,data:n},{type:12,data:Math.floor(s/o)}],d=!1,p=[0,i.length-1];for(let e=0;e<i.length-2;e++)d=d||1!==i[e+1],p.push(e+1);let h=(d=d&&1!==i[i.length-1])?e.compute(t4(e.inputs[0],p),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(e,t)=>i[p[t]])),c=sA(e,h,t[1],t[2],a,n,s,r.epsilon);e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${o}`,inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:i,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:e=>{let r=tV(t[0].dataType),a=1===o?"vec2f":`mat${o}x2f`,s=e=>{let t=0===e?"x":"y",i=1===o?"f32":`vec${o}f`;switch(o){case 1:return`${r}(${i}(scale.${t}))`;case 2:return`vec2<${r}>(${i}(scale[0].${t}, scale[1].${t}))`;case 4:return`vec4<${r}>(${i}(scale[0].${t}, scale[1].${t}, scale[2].${t}, scale[3].${t}))`;default:throw Error(`Not supported compoents ${o}`)}},n=tQ("input",t[0].dataType,t[0].dims,o),u=tX("output",t[0].dataType,i,o);return`
  @group(0) @binding(0) var<storage, read> input : array<${n.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${a}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${u.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${e.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${s(0)}, ${s(1)});
  }`}},{inputs:[t[0],c]})})(e,e.inputs,t):(r=e,i=e.inputs,a=t,n=(s=i[0].dims)[0],o=s[1],u=ta.sizeFromDimension(s,2),l=tG(u),d=ta.size(s)/l,p=sA(r,i[0],i[1],i[2],n,u,o,a.epsilon),h=[n,o,u/l],c=[n,o],r.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:["type","none"]},getRunData:()=>({outputs:[{dims:s,dataType:i[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:[{type:12,data:d},...tF(h,c,h)]}),getShaderSource:e=>{let t=tQ("x",i[0].dataType,h.length,l),r=tQ("scale_shift",1,c.length,2),a=tX("output",i[0].dataType,h.length,l),s=[t,r,a];return`
  ${e.registerUniform("output_size","u32").declareVariables(...s)}
  ${e.mainStart()}
  ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${a.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${r.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${t.getByOffset("global_idx")} * ${a.type.value}(scale_shift.x) + ${a.type.value}(scale_shift.y);
      ${a.setByOffset("global_idx","value")};
  }`}},{inputs:[i[0],p]}))}}),sM=u(()=>{e3(),tl(),t2(),sB=(e,t)=>{(e=>{if(!e||e.length<2)throw Error("layerNorm requires at least 2 inputs.")})(e.inputs),e.compute(((e,t,r)=>{let i=t.simplified,a=e[0].dims,s=e[1],n=!i&&e[2],o=ta.normalizeAxis(t.axis,a.length),u=ta.sizeToDimension(a,o),l=ta.sizeFromDimension(a,o),d=ta.size(s.dims),p=n?ta.size(n.dims):0;if(d!==l||n&&p!==l)throw Error(`Size of X.shape()[axis:] == ${l}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${d} and bias size of ${p}`);let h=[];for(let e=0;e<a.length;++e)e<o?h.push(a[e]):h.push(1);let c=tG(l),f=["type","type"],m=[{type:12,data:u},{type:1,data:l},{type:12,data:Math.floor(l/c)},{type:1,data:t.epsilon}];n&&f.push("type");let g=r>1,y=r>2,_=[{dims:a,dataType:e[0].dataType}];return g&&_.push({dims:h,dataType:1}),y&&_.push({dims:h,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${c};${r};${i}`,inputDependencies:f},getRunData:()=>({outputs:_,dispatchGroup:{x:Math.ceil(u/64)},programUniforms:m}),getShaderSource:t=>{let r=tV(e[0].dataType),o=[tQ("x",e[0].dataType,e[0].dims,c),tQ("scale",s.dataType,s.dims,c)];return n&&o.push(tQ("bias",n.dataType,n.dims,c)),o.push(tX("output",e[0].dataType,a,c)),g&&o.push(tX("mean_data_output",1,h)),y&&o.push(tX("inv_std_output",1,h)),`
  ${t.registerUniforms([{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}]).declareVariables(...o)}
  ${t.mainStart()}
    ${t.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${tW("f32",c)};
    var mean_square_vector = ${tW("f32",c)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${tH(r,c,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${tj("mean_vector",c)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${tj("mean_square_vector",c)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${tH(r,c,"x[j + offset]")};
      let f32scale = ${tH(r,c,"scale[j]")};
      output[j + offset] = ${o[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${n?`+ ${tH(r,c,"bias[j]")}`:""}
      );
    }

    ${g?"mean_data_output[global_idx] = mean":""};
    ${y?"inv_std_output[global_idx] = inv_std_dev":""};
  }`}}})(e.inputs,t,e.outputCount))}}),sP=u(()=>{tl(),i2(),i5(),sD=e=>{var t=e.inputs;if(!t||2!==t.length)throw Error("MatMul requires 2 inputs.");if(t[0].dims[t[0].dims.length-1]!==t[1].dims[t[1].dims.length-2])throw Error("shared dimension does not match.");let r=ti.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!r)throw Error("Can't use matmul on the given tensors");let i=r[r.length-1],a=e.inputs[0].dims[e.inputs[0].dims.length-1];if(i<8&&a<8)e.compute(i1(e.inputs,{activation:""},r));else{let t=r[r.length-2],s=ta.size(e.inputs[0].dims.slice(0,-2)),n=ta.size(e.inputs[1].dims.slice(0,-2));if(1!==s&&1===t&&1===n){let t=e.inputs[0].reshape([1,s,a]),n=e.inputs[1].reshape([1,a,i]),o=[1,s,i],u=[t,n];e.compute(i8(u,{activation:""},r,o),{inputs:u})}else e.compute(i8(e.inputs,{activation:""},r))}}}),sN=u(()=>{e3(),tl(),tU(),t2(),sU=(e,t)=>{var r,i,a,s;let n,o,u,l,d,p,h,c,f,m,g,y,_,b,$,w,v,x,S,T,E,k,I,C,z,A,O,R,B,M,D,P,U,L,N,V,q,F,G,W,H,j;((e,t)=>{if(e.length<3||e.length>4)throw Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),s=t.blockSize/8*t.bits,n=e[1];if(!ta.areEqual(n.dims,[t.n,a,s]))throw Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(ta.size(o)!==t.n*a)throw Error("scales input size error.");if(4===e.length){let r=e[3].dims,i=t.n*(8===t.bits?a:Math.floor((a*t.bits+7)/8));if(ta.size(r)!==i)throw Error("zeroPoints input size error.")}})(e.inputs,t),32===t.blockSize&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute((r=e.inputs,i=t,o=(n=r[0].dims).length,u=n[o-2],l=i.k,d=i.n,p=n.slice(0,o-2),h=ta.size(p),c=r[1].dims[2]/4,f=r[0].dataType,m=tG(i.k),g=tG(c),y=p.concat([u,d]),b=128/(_=d%8==0?8:d%4==0?4:1),v=(w=b*g*($=Math.floor(32/i.bits)))/m,x=w/i.blockSize,S=ta.size(y)/_,T=[],E=[h,u,l/m],(k=ta.convertShape(r[1].dims).slice()).splice(-1,1,c/g),T.push(...tF(E)),T.push(...tF(k)),T.push(...tF(r[2].dims)),4===r.length&&T.push(...tF(ta.convertShape(r[3].dims))),I=[h,u,d],T.push(...tF(I)),{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${i.blockSize};${m};${g};${b};${_}`,inputDependencies:Array(r.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:f}],dispatchGroup:{x:S},programUniforms:T}),getShaderSource:e=>{let t=E.length,a=tQ("a",r[0].dataType,t,m),s=tQ("b",12,k.length,g),n=tQ("scales",r[2].dataType,r[2].dims.length),o=[a,s,n],u=4===r.length?tQ("zero_points",12,r[3].dims.length):void 0;u&&o.push(u);let l=I.length,d=tX("output",r[0].dataType,l),p=tV(r[0].dataType),h=()=>{switch(m){case 1:return`
          let a_data0 = vec4<${p}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${p}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${p}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${p}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw Error(`${m}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${a.type.value}, ${v}>;
        var<workgroup> inter_results: array<array<${d.type.value}, ${b}>, ${_}>;
        ${e.declareVariables(...o,d)}
        ${e.mainStart([b,_,1])}
          let output_indices = ${d.offsetToIndices(`workgroup_index * ${_}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${x} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${v};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${v}; a_offset += 128)
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${a.getByIndices(`${a.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${a.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${x} + local_id.x;
            ${u?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/i.bits)}u;
            let zero_point_bytes_per_col = (n_blocks_per_col + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${i.bits}u);
            let zero_point_word = ${u.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${p}((zero_point_word) & ${2===i.bits?"0x3u":"0xFu"});`:`
            // The default zero point is ${Math.pow(2,i.bits-1)} for unsigned ${i.bits}-bit quantization.
            let zero_point = ${p}(${Math.pow(2,i.bits-1).toFixed(1)});`}
            let scale = ${n.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${s.getByIndices(`${s.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${i.blockSize/m};
            for (var i: u32 = 0; i < ${g}; i++) {
              let b_value = ${1===g?"b_data":"b_data[i]"};
              ${(()=>{let e=Math.floor($/8),t="";for(let r=0;r<e;r++){let e=r*i.bits*4,a=e+i.bits;t+=`
              ${h()}
              {${2===i.bits?`
                let half_word = b_value >> ${16*r}u;
                let byte_lo = half_word & 0xFFu;
                let byte_hi = (half_word >> 8u) & 0xFFu;
                let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
                let b_value_lower = unpack4xU8(spread_word & 0x03030303u);
                let b_value_upper = unpack4xU8((spread_word >> 2u) & 0x03030303u);`:`
                let b_value_lower = unpack4xU8((b_value >> ${e}u) & 0x0F0F0F0Fu);
                let b_value_upper = unpack4xU8((b_value >> ${a}u) & 0x0F0F0F0Fu);`}
                let b_quantized_values = mat2x4<${p}>(${Array.from({length:4},(e,t)=>`${p}(b_value_lower[${t}]), ${p}(b_value_upper[${t}])`).join(", ")});
                let b_dequantized_values = (b_quantized_values - mat2x4<${p}>(${Array(8).fill("zero_point").join(",")})) * scale;
                inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(e,t)=>`dot(a_data${t}, b_dequantized_values[${t}])`).join(" + ")};
              }
              word_offset += ${8/m};`}return t})()}
            }
            workgroupBarrier();
          }

          if (local_idx < ${_}) {
            var output_value: ${d.type.value} = ${d.type.value}(0);
            for (var b = 0u; b < ${b}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${d.setByIndices(`${d.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`}})):e.compute((a=e.inputs,s=t,z=(C=a[0].dims).length,A=C[z-2],O=s.k,R=s.n,B=C.slice(0,z-2),M=ta.size(B),D=a[1].dims[2]/4,P=a[0].dataType,U=tG(s.k),L=tG(D),N=tG(R),V=B.concat([A,R]),q=A>1&&R/N%2==0?2:1,F=ta.size(V)/N/q,G=[],W=[M,A,O/U],(H=ta.convertShape(a[1].dims).slice()).splice(-1,1,D/L),G.push(...tF(W)),G.push(...tF(H)),G.push(...tF(a[2].dims)),4===a.length&&G.push(...tF(ta.convertShape(a[3].dims))),j=[M,A,R/N],G.push(...tF(j)),{name:"MatMulNBits",shaderCache:{hint:`${s.blockSize};${s.bits};${U};${L};${N};${q};64`,inputDependencies:Array(a.length).fill("rank")},getRunData:()=>({outputs:[{dims:V,dataType:P}],dispatchGroup:{x:F},programUniforms:G}),getShaderSource:e=>{let t=W.length,r=tQ("a",a[0].dataType,t,U),i=tQ("b",12,H.length,L),n=tQ("scales",a[2].dataType,a[2].dims.length),o=[r,i,n],u=4===a.length?tQ("zero_points",12,a[3].dims.length):void 0;u&&o.push(u);let l=j.length,d=tX("output",a[0].dataType,l,N),p=tV(a[0].dataType),h=(()=>{switch(U){case 1:return`array<${p}, 8>`;case 2:return`mat4x2<${p}>`;case 4:return`mat2x4<${p}>`;default:throw Error(`${U}-component is not supported.`)}})(),c=Math.floor(32/s.bits),f=Math.floor(c/8);return`
        var<workgroup> workgroup_shared: array<${d.type.value}, ${64*q}>;
        ${e.declareVariables(...o,d)}
        ${e.mainStart([64,1,1])}
          let output_indices = ${d.offsetToIndices(`(global_idx / 64) * ${q}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += 64) {
            //process one block
            var word_offset: u32 = block * ${s.blockSize/U};
            ${(()=>{let e=`
            var col_index = col * ${N};
            ${u?`
            let zero_point_values_per_byte: u32 = ${Math.floor(8/s.bits)}u;
            let zero_point_bytes_per_col = (nBlocksPerCol + zero_point_values_per_byte - 1u) / zero_point_values_per_byte;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_sub_offset: u32 = block % zero_point_values_per_byte;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is ${Math.pow(2,s.bits-1)} for unsigned ${s.bits}-bit quantization.
            let zero_point = ${p}(${Math.pow(2,s.bits-1).toFixed(1)});`}
            `;for(let t=0;t<N*q;t++)e+=`
            let scale${t} = ${n.getByOffset("col_index * nBlocksPerCol + block")};
            ${u?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block / zero_point_values_per_byte);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_sub_offset * ${s.bits}u);
            zero_point_word = ${u.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${t} = ${p}((zero_point_word) & ${2===s.bits?"0x3u":"0xFu"});`:""}
            col_index += 1;`;return e})()}
            for (var word: u32 = 0; word < ${D}; word += ${L}) {
              ${(()=>{let e=`col_index = col * ${N};`;for(let t=0;t<N*q;t++)e+=`
            let b${t}_data = ${i.getByIndices(`${i.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return e+`
            var b_value: u32;
            let b_mask: u32 = ${2===s.bits?"0x03030303u":"0x0F0F0F0Fu"};
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${h};
            var b_dequantized_values: ${h};`})()}
              for (var i: u32 = 0; i < ${L}; i++) {
                ${(()=>{let e="";for(let t=0;t<f;t++){let i=t*s.bits*4,a=i+s.bits;e+=`
          // reuse a data (pass ${t})
            var input_offset${t>0?t:""} = ${0===t?r.indicesToOffset(`${r.type.indices}(batch, row, word_offset)`):"input_offset"};
            var a_data${t>0?t:""}: ${h};
            for (var j${t>0?t:""}: u32 = 0; j${t>0?t:""} < ${8/U}; j${t>0?t:""}++) {
              a_data${t>0?t:""}[j${t>0?t:""}] = ${r.getByOffset(`input_offset${t>0?t:""}`)};
              input_offset${t>0?t:""}++;
            }
          `;for(let r=0;r<N*q;r++)e+=`
            b_value = ${1===L?`b${r}_data`:`b${r}_data[i]`};
            ${2===s.bits?`{
              let half_word = b_value >> ${16*t}u;
              let byte_lo = half_word & 0xFFu;
              let byte_hi = (half_word >> 8u) & 0xFFu;
              let spread_word = (byte_lo & 0xFu) | ((byte_lo >> 4u) << 8u) | ((byte_hi & 0xFu) << 16u) | ((byte_hi >> 4u) << 24u);
              b_value_lower = unpack4xU8(spread_word & b_mask);
              b_value_upper = unpack4xU8((spread_word >> 2u) & b_mask);
            }`:`b_value_lower = unpack4xU8((b_value >> ${i}u) & b_mask);
            b_value_upper = unpack4xU8((b_value >> ${a}u) & b_mask);`}
            b_quantized_values = ${h}(${Array.from({length:4},(e,t)=>`${p}(b_value_lower[${t}]), ${p}(b_value_upper[${t}])`).join(", ")});
            b_dequantized_values = ${1===U?`${h}(${Array.from({length:8},(e,t)=>`(b_quantized_values[${t}] - ${u?`zero_point${r}`:"zero_point"}) * scale${r}`).join(", ")});`:`(b_quantized_values - ${h}(${Array(8).fill(`${u?`zero_point${r}`:"zero_point"}`).join(",")})) * scale${r};`};
            workgroup_shared[local_id.x * ${q} + ${Math.floor(r/N)}]${N>1?`[${r%N}]`:""} += ${Array.from({length:8/U},(e,r)=>`${1===U?`a_data${t>0?t:""}[${r}] * b_dequantized_values[${r}]`:`dot(a_data${t>0?t:""}[${r}], b_dequantized_values[${r}])`}`).join(" + ")};
          `}return e})()}
                word_offset += ${c/U};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${q}) {
            var output_value: ${d.type.value} = ${d.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < 64u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${q};
            }
            ${d.setByIndices(`${d.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`}}))},sL=e=>tP(e)}),sq=u(()=>{e3(),tl(),t2(),sV=(e,t)=>{let r,i,a,s;var n,o,u=e.inputs;if(!u||u.length<1)throw Error("Too few inputs");if(1!==u[0].dataType&&10!==u[0].dataType)throw Error("Input type must be float or float16.");if(u.length>=2){let e=2*u[0].dims.length===u[1].dims[0];if(4===u.length&&(e=2*u[3].dims[0]===u[1].dims[0]),!e)throw Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}let l=((e,t)=>{if(!(e.length>1))return t;{let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?10===e[2].dataType?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,s=new Int32Array(2*a).fill(0);if(e.length>=4){let t=e[3].getBigInt64Array();for(let e=0;e<t.length;e++)s[Number(t[e])]=Number(r[e]),s[Number(t[e])+a]=Number(r[e+t.length])}else r.forEach((e,t)=>s[Number(t)]=Number(e));let n=[];return s.forEach(e=>n.push(e)),{mode:t.mode,value:i,pads:n}}})(e.inputs,t);e.compute((n=e.inputs,o=l,r=ta.padShape(n[0].dims.slice(),o.pads),i=n[0].dims,a=[{type:12,data:ta.size(r)},{type:6,data:o.pads}],s=n.length>=3&&n[2].data,0===o.mode&&a.push({type:s?n[2].dataType:1,data:o.value}),a.push(...tF(n[0].dims,r)),{name:"Pad",shaderCache:{hint:`${o.mode}${s}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:r,dataType:n[0].dataType}],dispatchGroup:{x:Math.ceil(ta.size(r)/64)},programUniforms:a}),getShaderSource:e=>{let t=tX("output",n[0].dataType,r.length),a=tQ("x",n[0].dataType,i.length),u=a.type.value,l=((e,t,r)=>{switch(r.mode){case 0:var i=e,a=t,s=r.pads.length;let n="";for(let e=a-1;e>=0;--e)n+=`
            k = i32(${i.indicesGet("indices",e)}) - ${tK("uniforms.pads",e,s)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${tK("uniforms.x_shape",e,a)})) {
              break;
            }
            offset += k * i32(${tK("uniforms.x_strides",e,a)});
        `;return`
          value = ${i.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${n}
            value = x[offset];
          }
      `;case 1:var o=e,u=t,l=r.pads.length;let d="";for(let e=u-1;e>=0;--e)d+=`
                k = i32(${o.indicesGet("indices",e)}) - ${tK("uniforms.pads",e,l)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${tK("uniforms.x_shape",e,u)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${tK("uniforms.x_shape",e,u)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${tK("uniforms.x_strides",e,u)});
            `;return`
              var offset = 0;
              var k = 0;
              ${d}
              value = x[offset];
          `;case 2:var p=e,h=t,c=r.pads.length;let f="";for(let e=h-1;e>=0;--e)f+=`
                k = i32(${p.indicesGet("indices",e)}) - ${tK("uniforms.pads",e,c)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${tK("uniforms.x_shape",e,h)})) {
                  k = i32(${tK("uniforms.x_shape",e,h)}) - 1;
                }
                offset += k * i32(${tK("uniforms.x_strides",e,h)});
            `;return`
              var offset = 0;
              var k = 0;
              ${f}
              value = x[offset];
          `;case 3:var m=e,g=t,y=r.pads.length;let _="";for(let e=g-1;e>=0;--e)_+=`
                k = i32(${m.indicesGet("indices",e)}) - ${tK("uniforms.pads",e,y)};
                if (k < 0)  {
                  k += i32(${tK("uniforms.x_shape",e,g)}]);
                }
                if (k >= i32(${tK("uniforms.x_shape",e,g)})) {
                  k -= i32(${tK("uniforms.x_shape",e,g)});
                }
                offset += k * i32(${tK("uniforms.x_strides",e,g)});
            `;return`
              var offset = 0;
              var k = 0;
              ${_}
              value = x[offset];
          `;default:throw Error("Invalid mode")}})(t,i.length,o),d=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:o.pads.length}];return 0===o.mode&&d.push({name:"constant_value",type:s?u:"f32"}),`
            ${e.registerUniforms(d).declareVariables(a,t)}
            ${e.mainStart()}
            ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${t.offsetToIndices("global_idx")};

            var value = ${u}(0);
            ${l}
            output[global_idx] = value;
        }`}}),{inputs:[0]})}}),s8=u(()=>{em(),e3(),tl(),t2(),sF=e=>{if(T.webgpu.validateInputContent&&(!e||1!==e.length))throw Error("Pool ops requires 1 input.")},sG=(e,t,r)=>{let i="NHWC"===t.format,a=e.dims.slice();i&&a.splice(1,0,a.pop());let s=Object.hasOwnProperty.call(t,"dilations"),n=t.kernelShape.slice(),o=t.strides.slice(),u=s?t.dilations.slice():[],l=t.pads.slice();ts.adjustPoolAttributes(r,a,n,o,u,l);let d=ts.computePoolOutputShape(r,a,o,u,n,l,t.autoPad,t.ceilMode),p=Object.assign({},t);s?Object.assign(p,{kernelShape:n,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:n,strides:o,pads:l,cacheKey:t.cacheKey});let h=d.slice();return h.push(h.splice(1,1)[0]),[p,i?h:d]},sW=(e,t)=>{let r="NHWC"===t.format,i=[{type:12,data:ta.size(e)},{type:12,data:ta.size(t.kernelShape)}],a=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let e=t.kernelShape[t.kernelShape.length-1],r=t.strides[t.strides.length-1],s=t.pads[t.pads.length/2-1],n=t.pads[t.pads.length-1],o=!!(s+n);i.push({type:12,data:e},{type:12,data:r},{type:12,data:s},{type:12,data:n}),a.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let u=!1;if(2===t.kernelShape.length){let e=t.kernelShape[t.kernelShape.length-2],r=t.strides[t.strides.length-2],s=t.pads[t.pads.length/2-2],n=t.pads[t.pads.length-2];u=!!(s+n),i.push({type:12,data:e},{type:12,data:r},{type:12,data:s},{type:12,data:n}),a.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[i,a,!0,o,u]}{if(r)throw Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let e=ta.computeStrides(t.kernelShape);return i.push({type:12,data:e},{type:12,data:t.pads},{type:12,data:t.strides}),a.push({name:"kernelStrides",type:"u32",length:e.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length}),[i,a,!!t.pads.reduce((e,t)=>e+t),!1,!1]}},sH=(e,t,r,i,a,s,n,o,u,l,d,p)=>{let h="NHWC"===a.format,c=t.type.value,f=tX("output",t.type.tensor,i);if(a.kernelShape.length<=2){let i="",l="",m="",g=r-(h?2:1);if(i=d?`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${g}] < 0 || xIndices[${g}]
                      >= uniforms.x_shape[${g}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${s}
                }`:`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${s}
                }`,2===a.kernelShape.length){let e=r-(h?3:2);l=p?`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${e}] = indices[${e}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${e}] < 0 || xIndices[${e}] >= uniforms.x_shape[${e}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${e}] = indices[${e}] * uniforms.sh - uniforms.phStart + j;
                `,m=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,f)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${f.offsetToIndices("global_idx")};
              var xIndices = ${f.offsetToIndices("global_idx")};

              var value = ${c}(${o});
              var pad = 0;
              ${l}
              ${i}
              ${m}
              ${n}

              output[global_idx] = value;
            }`}{if(h)throw Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let i=a.kernelShape.length,d=a.pads.length,p="";return p=l?`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${s}
              }`:`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${s}
            `,`
            ${e.registerUniforms(u).declareVariables(t,f)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${f.offsetToIndices("global_idx")};
              var xIndices = ${f.offsetToIndices("global_idx")};

              var offsets: array<u32, ${i}>;

              var value = ${c}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${i-1}u; j++) {
                  offsets[j] = offset / ${tK("uniforms.kernelStrides","j",i)};
                  offset -= offsets[j] * ${tK("uniforms.kernelStrides","j",i)};
                }
                offsets[${i-1}] = offset;

                isPad = false;
                for (var j = ${r-i}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${tK("uniforms.strides",`j - ${r-i}u`,i)}
                    + offsets[j - ${r-i}u] - ${tK("uniforms.pads","j - 2u",d)};
                  ${p}
              }
              ${n}

              output[global_idx] = value;
            }`}},sj=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,sK=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),sZ=(e,t,r,i)=>{let[a,s]=sG(t,i,r),n=tQ("x",t.dataType,t.dims.length),o=n.type.value,u="";a.countIncludePad?u+=`value /= ${o}(uniforms.kernelSize);`:u+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[l,d,p,h,c]=sW(s,a);return l.push(...tF(t.dims,s)),{name:e,shaderCache:{hint:`${i.cacheKey};${p};${h};${c}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:s,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(ta.size(s)/64)},programUniforms:l}),getShaderSource:e=>sH(e,n,t.dims.length,s.length,a,"value += x_val;",u,0,d,p,h,c)}},sQ=e=>{let t,r=0!==e.count_include_pad,i=sK(e);if(0!==i.ceilMode)throw Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding/divisor) is not yet implemented in the WebGPU AveragePool kernel");let a={countIncludePad:r,...i,cacheKey:""};return{...a,cacheKey:(t=a,`${sj(t)};${t.countIncludePad}`)}},sX=(e,t)=>{sF(e.inputs),e.compute(sZ("AveragePool",e.inputs[0],!1,t))},sY={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},sJ=e=>{let t=e.format;return{format:t,...sY,cacheKey:t}},s0=(e,t)=>{sF(e.inputs),e.compute(sZ("GlobalAveragePool",e.inputs[0],!0,t))},s1=(e,t,r,i)=>{let[a,s]=sG(t,i,r),n=`
      value = max(x_val, value);
    `,o=tQ("x",t.dataType,t.dims.length),[u,l,d,p,h]=sW(s,a);return u.push(...tF(t.dims,s)),{name:e,shaderCache:{hint:`${i.cacheKey};${d};${p};${h}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:s,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(ta.size(s)/64)},programUniforms:u}),getShaderSource:e=>sH(e,o,t.dims.length,s.length,a,n,"",10===t.dataType?-65504:-1e5,l,d,p,h)}},s2=(e,t)=>{sF(e.inputs),e.compute(s1("MaxPool",e.inputs[0],!1,t))},s3=e=>{let t,r=e.storage_order,i=e.dilations,a=sK(e);if(0!==r)throw Error("column major storage order is not yet supported for MaxPool");if(0!==a.ceilMode)throw Error("ceil_mode output-shape is computed, but ceil_mode kernel execution (padding) is not yet implemented in the WebGPU MaxPool kernel");let s={storageOrder:r,dilations:i,...a,cacheKey:""};return{...s,cacheKey:(t=s,`${sj(t)};${t.storageOrder};${t.dilations}`)}},s4=e=>{let t=e.format;return{format:t,...sY,cacheKey:t}},s6=(e,t)=>{sF(e.inputs),e.compute(s1("GlobalMaxPool",e.inputs[0],!0,t))}}),s9=u(()=>{e3(),tl(),tU(),t2(),s5=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h,c,f,m,g,y,_,b,$,w,v,x,S,T,E;((e,t)=>{if(e.length<2||e.length>3)throw Error("DequantizeLinear requires 2 or 3 inputs.");if(3===e.length&&e[1].dims===e[2].dims)throw Error("x-scale and x-zero-point must have the same shape.");if(3===e.length&&e[0].dataType!==e[2].dataType)throw Error("x and x-zero-point must have the same data type.");if(0!==e[1].dims.length&&1!==e[1].dims.length&&e[1].dims.length!==e[0].dims.length)throw Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((t,r)=>t===e[2].dims[r]).reduce((e,t)=>e&&t,!0))throw Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(0===e[1].dims.length||1===e[1].dims.length&&1===e[1].dims[0])throw Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((r,i)=>i===t.axis||r===e[0].dims[i]).reduce((e,t)=>e&&t,!0))throw Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}})(e.inputs,t),e.compute((r=e.inputs,i=t,a=ta.normalizeAxis(i.axis,r[0].dims.length),n=3===(s=r[0].dataType),o=r[0].dims,u=r[1].dataType,l=ta.size(o),p=(d=3===s||2===s)?[Math.ceil(ta.size(r[0].dims)/4)]:r[0].dims,h=r[1].dims,f=(c=r.length>2?r[2]:void 0)?d?[Math.ceil(ta.size(c.dims)/4)]:c.dims:void 0,g=!1==(m=0===h.length||1===h.length&&1===h[0])&&1===h.length,y=tG(l),b=(_=m&&(!d||4===y))?y:1,$=tQ("input",d?12:s,p.length,_&&!d?y:1),w=tQ("scale",u,h.length),v=c?tQ("zero_point",d?12:s,f.length):void 0,x=tX("output",u,o.length,b),S=[$,w],v&&S.push(v),T=[p,h],c&&T.push(f),E=[{type:12,data:l/b},{type:12,data:a},{type:12,data:i.blockSize},...tF(...T,o)],{name:"DequantizeLinear",shaderCache:{hint:i.cacheKey,inputDependencies:v?["rank","rank","rank"]:["rank","rank"]},getShaderSource:e=>`
      ${e.registerUniforms([{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}]).declareVariables(...S,x)}
      ${e.mainStart()}
          ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${x.offsetToIndices("global_idx")};

          // Set input x
          ${d?`
            let input = ${$.getByOffset("global_idx / 4")};
            let x_vec = ${n?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${1===b?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${$.getByOffset("global_idx")};`};

          // Set scale input
          ${m?`let scale_value= ${w.getByOffset("0")}`:g?`
            let scale_index = ${x.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${w.getByOffset("scale_index")};`:`
            var scale_indices: ${w.type.indices} = output_indices;
            let index = ${w.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${w.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${w.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${v?m?d?`
                let zero_point_input = ${v.getByOffset("0")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${v.getByOffset("0")}`:g?d?`
                let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${v.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${v.getByOffset("zero_point_index")};`:d?`
                let zero_point_offset = ${w.indicesToOffset("scale_indices")};
                let zero_point_input = ${v.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${v.getByIndices("scale_indices")};`:`let zero_point_value = ${d?n?"i32":"u32":$.type.value}(0);`};
      // Compute and write output
      ${x.setByOffset("global_idx",`${x.type.value}(x_value - zero_point_value) * scale_value`)};
      }`,getRunData:()=>({outputs:[{dims:o,dataType:u}],dispatchGroup:{x:Math.ceil(l/b/64),y:1,z:1},programUniforms:E})}))},s7=e=>tP({axis:e.axis,blockSize:e.blockSize})}),nt=u(()=>{em(),e3(),t2(),ne=e=>{var t,r,i,a;let s,n,o,u=0,l=0,d=0;6===e.inputs[0].dataType?(u=e.inputs[0].getInt32Array()[0],l=e.inputs[1].getInt32Array()[0],d=e.inputs[2].getInt32Array()[0]):1===e.inputs[0].dataType&&(u=e.inputs[0].getFloat32Array()[0],l=e.inputs[1].getFloat32Array()[0],d=e.inputs[2].getFloat32Array()[0]),T.webgpu.validateInputContent&&((e,t,r)=>{if(e===t||e<t&&r<0||e>t&&r>0)throw Error("Range these inputs' contents are invalid.")})(u,l,d),e.compute((t=u,r=l,i=d,a=e.inputs[0].dataType,n=[s=Math.abs(Math.ceil((r-t)/i))],o=[{type:12,data:s},{type:a,data:t},{type:a,data:i},...tF(n)],{name:"Range",shaderCache:{hint:`${a}`},getShaderSource:e=>{let t=tX("output",a,n.length),r=t.type.value;return`
        ${e.registerUniforms([{name:"outputSize",type:"u32"},{name:"start",type:r},{name:"delta",type:r}]).declareVariables(t)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${r}(global_idx) * uniforms.delta;
      }`},getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}),{inputs:[]})}}),na=u(()=>{e3(),tl(),tU(),t2(),nr=e=>tP({reduction:e.reduction}),ni=(e,t)=>{var r,i;let a,s,n,o,u,l;e.compute((r=e.inputs,i=t,a=r[0].dims,s=r[1].dims,n=Math.ceil(ta.sizeToDimension(s,s.length-1)/1),o=s[s.length-1],u=ta.sizeFromDimension(a,o),l=[{type:12,data:n},{type:12,data:o},{type:12,data:u},...tF(r[1].dims,r[2].dims,a)],{name:"ScatterND",shaderCache:{hint:`${i.cacheKey}_${i.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:r[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:l}),getShaderSource:e=>{let t=tQ("indices",r[1].dataType,r[1].dims.length),s=tQ("updates",r[2].dataType,r[2].dims.length,1),n="none"!==i.reduction&&""!==i.reduction?tY("output",r[0].dataType,a.length):tX("output",r[0].dataType,a.length,1);return`
      ${e.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(t,s,n)}
      ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${1===r[0].dims.length?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${((e,t,r,i)=>{if("none"!==e&&"i32"!==i&&"u32"!==i&&"f32"!==i)throw Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,s=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return"i32"===i||"u32"===i?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${s}`;case"max":return"i32"===i||"u32"===i?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${s}`;case"min":return"i32"===i||"u32"===i?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${s}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${s}`;default:throw Error(`Reduction ${e} is not supported.`)}})(i.reduction,"output[data_offset + i]","value",n.type.value)}
  }

      }`}}),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),nl=u(()=>{e3(),tl(),tU(),t2(),ns=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,nn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",no=(e,t)=>{var r,i,a,s,n,o,u,l,d,p,h,c;let f,m,g,y,_,b,$,w,v,x,S,T,E,k,I,C,z=[],A=[],O=[],R=new Uint32Array((f=e.customDataBuffer).buffer,f.byteOffset,1)[0];if(0!==t.antialias)throw Error("Only default value (0) for Antialias attribute is supported");((e,t,r,i,a,s)=>{let[n,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(n>0&&e.length>n&&e[n].dims.length>0)e[n].getFloat32Array().forEach(e=>s.push(e));else if("tf_crop_and_resize"===t.coordinateTransformMode)throw Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&1===e[o].dims.length&&e[o].dims[0]>0){var d,p,h;let a;if(e[o].getFloat32Array().forEach(e=>i.push(e)),0!==i.length&&i.length!==l&&r>=18&&i.length!==t.axes.length)throw Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");((e,t)=>{if(e.every(e=>e>0||(()=>{throw Error("Resize requires scales input values to be positive")})),e.length>0){if("linear"===t.mode){if(2!==e.length&&3!==e.length&&(4!==e.length||1!==e[0]||1!==e[1])&&(4!==e.length||1!==e[0]||1!==e[3])&&(5!==e.length||1!==e[0]||1!==e[1]))throw Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if("cubic"===t.mode&&2!==e.length&&(4!==e.length||1!==e[0]||1!==e[1])&&(4!==e.length||1!==e[0]||1!==e[3]))throw Error("Resize requires scales input size to be 2 or 4 for cubic mode")}})(i,t),t.axes.length>0&&(d=i,p=t.axes,h=l,p.every(e=>e>=0&&e<h||(()=>{throw Error("Resize requires axes input values to be positive and less than rank")})),a=Array(h).fill(1),p.forEach((e,t)=>a[e]=d[t]),a).forEach((e,t)=>i[t]=e)}if(u>0&&e.length>u&&1===e[u].dims.length&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(e=>a.push(Number(e))),0!==a.length&&a.length!==l&&r>=18&&a.length!==t.axes.length))throw Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(0!==i.length&&i.length!==t.axes.length)throw Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(0!==a.length&&a.length!==t.axes.length)throw Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if("u">typeof i&&"u">typeof a&&i.length>0&&a.length>l)throw Error("Resize requires only of scales or sizes to be specified")})(e.inputs,t,R,z,A,O),e.compute((r=e.inputs[0],i=t,a=R,s=z,n=A,o=O,y=r.dims,_=(u=o,l=i.axes,m=Array(d=y.length).fill(0).concat(Array(d).fill(1)),g=0===u.length?m:u.slice(),l.length>0?(l.forEach((e,t)=>{m[e]=g[t],m[t+d]=g[l.length+t]}),m):g),b=((e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(e=>a.push(e)),Math.max(...i)>e.length)throw Error("axes is out of bound");i.forEach((e,t)=>a[e]=r[t])}else r.forEach(e=>a.push(e));else{if(0===t.length)throw Error("Resize requires either scales or sizes.");a=e.map((e,r)=>Math.round(e*t[r]))}return a})(y,s,n,i.axes),$=s.slice(),0===s.length&&($=y.map((e,t)=>0===e?1:b[t]/e),"stretch"!==i.keepAspectRatioPolicy&&(p=y,h=$,c=i,w=(()=>{switch(c.keepAspectRatioPolicy){case"not_larger":return c.axes.length>0?Math.min(...c.axes.map(e=>h[e]),Number.MAX_VALUE):Math.min(...h,Number.MAX_VALUE);case"not_smaller":return c.axes.length>0?Math.max(...c.axes.map(e=>h[e]),5e-324):Math.max(...h,5e-324);default:throw Error(`Keep aspect ratio policy ${c.keepAspectRatioPolicy} is not supported`)}})(),h.fill(1,0,h.length),v=p.slice(),c.axes.length>0?(c.axes.forEach(e=>h[e]=w),c.axes.forEach(e=>v[e]=Math.round(p[e]*h[e]))):(h.fill(w,0,h.length),v.forEach((e,t)=>v[t]=Math.round(e*h[t]))),b=v)),x=tX("output",r.dataType,b.length),S=tQ("input",r.dataType,y.length),T=ta.size(b),E=y.length===b.length&&y.every((e,t)=>e===b[t]),k="tf_crop_and_resize"===i.coordinateTransformMode,I=i.extrapolationValue,C=S.type.value,{name:"Resize",shaderCache:{hint:`${i.cacheKey}|${a}|${$.length>0?"cubic"===i.mode?$:$.length:""}|${n.length>0?n:""}|${_.length>0?_:""}|${E}|${"nearest"===i.mode?y.length:y}`,inputDependencies:["rank"]},getShaderSource:e=>{let t,r;return`
      ${E?"":`
      ${t=i.coordinateTransformMode,r=C,`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${r} { `+(()=>{switch(t){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${r}(xResized) / ${r}(xScale);
          } else {
            ${ns("xResized","lengthOriginal","lengthResized",r)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${r}(xResized) + 0.5) / ${r}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${r}(xResized) + 0.5) / ${r}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${ns("xResized","lengthOriginal - 1","lengthResized - 1",r)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${r}(roiStart) * ${r}(lengthOriginal - 1) +
                        (${r}(xResized) * ${r}(roiEnd - roiStart) * ${r}(lengthOriginal - 1)) /
                        ${r}(lengthResized - 1);
                  } else {
                    return 0.5 * ${r}(roiStart + roiEnd) * ${r}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${r}xScale * ${r}(lengthResized);
                  const adjustment = ${r}(lengthResized) / outputWidth;
                  const center = ${r}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${r}(xResized) + 0.5) / ${r}(xScale)) - 0.5;`;case"half_pixel":return`return ((${r}(xResized) + 0.5) / ${r}(xScale)) - 0.5;`;default:throw Error(`Coordinate transform mode ${t} is not supported`)}})()+"}"};
      ${(()=>{switch(i.mode){case"nearest":let e,t,r,s,n,o,u,l,d,p,h,c;return`
              ${e=S,t=y,`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${tK("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`};
              ${r=i.nearestMode,s=a,n=C,`fn getNearestPixelFromOriginal(xOriginal: ${n}, isDownSample: bool) -> ${n} {`+(()=>{switch(r){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(s<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw Error(`Nearest mode ${r} is not supported`)}})()+"}"};
              ${o=S,u=x,l=y,d=b,p=$.length,h=_.length,c=k,`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${u.type.indices}) -> ${o.type.indices} {
      var input_indices: ${o.type.indices};
      for (var i:u32 = 0; i < ${d.length}; i++) {
        var output_index = ${u.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${tK("uniforms.scales","i",p)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${tK("uniforms.roi","i",h)};
          var roi_hi = ${tK("uniforms.roi",`i + ${l.length}`,h)};
          var input_shape_i = ${tK("uniforms.input_shape","i",l.length)};
          var output_shape_i = ${tK("uniforms.output_shape","i",d.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${c} || (original_idx >= 0 && original_idx < ${u.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${u.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${o.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`};
              `;case"linear":let f,m,g,w,v;return`
              ${f=x,m=y,g=b,w=$.length,v=_.length,`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${f.type.indices}) -> array<${f.type.value}, ${g.length}> {
      var original_indices: array<${f.type.value}, ${g.length}>;
      for (var i:u32 = 0; i < ${g.length}; i++) {
        var output_index = ${f.indicesGet("output_indices","i")};
        var scale = ${tK("uniforms.scales","i",w)};
        var roi_low = ${tK("uniforms.roi","i",v)};
        var roi_hi = ${tK("uniforms.roi",`i + ${m.length}`,v)};
        if (scale == 1.0) {
          original_indices[i] = ${f.type.value}(output_index);
        } else {
          var input_shape_i = ${tK("uniforms.input_shape","i",m.length)};
          var output_shape_i = ${tK("uniforms.output_shape","i",g.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`};
              ${(()=>{if(2===y.length||4===y.length)return`${((e,t,r,i,a)=>{let[s,n,o,u]=2===r.length?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",n,`max(0, min(row, ${r[n]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${nn(e,u,s,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${l} = originalIndices[${n}];
      var col:${l} = originalIndices[${o}];
      ${i?`if (row < 0 || row > (${r[n]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[n]} - 1));
      col = max(0, min(col, ${r[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${u}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${s}])`:"0"};
      var x11: ${l} = getInputValue(batch, channel, row1, col1);
      var x12: ${l} = getInputValue(batch, channel, row1, col2);
      var x21: ${l} = getInputValue(batch, channel, row2, col1);
      var x22: ${l} = getInputValue(batch, channel, row2, col2);
      var dx1: ${l} = abs(row - ${l}(row1));
      var dx2: ${l} = abs(${l}(row2) - row);
      var dy1: ${l} = abs(col - ${l}(col1));
      var dy2: ${l} = abs(${l}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`})(S,x,y,k,I)}`;if(3===y.length||5===y.length)return`${((e,t,r,i,a)=>{let[s,n,o,u,l]=3===r.length?[-1,0,1,2,-1]:[0,2,3,4,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",n,`max(0, min(depth, ${r[n]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${nn(e,l,s,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${d} = originalIndices[${n}];
      var height:${d} = originalIndices[${o}];
      var width:${d} = originalIndices[${u}];
      ${i?`if (depth < 0 || depth > (${r[n]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[u]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[n]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[u]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${s}])`:"0"};

      var x111: ${d} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${d} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${d} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${d} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${d} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${d} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${d} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${d} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${d} = abs(depth - ${d}(depth1));
      var dx2: ${d} = abs(${d}(depth2) - depth);
      var dy1: ${d} = abs(height - ${d}(height1));
      var dy2: ${d} = abs(${d}(height2) - height);
      var dz1: ${d} = abs(width - ${d}(width1));
      var dz2: ${d} = abs(${d}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`})(S,x,y,k,I)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(2===y.length||4===y.length)return`${((e,t,r,i,a,s,n,o,u,l)=>{let[d,p]=2===r.length?[0,1]:[2,3],h=e.type.value,c=n=>{let p=n===d?"row":"col";return`
      fn ${p}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${h} {
        var output_index = ${t.indicesGet("output_indices",n)};
        var originalIdx: ${h} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[n]},
        ${i[n]}, ${r[n]}, ${s[n]}, ${s[n]} + ${r.length});
        var fractOriginalIdx: ${h} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[n]} - 1))) {
          return ${u};
        }
        var data: array<${h}, 4> = array<${h}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${p}: ${h} = originalIdx + ${h}(i);
          if (${p} < 0 || ${p} >= ${r[n]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${p} = max(0, min(${p}, ${r[n]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",n,`u32(${p})`)};
          data[i + 1] = ${n===d?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${c(d)};
    ${c(p)};
  fn getCubicInterpolationCoefs(s: ${h}) -> array<${h}, 4> {
    var absS = abs(s);
    var coeffs: array<${h}, 4> = array<${h}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${h} = 1.0 - absS;
    var twoMinusAbsS: ${h} = 2.0 - absS;
    var onePlusAbsS: ${h} = 1.0 + absS;
    coeffs[0] = ((${n} * onePlusAbsS - 5 * ${n}) * onePlusAbsS + 8 * ${n}) * onePlusAbsS - 4 * ${n};
    coeffs[1] = ((${n} + 2) * absS - (${n} + 3)) * absS * absS + 1;
    coeffs[2] = ((${n} + 2) * oneMinusAbsS - (${n} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${n} * twoMinusAbsS - 5 * ${n}) * twoMinusAbsS + 8 * ${n}) * twoMinusAbsS - 4 * ${n};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${h}, 4>, coefs: array<${h}, 4>) -> ${h} {
    var coefsSum: ${h} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${h} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `})(S,x,y,b,$,_,i.cubicCoeffA,k,i.extrapolationValue,i.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${e.registerUniform("output_size","u32").registerUniform("scales","f32",$.length).registerUniform("roi","f32",_.length).declareVariables(S,x)}
      ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${E?"output[global_idx] = input[global_idx];":`
        let output_indices = ${x.offsetToIndices("global_idx")};
        var input_indices: ${S.type.indices};
        ${(()=>{switch(i.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${S.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${i.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${2===y.length||4===y.length?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${i.mode}`)}})()};
`}
      }`},getRunData:()=>({outputs:[{dims:b,dataType:r.dataType}],dispatchGroup:{x:Math.ceil(T/64)},programUniforms:[{type:12,data:T},{type:1,data:$},{type:1,data:_},...tF(y,b)]})}),{inputs:[0]})},nu=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,s=0!==e.excludeOutside,n=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=""===e.nearestMode?"simple":e.nearestMode;return tP({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:s,extrapolationValue:n,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),np=u(()=>{e3(),tl(),t2(),nd=(e,t)=>{var r,i,a,s;let n,o,u,l,d,p,h,c,f,m,g,y,_;(e=>{if(!e||e.length<3)throw Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw Error("All inputs must have the same data type");if(3!==t.dims.length&&2!==t.dims.length)throw Error("Input must be 2D or 3D");if(3!==r.dims.length&&2!==r.dims.length)throw Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],s=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==s)throw Error("Skip must have the same sequence length as input");if(1!==i.dims.length)throw Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw Error("Gamma must have the same hidden size as input");if(e.length>3){let t=e[3];if(1!==t.dims.length)throw Error("Beta must be 1D");if(t.dims[t.dims.length-1]!==a)throw Error("Beta must have the same hidden size as input")}if(e.length>4){let t=e[4];if(1!==t.dims.length)throw Error("Bias must be 1D");if(t.dims[t.dims.length-1]!==a)throw Error("Bias must have the same hidden size as input")}})(e.inputs);let b=[0];e.outputCount>1&&b.push(-3),e.outputCount>2&&b.push(-3),e.outputCount>3&&b.push(3),e.compute((r=e.inputs,i=t,a=e.outputCount,s=!1,n=i.simplified,o=r[0].dims,u=ta.size(o),l=o.slice(-1)[0],d=s?o.slice(0,-1).concat(1):[],p=!n&&r.length>3,h=r.length>4,c=s&&a>1,f=s&&a>2,m=a>3,y=[{type:12,data:u},{type:12,data:g=tG(l)},{type:12,data:l},{type:1,data:i.epsilon}],_=[{dims:o,dataType:r[0].dataType}],a>1&&_.push({dims:d,dataType:1}),a>2&&_.push({dims:d,dataType:1}),a>3&&_.push({dims:o,dataType:r[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${g};${c};${f};${m}`,inputDependencies:r.map((e,t)=>"type")},getShaderSource:e=>{let t=[tQ("x",r[0].dataType,r[0].dims,g),tQ("skip",r[1].dataType,r[1].dims,g),tQ("gamma",r[2].dataType,r[2].dims,g)];p&&t.push(tQ("beta",r[3].dataType,r[3].dims,g)),h&&t.push(tQ("bias",r[4].dataType,r[4].dims,g)),t.push(tX("output",r[0].dataType,o,g)),c&&t.push(tX("mean_output",1,d)),f&&t.push(tX("inv_std_output",1,d)),m&&t.push(tX("input_skip_bias_sum",r[0].dataType,o,g));let i=tV(r[0].dataType),a=tV(1,g);return`

      ${e.registerUniforms([{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}]).declareVariables(...t)}
      var<workgroup> sum_shared : array<${a}, 64>;
      var<workgroup> sum_squared_shared : array<${a}, 64>;

      ${e.mainStart([64,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / 64;

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / 64;
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == 63) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${h?"bias[offset1d + i]":i+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${m?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${tH(i,g,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = 64;
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${tj("sum",g)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${tj("square_sum",g)} / f32(uniforms.hidden_size) ${n?"":"- mean * mean"} + uniforms.epsilon);
        ${c?"mean_output[global_idx] = mean;":""}
        ${f?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${n?"":`- ${i}(mean)`}) *
            ${i}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},getRunData:()=>({outputs:_,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:y})}),{outputs:b})}}),ng=u(()=>{e3(),tl(),tU(),t2(),nh=(e,t)=>{let r=[];if(e.length>t)if(7===e[t].dataType)e[t].getBigInt64Array().forEach(e=>r.push(Number(e)));else if(6===e[t].dataType)e[t].getInt32Array().forEach(e=>r.push(Number(e)));else throw Error(`Input ${t} must be an array of int32 or int64`);return r},nc=(e,t,r,i,a)=>{let s=e;return e<0&&(s+=r[i[t]]),a[t]<0?Math.max(0,Math.min(s,r[i[t]]-1)):Math.max(0,Math.min(s,r[i[t]]))},nf=(e,t)=>{var r=e.inputs,i=t;if(!r||r.length<1)throw Error("too few inputs");if(0!==i.axes.length){if(i.axes.length!==i.starts.length||i.axes.length!==i.ends.length)throw Error("axes, starts and ends must have the same length")}else if(i.starts.length!==i.ends.length)throw Error("starts and ends must have the same length");r.slice(1).forEach((e,t)=>{if(6!==r[t+1].dataType&&7!==r[t+1].dataType)throw Error(`Input ${t} must be an array of int32 or int64`)});let a=((e,t)=>{if(!(e.length>1))return t;{let t=nh(e,1),r=nh(e,2),i=nh(e,3);return 0===i.length&&(i=[...Array(e[0].dims.length).keys()]),tP({starts:t,ends:r,axes:i})}})(e.inputs,t);e.compute(((e,t)=>{let r=e[0].dims,i=ta.size(r),a=t.axes.length>0?ta.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],s=nh(e,4);s.forEach(e=>0!==e||(()=>{throw Error("step cannot be 0")})),0===s.length&&(s=Array(a.length).fill(1));let n=t.starts.map((e,t)=>nc(e,t,r,a,s)),o=t.ends.map((e,t)=>nc(e,t,r,a,s));if(a.length!==n.length||a.length!==o.length)throw Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let e=0;e<r.length;++e)a.includes(e)||(n.splice(e,0,0),o.splice(e,0,r[e]),s.splice(e,0,1));let u=s.map(e=>Math.sign(e));s.forEach((e,t,r)=>{if(e<0){let i=(o[t]-n[t])/e,a=n[t],u=a+i*s[t];n[t]=u,o[t]=a,r[t]=-e}});let l=r.slice(0);a.forEach((e,t)=>{l[e]=Math.ceil((o[e]-n[e])/s[e])});let d={dims:l,dataType:e[0].dataType},p=tX("output",e[0].dataType,l.length),h=tQ("input",e[0].dataType,e[0].dims.length),c=ta.size(l),f=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:n.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:s.length}],m=[{type:12,data:c},{type:12,data:n},{type:6,data:u},{type:12,data:s},...tF(e[0].dims,l)];return{name:"Slice",shaderCache:{hint:`${u.length}_${n.length}_${s.length}`,inputDependencies:["rank"]},getShaderSource:e=>{let t,i,a;return`
      ${e.registerUniforms(f).declareVariables(h,p)}
        ${t=h,i=p,a=r,`fn calculateInputIndices(output_indices: ${i.type.indices}) -> ${t.type.indices} {
          var input_indices: ${t.type.indices};
          var carry = 0u;
          for (var i = ${a.length-1}; i >= 0; i--) {
            let input_shape_i = ${tK("uniforms.input_shape","i",a.length)};
            let steps_i = ${tK("uniforms.steps","i",a.length)};
            let signs_i = ${tK("uniforms.signs","i",a.length)};
            let starts_i = ${tK("uniforms.starts","i",a.length)};
            var output_index = ${i.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${t.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`}
        ${e.mainStart()}
          ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`},getRunData:()=>({outputs:[d],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:m})}})(e.inputs,a),{inputs:[0]})},nm=e=>{let t=e.starts,r=e.ends,i=e.axes;return tP({starts:t,ends:r,axes:i})}}),nb=u(()=>{e3(),tl(),tU(),t5(),t2(),ny=(e,t)=>{var r,i;let a,s,n,o,u,l,d,p,h,c,f,m,g,y,_,b,$,w,v;(e=>{if(!e||1!==e.length)throw Error("Softmax op requires 1 input.")})(e.inputs),r=e,i=t,s=(a=r.inputs[0]).dims,n=ta.size(s),o=s.length,l=(u=ta.normalizeAxis(i.axis,o))<s.length-1,p=[],l?((p=Array.from({length:o},(e,t)=>t))[u]=o-1,p[o-1]=u,d=r.compute(t4(a,p),{inputs:[a],outputs:[-1]})[0]):d=a,f=n/(c=(h=d.dims)[o-1]),m=tG(c),g=c/m,y=64,1===f&&(y=256),_=tQ("x",d.dataType,d.dims,m),b=tX("result",d.dataType,d.dims,m),$=_.type.value,w="f32"===tV(d.dataType)?`var threadMax = ${$}(-3.4028234663852886e+38f);`:`var threadMax = ${$}(-65504.0h);`,v=r.compute({name:"Softmax",shaderCache:{hint:`${m};${y}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:h,dataType:d.dataType}],dispatchGroup:{x:f},programUniforms:[{type:6,data:g}]}),getShaderSource:e=>{let t;return`
      var<workgroup> rowMaxShared : ${$};
      var<workgroup> rowSumShared : ${$};
      var<workgroup> threadShared : array<${$}, ${y}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${$} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${$}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${e.registerUniform("packedCols","i32").declareVariables(_,b)}
      ${e.mainStart(y)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${y};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${w}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${$}(${t="threadShared[0]",4===m?`max(max(${t}.x, ${t}.y), max(${t}.z, ${t}.w))`:2===m?`max(${t}.x, ${t}.y)`:3===m?`max(max(${t}.x, ${t}.y), ${t}.z)`:t});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${$}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${$}(${tj("threadShared[0]",m)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${$}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`}},{inputs:[d],outputs:[l?-1:0]})[0],l&&r.compute(t4(v,p),{inputs:[v]})},n_=e=>tP({axis:e.axis})}),nv=u(()=>{e3(),tl(),t2(),n$=e=>Array.from(e.getBigInt64Array(),Number),nw=e=>{var t;let r,i,a,s,n,o,u;(e=>{if(!e||2!==e.length)throw Error("Tile requires 2 inputs.");if(1!==e[0].dataType&&10!==e[0].dataType&&6!==e[0].dataType&&12!==e[0].dataType)throw Error("Tile only support float, float16, int32, and uint32 data types");if(7!==e[1].dataType)throw Error("Tile `repeats` input should be of int64 data type");if(1!==e[1].dims.length)throw Error("Tile `repeats` input should be 1-D");if(n$(e[1]).length!==e[0].dims.length)throw Error("Tile `repeats` input should have same number of elements as rank of input data tensor")})(e.inputs),e.compute((r=(t=e.inputs)[0].dims,a=((e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r})(r,i=(void 0)??n$(t[1])),s=ta.size(a),n=t[0].dataType,o=tQ("input",n,r.length),u=tX("output",n,a.length),{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:[{type:12,data:s},...tF(t[0].dims,a)]}),getShaderSource:e=>`
      const inputShape = ${o.indices(...r)};
      ${e.registerUniform("output_size","u32").declareVariables(o,u)}
      ${e.mainStart()}
      ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`}),{inputs:[0]})}}),nS=u(()=>{e3(),tl(),t2(),nx=e=>{e.compute((e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,s=!(ta.areEqual(t,r)&&ta.areEqual(r,i)),n=t,o=ta.size(t);if(s){let e=ti.calcShape(ti.calcShape(t,r,!1),i,!1);if(!e)throw Error("Can't perform where op on the given tensors");n=e,o=ta.size(n)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:t=>((e,t,r,i,a)=>{let s=tX("output_data",a,r.length,4),n=tQ("a_data",t[1].dataType,t[1].dims.length,4),o=tQ("b_data",t[2].dataType,t[2].dims.length,4),u=tQ("c_data",t[0].dataType,t[0].dims.length,4),l,d=(e,t,r)=>`select(${t}, ${e}, ${r})`;if(i){let e=(e,t,r="")=>{let i=`a_data[index_a${t}][component_a${t}]`,a=`b_data[index_b${t}][component_b${t}]`,l=`bool(c_data[index_c${t}] & (0xffu << (component_c${t} * 8)))`;return`
            let output_indices${t} = ${s.offsetToIndices(`global_idx * 4u + ${t}u`)};
            let offset_a${t} = ${n.broadcastedIndicesToOffset(`output_indices${t}`,s)};
            let offset_b${t} = ${o.broadcastedIndicesToOffset(`output_indices${t}`,s)};
            let offset_c${t} = ${u.broadcastedIndicesToOffset(`output_indices${t}`,s)};
            let index_a${t} = offset_a${t} / 4u;
            let index_b${t} = offset_b${t} / 4u;
            let index_c${t} = offset_c${t} / 4u;
            let component_a${t} = offset_a${t} % 4u;
            let component_b${t} = offset_b${t} % 4u;
            let component_c${t} = offset_c${t} % 4u;
            ${e}[${t}] = ${r}(${d(i,a,l)});
          `};l=9===a?`
            var data = vec4<u32>(0);
            ${e("data",0,"u32")}
            ${e("data",1,"u32")}
            ${e("data",2,"u32")}
            ${e("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:`
            ${e("output_data[global_idx]",0)}
            ${e("output_data[global_idx]",1)}
            ${e("output_data[global_idx]",2)}
            ${e("output_data[global_idx]",3)}
          `}else l=s.setByOffset("global_idx",d(n.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,n,o,s)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${l}
      }`})(t,e,n,s,a),getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...tF(i,t,r,n)]})}})(e.inputs))}}),nE=u(()=>{rM(),rL(),rV(),rF(),ik(),iL(),iF(),af(),ax(),aE(),aC(),aN(),aZ(),aY(),a0(),a3(),a8(),a9(),sr(),ss(),sc(),sz(),sR(),sM(),sP(),sN(),sb(),sq(),s8(),s9(),nt(),na(),rz(),nl(),sE(),np(),ng(),nb(),sx(),nv(),t5(),iT(),nS(),nT=new Map([["Abs",[rW]],["Acos",[rH]],["Acosh",[rj]],["Add",[iC]],["ArgMax",[rR,rB]],["ArgMin",[rO,rB]],["Asin",[rK]],["Asinh",[rZ]],["Atan",[rQ]],["Atanh",[rX]],["Attention",[rU]],["AveragePool",[sX,sQ]],["BatchNormalization",[rN]],["BiasAdd",[rq]],["BiasSplitGelu",[iE]],["Cast",[rJ,rY]],["Ceil",[r1]],["Clip",[r0]],["Concat",[iV,iq]],["Conv",[ac,ap]],["ConvTranspose",[av,a$]],["Cos",[r2]],["Cosh",[r3]],["CumSum",[aS,aT]],["DepthToSpace",[ak,aI]],["DequantizeLinear",[s5,s7]],["DFT",[aU,aL]],["Div",[iz]],["Einsum",[aj,aK]],["Elu",[r6,r4]],["Equal",[iA]],["Erf",[r5]],["Exp",[r7]],["Expand",[aX]],["FastGelu",[aJ]],["Floor",[r9]],["FusedConv",[ac,ap]],["Gather",[a2,a1]],["GatherElements",[st,se]],["GatherBlockQuantized",[a5,a7]],["GatherND",[a4,a6]],["Gelu",[ie]],["Gemm",[sa,si]],["GlobalAveragePool",[s0,sJ]],["GlobalMaxPool",[s6,s4]],["Greater",[iM]],["GreaterOrEqual",[iP]],["GridSample",[sp,sh]],["GroupQueryAttention",[sC]],["HardSigmoid",[il,iu]],["HardSwish",[id]],["InstanceNormalization",[sO]],["LayerNormalization",[sB]],["LeakyRelu",[it,r4]],["Less",[iD]],["LessOrEqual",[iU]],["Log",[iv]],["MatMul",[sD]],["MatMulNBits",[sU,sL]],["MaxPool",[s2,s3]],["Mul",[iO]],["MultiHeadAttention",[s_,sm]],["Neg",[ii]],["Not",[ir]],["Pad",[sV]],["Pow",[iR]],["QuickGelu",[iS,r4]],["Range",[ne]],["Reciprocal",[ia]],["ReduceMin",[rT]],["ReduceMean",[r$]],["ReduceMax",[rS]],["ReduceSum",[rk]],["ReduceProd",[rE]],["ReduceL1",[rw]],["ReduceL2",[rv]],["ReduceLogSum",[rC]],["ReduceLogSumExp",[rx]],["ReduceSumSquare",[rI]],["Relu",[is]],["Resize",[no,nu]],["RotaryEmbedding",[sT]],["ScatterND",[ni,nr]],["Sigmoid",[io]],["Sin",[ip]],["Sinh",[ih]],["Slice",[nf,nm]],["SkipLayerNormalization",[nd]],["Split",[sw,sv]],["Sqrt",[ic]],["Softmax",[ny,n_]],["Sub",[iB]],["Tan",[im]],["Tanh",[iy]],["ThresholdedRelu",[iw,r4]],["Tile",[nw]],["Transpose",[t6,t8]],["Where",[nx]]])}),nI=u(()=>{em(),tt(),t2(),nk=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){C(e.programInfo.name);let s=this.backend.device,n=this.backend.getComputePassEncoder();this.backend.writeTimestamp(2*this.backend.pendingDispatchNumber);let o=[];for(let e of t)o.push({binding:o.length,resource:{buffer:e.buffer}});for(let e of r)o.push({binding:o.length,resource:{buffer:e.buffer}});a&&o.push({binding:o.length,resource:a});let u=s.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if("capturing"===this.backend.sessionStatus){let t={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(t)}n.setPipeline(e.computePipeline),n.setBindGroup(0,u),n.dispatchWorkgroups(...i),this.backend.writeTimestamp(2*this.backend.pendingDispatchNumber+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||"at-passes"===this.backend.queryType)&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),z(e.programInfo.name)}dispose(){}build(e,t){C(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(e=>{r.features.has(e.feature)&&i.push(`enable ${e.extension};`)});let a=t1(t,this.backend.device.limits),s=e.getShaderSource(a),n=`${i.join(`
`)}
${a.additionalImplementations}
${s}`,o=r.createShaderModule({code:n,label:e.name});te("verbose",()=>`[WebGPU] ${e.name} shader code: ${n}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return z(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t="number"==typeof e?e:e.x,r="number"==typeof e?1:e.y||1,i="number"==typeof e?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let s=t*r*i,n=Math.ceil(Math.sqrt(s));if(!(n>a))return[n,n,1];if((n=Math.ceil(Math.cbrt(s)))>a)throw Error("Total dispatch size exceeds WebGPU maximum.");return[n,n,n]}}}),l(nC={},{WebGpuBackend:()=>nA}),nO=u(()=>{em(),e3(),tt(),tp(),tM(),nE(),nI(),nz=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},nA=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(null===this.currentKernelId)throw Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=e=>t.features.has(e)&&r.push(e)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i);let s=t.info??("function"==typeof t.requestAdapterInfo?await t.requestAdapterInfo():void 0);this.adapterInfo=new nz(s),this.gpuDataManager=tB(this),this.programManager=new nk(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,e9(e.logLevel,!!e.debug),this.device.onuncapturederror=e=>{e.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${e.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!0}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){"u">typeof this.querySet&&this.querySet.destroy(),this.gpuDataManager.dispose(),this.device&&this.env?.webgpu&&this.device.lost.then(()=>{delete this.env.webgpu.device})}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};"at-passes"===this.queryType&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:2*this.pendingDispatchNumber,endOfPassWriteIndex:2*this.pendingDispatchNumber+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){let e;this.commandEncoder&&(C(),this.endComputePass(),"none"!==this.queryType&&(this.commandEncoder.resolveQuerySet(this.querySet,0,2*this.pendingDispatchNumber,this.queryResolveBuffer,0),e=this.device.createBuffer({size:2*this.pendingDispatchNumber*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,2*this.pendingDispatchNumber*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,"none"!==this.queryType&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let e=0;e<t.length/2;e++){let i=r[e],a=i.kernelId,s=this.kernels.get(a),n=s.kernelType,o=s.kernelName,u=i.programName,l=i.inputTensorViews,d=i.outputTensorViews,p=t[2*e],h=t[2*e+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=p);let c=Number(p-this.queryTimeBase),f=Number(h-this.queryTimeBase);if(!Number.isSafeInteger(c)||!Number.isSafeInteger(f))throw RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:l.map(e=>({dims:e.dims,dataType:eQ(e.dataType)})),outputsMetadata:d.map(e=>({dims:e.dims,dataType:eQ(e.dataType)})),kernelId:a,kernelType:n,kernelName:o,programName:u,startTime:c,endTime:f});else{let e="";l.forEach((t,r)=>{e+=`input[${r}]: [${t.dims}] | ${eQ(t.dataType)}, `});let t="";d.forEach((e,r)=>{t+=`output[${r}]: [${e.dims}] | ${eQ(e.dataType)}, `}),console.log(`[profiling] kernel "${a}|${n}|${o}|${u}" ${e}${t}start time: ${c} ns, execution time: ${f-c} ns`)}k("GPU",`${u}::${p}::${h}`)}e.unmap(),this.pendingQueries.delete(e)}),z())}run(e,t,r,i,a,s){var n,o,u;let l,d;C(e.name);let p=[];for(let e=0;e<t.length;++e){let r=t[e].data;if(0===r)continue;let i=this.gpuDataManager.get(r);if(!i)throw Error(`no GPU data for input: ${r}`);p.push(i)}let{outputs:h,dispatchGroup:c,programUniforms:f}=e.getRunData(t),m=0===r.length?h.map((e,t)=>t):r;if(m.length!==h.length)throw Error(`Output size ${m.length} must be equal to ${h.length}.`);let g=[],y=[];for(let e=0;e<h.length;++e){if(!Number.isInteger(m[e])||m[e]<-3||m[e]>=s)throw Error(`Invalid output index: ${m[e]}`);if(-3===m[e])continue;let t=-1===m[e],r=-2===m[e],n=t||r?a(h[e].dataType,h[e].dims):i(m[e],h[e].dataType,h[e].dims);if(g.push(n),0===n.data)continue;let o=this.gpuDataManager.get(n.data);if(!o)throw Error(`no GPU data for output: ${n.data}`);if(t&&this.temporaryData.push(o),r){let e=this.kernelPersistentData.get(this.currentKernelId);e||(e=[],this.kernelPersistentData.set(this.currentKernelId,e)),e.push(o)}y.push(o)}if(p.length!==t.length||y.length!==g.length){if(0===y.length)return z(e.name),g;throw Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}if(f){let e=0,t=[];f.forEach(r=>{let i="number"==typeof r.data?[r.data]:r.data;if(0===i.length)return;let a=10===r.type?2:4,s,n;10===r.type?(n=i.length>4?16:i.length>2?8:i.length*a,s=i.length>4?16:a*i.length):(n=i.length<=2?i.length*a:16,s=16),e=Math.ceil(e/n)*n,t.push(e);let o=10===r.type?8:4;e+=i.length>4?Math.ceil(i.length/o)*s:i.length*a});let r=new ArrayBuffer(e=16*Math.ceil(e/16));f.forEach((e,i)=>{let a=t[i],s="number"==typeof e.data?[e.data]:e.data;if(6===e.type)new Int32Array(r,a,s.length).set(s);else if(12===e.type)new Uint32Array(r,a,s.length).set(s);else if(10===e.type)new Uint16Array(r,a,s.length).set(s);else if(1===e.type)new Float32Array(r,a,s.length).set(s);else throw Error(`Unsupported uniform type: ${eQ(e.type)}`)});let i=this.gpuDataManager.create(e,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(i.buffer,0,r,0,e),this.gpuDataManager.release(i.id),l={offset:0,size:e,buffer:i.buffer}}let _=this.programManager.normalizeDispatchGroupSize(c),b=(n=e,o=t,u=1===_[1]&&1===_[2],d=n.name,n.shaderCache?.hint&&(d+="["+n.shaderCache.hint+"]"),d+=":"+u+`:${((e,t)=>{if(t.length!==e.length)throw Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":r.push("");break;case"type":r.push(`${a}`);break;case"rank":{let t=e[i].dims.length;r.push(`${a};${t}`);break}case"dims":{let t=e[i].dims.join(",");r.push(`${a};${t}`);break}default:throw Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")})(o,n.shaderCache?.inputDependencies??Array(o.length).fill("dims"))}`),$=this.programManager.getArtifact(b);if($||($=this.programManager.build(e,_),this.programManager.setArtifact(b,$),te("info",()=>`[artifact] key: ${b}, programName: ${e.name}`)),f&&$.uniformVariablesInfo){if(f.length!==$.uniformVariablesInfo.length)throw Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${f.length} in program "${$.programInfo.name}".`);for(let e=0;e<f.length;e++){let t=f[e],r=t.type,i="number"==typeof t.data?1:t.data.length,[a,s]=$.uniformVariablesInfo[e];if(r!==a||i!==s)throw Error(`Uniform variable ${e} mismatch: expect type ${a} with size ${s}, got type ${r} with size ${i} in program "${$.programInfo.name}".`)}}if(te("info",()=>`[ProgramManager] run "${e.name}" (key=${b}) with ${_[0]}x${_[1]}x${_[2]}`),"none"!==this.queryType||"capturing"===this.sessionStatus){let e={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:g};this.pendingKernels.push(e),"capturing"===this.sessionStatus&&this.capturedPendingKernels.get(this.currentSessionId).push(e)}return this.programManager.run($,p,y,_,l),z(e.name),g}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=nT.get(e);if(!a)throw Error(`kernel not implemented: ${e}`);let s={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,s)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let e of t)this.gpuDataManager.release(e.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw Error(`kernel not created: ${e}`);let a=i.kernelType,s=i.kernelName,n=i.kernelEntry,o=i.attributes;if(null!==this.currentKernelId)throw Error(`kernel "[${a}] ${s}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),te("info",()=>`[WebGPU] Start to run kernel "[${a}] ${s}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),n(t,o[1]),0}catch(e){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${s}" failed. ${e}`)),1}finally{for(let e of(u&&r.push(this.device.popErrorScope().then(e=>e?`GPU validation error for kernel "[${a}] ${s}": ${e.message}`:null)),this.temporaryData))this.gpuDataManager.release(e.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let s=a.get(t),n=this.gpuDataManager.registerExternalBuffer(r,i,s);return a.set(t,[n,r]),n}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(e=>this.gpuDataManager.unregisterExternalBuffer(e[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await tO(this,e,t);return td(i.buffer,r)}}writeTimestamp(e){"inside-passes"===this.queryType&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),"none"!==this.queryType&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:2*this.maxDispatchNumber}),this.queryResolveBuffer=this.device.createBuffer({size:2*this.maxDispatchNumber*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){te("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){te("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){te("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let r=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(2*this.pendingDispatchNumber),r.setPipeline(a.computePipeline),r.setBindGroup(0,a.bindGroup),r.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(2*this.pendingDispatchNumber+1),this.pendingDispatchNumber++,"none"!==this.queryType&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||"at-passes"===this.queryType)&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),l(nR={},{init:()=>nD}),nP=u(()=>{e3(),tt(),tl(),tT(),nB=class e{constructor(e,t,r,i){this.module=e,this.dataType=t,this.data=r,this.dims=i}getFloat32Array(){if(1!==this.dataType)throw Error("Invalid data type");let e=ta.size(this.dims);return 0===e?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,e)}getBigInt64Array(){if(7!==this.dataType)throw Error("Invalid data type");let e=ta.size(this.dims);return 0===e?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,e)}getInt32Array(){if(6!==this.dataType)throw Error("Invalid data type");let e=ta.size(this.dims);return 0===e?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,e)}getUint16Array(){if(10!==this.dataType&&4!==this.dataType)throw Error("Invalid data type");let e=ta.size(this.dims);return 0===e?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,e)}reshape(t){if(ta.size(t)!==ta.size(this.dims))throw Error("Invalid new shape");return new e(this.module,this.dataType,this.data,t)}},nM=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo,this.deviceLimits=t.device.limits;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,s=4===i?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,s));let n=Number(e.getValue(i*a++,s));this.outputCount=Number(e.getValue(i*a++,s)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,s));let o=[];for(let t=0;t<n;t++){let t=Number(e.getValue(i*a++,s)),r=Number(e.getValue(i*a++,"*")),n=Number(e.getValue(i*a++,s)),u=[];for(let t=0;t<n;t++)u.push(Number(e.getValue(i*a++,s)));o.push(new nB(e,t,r,u))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(e=>"number"==typeof e?this.inputs[e]:e)??this.inputs,i=t?.outputs??[],a=(e,t,r)=>new nB(this.module,t,this.output(e,r),r),s=(e,t)=>{let r=eX(e,t);if(!r)throw Error(`Unsupported data type: ${e}`);let i=r>0?this.backend.gpuDataManager.create(r).id:0;return new nB(this.module,e,i,t)};return this.backend.run(e,r,i,a,s,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let r=this.module.PTR_SIZE,i=4===r?"i32":"i64",a=this.module.stackAlloc((1+t.length)*r);this.module.setValue(a,t.length,i);for(let e=0;e<t.length;e++)this.module.setValue(a+r*(e+1),t[e],i);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(r){throw Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${r}`)}finally{this.module.stackRestore(r)}}},nD=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if("webgpu"===e){let e=new(nO(),d(nC)).WebGpuBackend;await e.initialize(r,i),a("webgpu",[e,t=>e.alloc(Number(t)),t=>e.free(t),(r,i,a,s=!1)=>{if(s)te("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(r)}, dst=${Number(i)}, size=${Number(a)}`),e.memcpy(Number(r),Number(i));else{te("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(r)}, gpuDataId=${Number(i)}, size=${Number(a)}`);let s=t.HEAPU8.subarray(Number(r>>>0),Number(r>>>0)+Number(a));e.upload(Number(i),s)}},async(r,i,a)=>{te("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${r}, dataOffset=${i}, size=${a}`),await e.download(Number(r),()=>t.HEAPU8.subarray(Number(i)>>>0,Number(i+a)>>>0))},(r,i,a)=>e.createKernel(r,Number(i),a,t.UTF8ToString(t._JsepGetNodeName(Number(i)))),t=>e.releaseKernel(t),(r,i,a,s)=>{te("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${a}, kernel=${r}, contextDataOffset=${i}`);let n=new nM(t,e,Number(i));return e.computeKernel(Number(r),n,s)},()=>e.captureBegin(),()=>e.captureEnd(),()=>e.replay()])}else{let e=new tS(r);a("webnn",[e,()=>e.reserveTensorId(),t=>e.releaseTensorId(t),async(t,r,i,a,s)=>e.ensureTensor(t,r,i,a,s),(t,r)=>{e.uploadTensor(t,r)},async(t,r)=>e.downloadTensor(t,r),(t,r)=>e.registerMLContext(t,r),!!r.trace])}}}),n0=u(()=>{em(),eG(),eK(),e3(),eU(),eq(),e6(),nU=async e=>{var t,r;t=e.wasm.numThreads,r=eJ(e.logLevel),0!==eP()._OrtInit(t,r)&&eV("Can't initialize onnxruntime.")},nL=async(e,t)=>{eP().asyncInit?.();let r=e.webgpu.adapter;if("webgpu"===t){if(typeof navigator>"u"||!navigator.gpu)throw Error("WebGPU is not supported in current environment");if(r){if("object"!=typeof r.limits||"object"!=typeof r.features||"function"!=typeof r.requestDevice)throw Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let t=e.webgpu.powerPreference;if(void 0!==t&&"low-power"!==t&&"high-performance"!==t)throw Error(`Invalid powerPreference setting: "${t}"`);let i=e.webgpu.forceFallbackAdapter;if(void 0!==i&&"boolean"!=typeof i)throw Error(`Invalid forceFallbackAdapter setting: "${i}"`);if(!(r=await navigator.gpu.requestAdapter({powerPreference:t,forceFallbackAdapter:i})))throw Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if("webnn"===t&&(typeof navigator>"u"||!navigator.ml))throw Error("WebNN is not supported in current environment");{let i=(nP(),d(nR)).init;"webgpu"===t&&await i("webgpu",eP(),e,r),"webnn"===t&&await i("webnn",eP(),e)}},nN=new Map,nV=(e,t)=>{let r=eP(),i=r.stackSave(),a=0;try{let i=r.PTR_SIZE,s=r.stackAlloc(2*i);0!==r._OrtGetInputOutputMetadata(e,t,s,s+i)&&eV("Can't get session input/output metadata.");let n=Number(r.getValue(s,"*"));a=Number(r.getValue(s+i,"*"));let o=r.HEAP32[a/4];if(0===o)return[n,0];let u=r.HEAPU32[a/4+1],l=[];for(let e=0;e<u;e++){let t=Number(r.getValue(a+8+e*i,"*"));l.push(0!==t?r.UTF8ToString(t):Number(r.getValue(a+8+(e+u)*i,"*")))}return[n,o,l]}finally{r.stackRestore(i),0!==a&&r._OrtFree(a)}},nq=e=>{let t=eP(),r=t._malloc(e.byteLength);if(0===r)throw Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},nF=async(e,t)=>{let r,i,a=eP();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=nq(e);let s=0,n=0,o=0,u=[],l=[],d=[];try{if([n,u]=await ej(t),t?.externalData&&a.mountExternalData){let e=[];for(let r of t.externalData){let t="string"==typeof r?r:r.path,i="string"==typeof r?r:r.data;e.push(e4(i).then(e=>{a.mountExternalData(t,e)}))}await Promise.all(e)}for(let e of t?.executionProviders??[])if(("string"==typeof e?e:e.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,"string"!=typeof e){let t=e?.context,r=e?.gpuDevice,i=e?.deviceType,s=e?.powerPreference;t?a.currentContext=t:r?a.currentContext=await a.webnnCreateMLContext(r):a.currentContext=await a.webnnCreateMLContext({deviceType:i,powerPreference:s})}else a.currentContext=await a.webnnCreateMLContext();break}s=await a._OrtCreateSession(r,i,n),a.webgpuOnCreateSession?.(s),0===s&&eV("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(s,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[e,p]=(e=>{let t=eP(),r=t.stackSave();try{let r=t.PTR_SIZE,i=t.stackAlloc(2*r);0!==t._OrtGetInputOutputCount(e,i,i+r)&&eV("Can't get session input/output count.");let a=4===r?"i32":"i64";return[Number(t.getValue(i,a)),Number(t.getValue(i+r,a))]}finally{t.stackRestore(r)}})(s),h=!!t?.enableGraphCapture,c=[],f=[],m=[],g=[],y=[];for(let t=0;t<e;t++){let[e,r,i]=nV(s,t);0===e&&eV("Can't get an input name."),l.push(e);let n=a.UTF8ToString(e);c.push(n),m.push(0===r?{name:n,isTensor:!1}:{name:n,isTensor:!0,type:eQ(r),shape:i})}for(let r=0;r<p;r++){let[i,n,o]=nV(s,r+e);0===i&&eV("Can't get an output name."),d.push(i);let u=a.UTF8ToString(i);f.push(u),g.push(0===n?{name:u,isTensor:!1}:{name:u,isTensor:!0,type:eQ(n),shape:o});{if(h&&t?.preferredOutputLocation===void 0){y.push("gpu-buffer");continue}let e="string"==typeof t?.preferredOutputLocation?t.preferredOutputLocation:t?.preferredOutputLocation?.[u]??"cpu",r=a.webnnIsGraphOutput;if("cpu"===e&&r&&r(s,u)){y.push("ml-tensor-cpu-output");continue}if("cpu"!==e&&"cpu-pinned"!==e&&"gpu-buffer"!==e&&"ml-tensor"!==e)throw Error(`Not supported preferred output location: ${e}.`);if(h&&"gpu-buffer"!==e)throw Error(`Not supported preferred output location: ${e}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);y.push(e)}}let _=null;return y.some(e=>"gpu-buffer"===e||"ml-tensor"===e||"ml-tensor-cpu-output"===e)&&(o=a._OrtCreateBinding(s),0===o&&eV("Can't create IO binding."),_={handle:o,outputPreferredLocations:y,outputPreferredLocationsEncoded:y.map(e=>"ml-tensor-cpu-output"===e?"ml-tensor":e).map(e=>e2(e))}),nN.set(s,[s,l,d,_,h,!1]),[s,c,f,m,g]}catch(e){throw l.forEach(e=>a._OrtFree(e)),d.forEach(e=>a._OrtFree(e)),0!==o&&0!==a._OrtReleaseBinding(o)&&eV("Can't release IO binding."),0!==s&&0!==a._OrtReleaseSession(s)&&eV("Can't release session."),e}finally{a._free(r),0!==n&&0!==a._OrtReleaseSessionOptions(n)&&eV("Can't release session options."),u.forEach(e=>a._free(e)),a.unmountExternalData?.()}},nG=e=>{let t=eP(),r=nN.get(e);if(!r)throw Error(`cannot release session. invalid session id: ${e}`);let[i,a,s,n,o]=r;n&&(o&&0!==t._OrtClearBoundOutputs(n.handle)&&eV("Can't clear bound outputs."),0!==t._OrtReleaseBinding(n.handle)&&eV("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(e=>t._OrtFree(e)),s.forEach(e=>t._OrtFree(e)),0!==t._OrtReleaseSession(i)&&eV("Can't release session."),nN.delete(e)},nW=new Map,nH=1,nj=new Map,nK=e=>{let t=eP(),r=t._malloc(e.byteLength);if(0===r)throw Error(`Can't create a LoRA adapter. failed to allocate a buffer of size ${e.byteLength}.`);try{t.HEAPU8.set(e,r);let i=t._OrtCreateLoraAdapter(r,e.byteLength);0===i&&eV("Can't create a LoRA adapter.");let a=nH++;return nW.set(a,i),a}finally{t._free(r)}},nZ=e=>{let t=eP(),r=nW.get(e);if(void 0===r)throw Error(`cannot release LoRA adapter. invalid adapter id: ${e}`);if(nj.has(e))throw Error(`cannot release LoRA adapter. the adapter is used by a run in progress. adapter id: ${e}`);0!==t._OrtReleaseLoraAdapter(r)&&eV("Can't release LoRA adapter."),nW.delete(e)},nQ=async(e,t,r,i,a,s,n=!1)=>{if(!e)return void t.push(0);let o=eP(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],h=p,c,f;if("string"===l&&("gpu-buffer"===p||"ml-tensor"===p))throw Error("String tensor is not supported on GPU.");if(n&&"gpu-buffer"!==p)throw Error(`External buffer must be provided for input/output index ${s} when enableGraphCapture is true.`);if("gpu-buffer"===p){let t=e[2].gpuBuffer;f=eX(eZ(l),d);{let e=o.jsepRegisterBuffer;if(!e)throw Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');c=e(i,s,t,f)}}else if("ml-tensor"===p){let t=e[2].mlTensor;f=eX(eZ(l),d);let r=o.webnnRegisterMLTensor;if(!r)throw Error('Tensor location "ml-tensor" is not supported without using WebNN.');c=r(i,t,eZ(l),d)}else{let t=e[2];if(Array.isArray(t)){f=u*t.length,c=o._malloc(f),r.push(c);for(let e=0;e<t.length;e++){if("string"!=typeof t[e])throw TypeError(`tensor data at index ${e} is not a string`);o.setValue(c+e*u,eL(t[e],r),"*")}}else{let e=o.webnnIsGraphInput,s=o.webnnIsGraphOutput;if("string"!==l&&e&&s){let n=o.UTF8ToString(a);if(e(i,n)||s(i,n)){let e=eZ(l);f=eX(e,d),h="ml-tensor";let r=o.webnnCreateTemporaryTensor,a=o.webnnUploadTensor;if(!r||!a)throw Error('Tensor location "ml-tensor" is not supported without using WebNN.');let s=await r(i,e,d);a(s,new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),c=s}else f=t.byteLength,c=o._malloc(f),r.push(c),o.HEAPU8.set(new Uint8Array(t.buffer,t.byteOffset,f),c)}else f=t.byteLength,c=o._malloc(f),r.push(c),o.HEAPU8.set(new Uint8Array(t.buffer,t.byteOffset,f),c)}}let m=o.stackSave(),g=o.stackAlloc(4*d.length);try{d.forEach((e,t)=>o.setValue(g+t*u,e,4===u?"i32":"i64"));let e=o._OrtCreateTensor(eZ(l),c,f,g,d.length,e2(h));0===e&&eV(`Can't create tensor for input/output. session=${i}, index=${s}.`),t.push(e)}finally{o.stackRestore(m)}},nX=async(e,t,r,i,a,s,n=[])=>{let o=eP(),u=o.PTR_SIZE,l=nN.get(e);if(!l)throw Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],p=l[1],h=l[2],c=l[3],f=l[4],m=l[5],g=[];if(n.length>0){if(c)throw Error("LoRA adapters are not supported for a session that uses IO binding, e.g. when an output is preferred to be on GPU, or when the WebNN execution provider produces an output.");for(let e of n){let t=nW.get(e);if(void 0===t)throw Error(`cannot run inference. invalid LoRA adapter id: ${e}`);g.push(t)}}let y=t.length,_=i.length,b=0,$=[],w=[],v=[],x=[],S=[],T=o.stackSave(),E=o.stackAlloc(y*u),k=o.stackAlloc(y*u),I=o.stackAlloc(_*u),C=o.stackAlloc(_*u);try{let l;for(let e of n)nj.set(e,(nj.get(e)??0)+1);[b,$]=eF(s,g),A("wasm prepareInputOutputTensor");for(let i=0;i<y;i++)await nQ(r[i],w,x,e,p[t[i]],t[i],f);for(let t=0;t<_;t++)await nQ(a[t],v,x,e,h[i[t]],y+i[t],f);O("wasm prepareInputOutputTensor");for(let e=0;e<y;e++)o.setValue(E+e*u,w[e],"*"),o.setValue(k+e*u,p[t[e]],"*");for(let e=0;e<_;e++)o.setValue(I+e*u,v[e],"*"),o.setValue(C+e*u,h[i[e]],"*");if(c&&!m){let{handle:r,outputPreferredLocations:s,outputPreferredLocationsEncoded:n}=c;if(p.length!==y)throw Error(`input count from feeds (${y}) is expected to be always equal to model's input count (${p.length}).`);A("wasm bindInputsOutputs");for(let i=0;i<y;i++){let a=t[i];await o._OrtBindInput(r,p[a],w[i])!==0&&eV(`Can't bind input[${i}] for session=${e}.`)}for(let t=0;t<_;t++){let u=i[t];a[t]?.[3]?(S.push(v[t]),0!==o._OrtBindOutput(r,h[u],v[t],0)&&eV(`Can't bind pre-allocated output[${t}] for session=${e}.`)):0!==o._OrtBindOutput(r,h[u],0,n[u])&&eV(`Can't bind output[${t}] to ${s[t]} for session=${e}.`)}O("wasm bindInputsOutputs"),nN.set(e,[d,p,h,c,f,!0])}o.jsepOnRunStart?.(d),o.webnnOnRunStart?.(d),l=c?await o._OrtRunWithBinding(d,c.handle,_,I,b):await o._OrtRun(d,k,E,y,C,_,I,b),0!==l&&eV("failed to call OrtRun().");let T=[],z=[];A("wasm ProcessOutputTensor");for(let t=0;t<_;t++){let r=Number(o.getValue(I+t*u,"*"));if(r===v[t]||S.includes(v[t])){T.push(a[t]),r!==v[t]&&0!==o._OrtReleaseTensor(r)&&eV("Can't release tensor.");continue}let s=o.stackSave(),n=o.stackAlloc(4*u),l=!1,d,p=0;try{0!==o._OrtGetTensorData(r,n,n+u,n+2*u,n+3*u)&&eV(`Can't access output tensor data on index ${t}.`);let a=4===u?"i32":"i64",s=Number(o.getValue(n,a));p=o.getValue(n+u,"*");let h=o.getValue(n+2*u,"*"),f=Number(o.getValue(n+3*u,a)),m=[];for(let e=0;e<f;e++)m.push(Number(o.getValue(h+e*u,a)));0!==o._OrtFree(h)&&eV("Can't free memory for tensor dims.");let g=m.reduce((e,t)=>e*t,1);d=eQ(s);let y=c?.outputPreferredLocations[i[t]];if("string"===d){if("gpu-buffer"===y||"ml-tensor"===y)throw Error("String tensor is not supported on GPU.");let e=[];for(let t=0;t<g;t++){let r=o.getValue(p+t*u,"*"),i=o.getValue(p+(t+1)*u,"*"),a=t===g-1?void 0:i-r;e.push(o.UTF8ToString(r,a))}T.push([d,m,e,"cpu"])}else if("gpu-buffer"===y&&g>0){let e=o.jsepGetBuffer;if(!e)throw Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let t=e(p),i=eX(s,g);if(void 0===i||!e0(d))throw Error(`Unsupported data type: ${d}`);l=!0,T.push([d,m,{gpuBuffer:t,download:o.jsepCreateDownloader(t,i,d),dispose:()=>{0!==o._OrtReleaseTensor(r)&&eV("Can't release tensor.")}},"gpu-buffer"])}else if("ml-tensor"===y&&g>0){let t=o.webnnEnsureTensor,i=o.webnnIsGraphInputOutputTypeSupported;if(!t||!i)throw Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(void 0===eX(s,g)||!e1(d))throw Error(`Unsupported data type: ${d}`);if(!i(e,d,!1))throw Error(`preferredLocation "ml-tensor" for ${d} output is not supported by current WebNN Context.`);let a=await t(e,p,s,m,!1);l=!0,T.push([d,m,{mlTensor:a,download:o.webnnCreateMLTensorDownloader(p,d),dispose:()=>{o.webnnReleaseTensorId(p),o._OrtReleaseTensor(r)}},"ml-tensor"])}else if("ml-tensor-cpu-output"===y&&g>0){let e=o.webnnCreateMLTensorDownloader(p,d)(),t=T.length;l=!0,z.push((async()=>{let i=[t,await e];return o.webnnReleaseTensorId(p),o._OrtReleaseTensor(r),i})()),T.push([d,m,[],"cpu"])}else{let e=new(eY(d))(g);new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(o.HEAPU8.subarray(p,p+e.byteLength)),T.push([d,m,e,"cpu"])}}finally{o.stackRestore(s),"string"===d&&p&&o._free(p),l||o._OrtReleaseTensor(r)}}for(let[t,r]of(c&&!f&&(0!==o._OrtClearBoundOutputs(c.handle)&&eV("Can't clear bound outputs."),nN.set(e,[d,p,h,c,f,!1])),await Promise.all(z)))T[t][2]=r;return O("wasm ProcessOutputTensor"),T}finally{for(let e of(o.webnnOnRunEnd?.(d),o.stackRestore(T),w.forEach(e=>o._OrtReleaseTensor(e)),v.forEach(e=>o._OrtReleaseTensor(e)),x.forEach(e=>o._free(e)),0!==b&&o._OrtReleaseRunOptions(b),$.forEach(e=>o._free(e)),n)){let t=nj.get(e)-1;0===t?nj.delete(e):nj.set(e,t)}}},nY=e=>{let t=eP(),r=nN.get(e);if(!r)throw Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);0===a&&eV("Can't get an profile file name."),t._OrtFree(a)},nJ=e=>{let t=[];for(let r of e){let e=r[2];!Array.isArray(e)&&"buffer"in e&&t.push(e.buffer)}return t}}),op=u(()=>{em(),n0(),eU(),eA(),e6(),n1=()=>!!T.wasm.proxy&&"u">typeof document,n3=!1,n4=!1,n6=!1,n7=new Map,n9=(e,t)=>{let r=n7.get(e);r?r.push(t):n7.set(e,[t])},oe=()=>{if(n3||!n4||n6||!n2)throw Error("worker not ready")},ot=e=>{switch(e.data.type){case"init-wasm":n3=!1,e.data.err?(n6=!0,n5[1](e.data.err)):(n4=!0,n5[0]()),n8&&(URL.revokeObjectURL(n8),n8=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=n7.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out)}}},or=async()=>{if(!n4){if(n3)throw Error("multiple calls to 'initWasm()' detected.");if(n6)throw Error("previous call to 'initWasm()' failed.");if(n3=!0,n1())return new Promise((e,t)=>{n2?.terminate(),eI().then(([r,i])=>{try{(n2=i).onerror=e=>t(e),n2.onmessage=ot,n5=[e,t];let a={type:"init-wasm",in:T};if(!a.in.wasm.wasmPaths&&r){let e=ex();e&&(a.in.wasm.wasmPaths=e)}n2.postMessage(a),n8=r}catch(e){t(e)}},t)});try{await eD(T.wasm),await nU(T),n4=!0}catch(e){throw n6=!0,e}finally{n3=!1}}},oi=async e=>{if(n1())return oe(),new Promise((t,r)=>{n9("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:T}};n2.postMessage(i)});await nL(T,e)},oa=async e=>n1()?(oe(),new Promise((t,r)=>{n9("copy-from",[t,r]),n2.postMessage({type:"copy-from",in:{buffer:e}},[e.buffer])})):nq(e),os=async(e,t)=>{if(!n1())return nF(e,t);if(t?.preferredOutputLocation)throw Error('session option "preferredOutputLocation" is not supported for proxy.');return oe(),new Promise((r,i)=>{n9("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},s=[];e instanceof Uint8Array&&s.push(e.buffer),n2.postMessage(a,s)})},on=async e=>{if(n1())return oe(),new Promise((t,r)=>{n9("release",[t,r]),n2.postMessage({type:"release",in:e})});nG(e)},oo=async e=>{if(n1())throw Error("LoRA adapter is not supported for proxy.");let t="string"==typeof e?await e4(e):e;return nK(t)},ou=async e=>{if(n1())throw Error("LoRA adapter is not supported for proxy.");nZ(e)},ol=async(e,t,r,i,a,s,n)=>{if(!n1())return nX(e,t,r,i,a,s,n);if(n.length>0)throw Error("LoRA adapter is not supported for proxy.");if(r.some(e=>"cpu"!==e[3]))throw Error("input tensor on GPU is not supported for proxy.");if(a.some(e=>e))throw Error("pre-allocated output tensor is not supported for proxy.");return oe(),new Promise((a,n)=>{n9("run",[a,n]),n2.postMessage({type:"run",in:{sessionId:e,inputIndices:t,inputs:r,outputIndices:i,options:s}},nJ(r))})},od=async e=>{if(n1())return oe(),new Promise((t,r)=>{n9("end-profiling",[t,r]),n2.postMessage({type:"end-profiling",in:e})});nY(e)}}),oc=u(()=>{em(),op(),oh=class{async loadAdapter(e){C(),this.adapterId=await oo(e),z()}async dispose(){return ou(this.adapterId)}}}),oy=u(()=>{em(),oc(),op(),e3(),eg(),e6(),of=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw Error(`invalid data location: ${e.location} for ${t()}`)}},om=e=>{switch(e[3]){case"cpu":return new er(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!e0(t))throw Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return er.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!e1(t))throw Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return er.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw Error(`invalid data location: ${e[3]}`)}},og=class{async fetchModelAndCopyToWasmMemory(e){return oa(await e4(e))}async loadModel(e,t){let r;C(),r="string"==typeof e?await this.fetchModelAndCopyToWasmMemory(e):e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await os(r,t),z()}async dispose(){return on(this.sessionId)}async run(e,t,r,i=[]){C();let a=i.map(e=>{if(!(e instanceof oh))throw Error("LoRA adapter was not created by the WebAssembly backend.");return e.adapterId}),s=[],n=[];Object.entries(e).forEach(e=>{let t=e[0],r=e[1],i=this.inputNames.indexOf(t);if(-1===i)throw Error(`invalid input '${t}'`);s.push(r),n.push(i)});let o=[],u=[];Object.entries(t).forEach(e=>{let t=e[0],r=e[1],i=this.outputNames.indexOf(t);if(-1===i)throw Error(`invalid output '${t}'`);o.push(r),u.push(i)});let l=s.map((e,t)=>of(e,()=>`input "${this.inputNames[n[t]]}"`)),d=o.map((e,t)=>e?of(e,()=>`output "${this.outputNames[u[t]]}"`):null),p=await ol(this.sessionId,n,l,u,d,r,a),h={};for(let e=0;e<p.length;e++)h[this.outputNames[u[e]]]=o[e]??om(p[e]);return z(),h}startProfiling(){}endProfiling(){od(this.sessionId)}}}),ob=u(()=>{o_=e=>{if(e?.epContextDataRead)throw Error('session option "epContextDataRead" is not supported by ONNX Runtime Web')}}),l(o$={},{OnnxruntimeWebAssemblyBackend:()=>ov,initializeFlags:()=>ow,wasmBackend:()=>ox}),oS=u(()=>{em(),oc(),op(),oy(),ob(),ow=()=>{("number"!=typeof T.wasm.initTimeout||T.wasm.initTimeout<0)&&(T.wasm.initTimeout=0);let e=T.wasm.simd;if("boolean"!=typeof e&&void 0!==e&&"fixed"!==e&&"relaxed"!==e&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),T.wasm.simd=!1),"boolean"!=typeof T.wasm.proxy&&(T.wasm.proxy=!1),"boolean"!=typeof T.wasm.trace&&(T.wasm.trace=!1),"number"!=typeof T.wasm.numThreads||!Number.isInteger(T.wasm.numThreads)||T.wasm.numThreads<=0)if("u">typeof self&&!self.crossOriginIsolated)T.wasm.numThreads=1;else{let e=typeof navigator>"u"?o("node:os").cpus().length:navigator.hardwareConcurrency;T.wasm.numThreads=Math.min(4,Math.ceil((e||1)/2))}},ox=new(ov=class{async init(e){ow(),await or(),await oi(e)}async createInferenceSessionHandler(e,t){o_(t);let r=new og;return await r.loadModel(e,t),r}async createLoraAdapterHandler(e){let t=new oh;return await t.loadAdapter(e),t}})}),l(oT={},{InferenceSession:()=>en,LoraAdapter:()=>eu,TRACE:()=>k,TRACE_EVENT_BEGIN:()=>A,TRACE_EVENT_END:()=>O,TRACE_FUNC_BEGIN:()=>C,TRACE_FUNC_END:()=>z,Tensor:()=>er,default:()=>oE,env:()=>T,registerBackend:()=>f}),em(),em(),em(),oE=ef,ok=(oS(),d(o$)).wasmBackend,f("webgpu",ok,5),f("webnn",ok,5),f("cpu",ok,10),f("wasm",ok,10),Object.defineProperty(T.versions,"web",{value:"1.31.1",enumerable:!0}),t.exports=d(oT)},32097,(e,t,r)=>{var i,a,s,n,o,u,l,d,p,h,c,f,m,g,y,_,b,$,w,v,x,S,T,E,k,I,C,z,A,O,R,B,M,D,P,U,L,N,V,q,F,G,W,H,j,K,Z,Q,X,Y,J,ee,et,er,ei,ea,es,en,eo,eu,el,ed,ep,eh,ec,ef,em,eg,ey,e_,eb,e$,ew,ev,ex,eS,eT,eE,ek,eI,eC,ez,eA,eO,eR,eB,eM,eD,eP,eU,eL,eN,eV,eq,eF,eG,eW,eH,ej,eK,eZ,eQ,eX,eY,eJ,e0,e1,e2,e3,e4,e6,e8,e5,e7,e9,te,tt,tr,ti,ta,ts,tn,to,tu,tl,td,tp,th,tc,tf,tm,tg,ty,t_,tb,t$,tw,tv,tx,tS,tT,tE,tk,tI,tC,tz,tA,tO,tR,tB,tM,tD,tP,tU,tL,tN,tV,tq,tF,tG,tW,tH,tj,tK;let tZ;i=Object.defineProperty,a=Object.getOwnPropertyDescriptor,s=Object.getOwnPropertyNames,n=Object.prototype.hasOwnProperty,o=e.t,u=(e,t,r)=>()=>{if(r)throw r[0];try{return e&&(t=e(e=0)),t}catch(e){throw r=[e],e}},l=(e,t)=>{for(var r in t)i(e,r,{get:t[r],enumerable:!0})},d=e=>((e,t,r)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let o of s(t))n.call(e,o)||void 0===o||i(e,o,{get:()=>t[o],enumerable:!(r=a(t,o))||r.enumerable});return e})(i({},"__esModule",{value:!0}),e),_=u(()=>{p=new Map,h=[],c=new WeakMap,f=(e,t,r)=>{if(t&&"function"==typeof t.init&&"function"==typeof t.createInferenceSessionHandler){let i=p.get(e);if(void 0===i)p.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let t=h.indexOf(e);-1!==t&&h.splice(t,1);for(let t=0;t<h.length;t++)if(p.get(h[t]).priority<=r)return void h.splice(t,0,e);h.push(e)}return}throw TypeError("not a valid backend")},m=async e=>{let t=p.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{if(!r){let r=t.backend,i=c.get(r);t.initPromise=i?i.then(async()=>r.init(e),async()=>r.init(e)):r.init(e),c.set(r,t.initPromise)}return await t.initPromise,t.initialized=!0,t.backend}catch(e){return r||(t.error=`${e}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},g=async e=>{let t=e.executionProviders||[],r=t.map(e=>"string"==typeof e?e:e.name),i=0===r.length?h:r,a,s=[],n=new Set;for(let e of i){let t=await m(e);"string"==typeof t?s.push({name:e,err:t}):(a||(a=t),a===t&&n.add(e))}if(!a)throw Error(`no available backend found. ERR: ${s.map(e=>`[${e.name}] ${e.err}`).join(", ")}`);for(let{name:e,err:t}of s)r.includes(e)&&console.warn(`removing requested execution provider "${e}" from session options because it is not available: ${t}`);let o=t.filter(e=>n.has("string"==typeof e?e:e.name));return[a,new Proxy(e,{get:(e,t)=>"executionProviders"===t?o:Reflect.get(e,t)})]},y=async()=>{let e=[];for(let t of h){if("function"!=typeof p.get(t).backend.createLoraAdapterHandler)continue;let r=await m(t);if("string"!=typeof r)return r;e.push({name:t,err:r})}let t=0===e.length?"":` ERR: ${e.map(e=>`[${e.name}] ${e.err}`).join(", ")}`;throw Error(`no available backend supports LoRA adapters.${t}`)}}),b=u(()=>{_()}),w=u(()=>{$="1.31.1"}),S=u(()=>{w(),v="warning",Object.defineProperty(x={wasm:{},webgl:{},webgpu:{},versions:{common:$},set logLevel(e){if(void 0!==e){if("string"!=typeof e||-1===["verbose","info","warning","error","fatal"].indexOf(e))throw Error(`Unsupported logging level: ${e}`);v=e}},get logLevel(){return v}},"logLevel",{enumerable:!0})}),E=u(()=>{S(),T=x}),R=u(()=>{S(),k=(e,t)=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.timeStamp(`${e}::ORT::${t}`)},I=(e,t)=>{let r=Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let a=0;a<r.length;a++){if(i&&!r[a].includes("TRACE_FUNC")){let i=`FUNC_${e}::${r[a].trim().split(" ")[1]}`;t&&(i+=`::${t}`),k("CPU",i);return}r[a].includes("TRACE_FUNC")&&(i=!0)}},C=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&I("BEGIN",e)},z=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&I("END",e)},A=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.time(`ORT::${e}`)},O=e=>{(typeof x.trace>"u"?x.wasm.trace:x.trace)&&console.timeEnd(`ORT::${e}`)}}),M=u(()=>{_(),R(),B=class e{constructor(e,t){this.backend=e,this.handler=t}static async create(t){if(C(),"string"!=typeof t&&!(t instanceof Uint8Array))throw TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let r=await y(),i=await r.createLoraAdapterHandler(t);return z(),new e(r,i)}async release(){return this.handler.dispose()}}}),U=u(()=>{D=(e,t)=>{let r="u">typeof document?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(null!=i){let a,s;t?.tensorLayout!==void 0&&"NHWC"===t.tensorLayout?(a=e.dims[2],s=e.dims[3]):(a=e.dims[3],s=e.dims[2]);let n=t?.format!==void 0?t.format:"RGB",o=t?.norm,u,l;void 0===o||void 0===o.mean?u=[255,255,255,255]:"number"==typeof o.mean?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],void 0!==o.mean[3]&&(u[3]=o.mean[3])),void 0===o||void 0===o.bias?l=[0,0,0,0]:"number"==typeof o.bias?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],void 0!==o.bias[3]&&(l[3]=o.bias[3]));let d=s*a,p=0,h=d,c=2*d,f=-1;"RGBA"===n?(p=0,h=d,c=2*d,f=3*d):"RGB"===n?(p=0,h=d,c=2*d):"RBG"===n&&(p=0,c=d,h=2*d);for(let t=0;t<s;t++)for(let r=0;r<a;r++)i.fillStyle="rgba("+(e.data[p++]-l[0])*u[0]+","+(e.data[h++]-l[1])*u[1]+","+(e.data[c++]-l[2])*u[2]+","+(-1===f?255:(e.data[f++]-l[3])*u[3])+")",i.fillRect(r,t,1,1);if("toDataURL"in r)return r.toDataURL();throw Error("toDataURL is not supported")}throw Error("Can not access image data")},P=(e,t)=>{let r="u">typeof document?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(null!=r){let a,s,n;t?.tensorLayout!==void 0&&"NHWC"===t.tensorLayout?(a=e.dims[2],s=e.dims[1],n=e.dims[3]):(a=e.dims[3],s=e.dims[2],n=e.dims[1]);let o=void 0!==t&&void 0!==t.format?t.format:"RGB",u=t?.norm,l,d;void 0===u||void 0===u.mean?l=[255,255,255,255]:"number"==typeof u.mean?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],void 0!==u.mean[3]&&(l[3]=u.mean[3])),void 0===u||void 0===u.bias?d=[0,0,0,0]:"number"==typeof u.bias?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],void 0!==u.bias[3]&&(d[3]=u.bias[3]));let p=s*a;if(void 0!==t&&(void 0!==t.format&&4===n&&"RGBA"!==t.format||3===n&&"RGB"!==t.format&&"BGR"!==t.format))throw Error("Tensor format doesn't match input tensor dims");let h=0,c=1,f=2,m=3,g=0,y=p,_=2*p,b=-1;"RGBA"===o?(g=0,y=p,_=2*p,b=3*p):"RGB"===o?(g=0,y=p,_=2*p):"RBG"===o&&(g=0,_=p,y=2*p),i=r.createImageData(a,s);for(let t=0;t<s*a;h+=4,c+=4,f+=4,m+=4,t++)i.data[h]=(e.data[g++]-d[0])*l[0],i.data[c]=(e.data[y++]-d[1])*l[1],i.data[f]=(e.data[_++]-d[2])*l[2],i.data[m]=-1===b?255:(e.data[b++]-d[3])*l[3]}else throw Error("Can not access image data");return i}}),W=u(()=>{et(),L=(e,t)=>{if(void 0===e)throw Error("Image buffer must be defined");if(void 0===t.height||void 0===t.width)throw Error("Image height and width must be defined");if("NHWC"===t.tensorLayout)throw Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},s,n;s="number"==typeof a.mean?[a.mean,a.mean,a.mean,a.mean]:[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],n="number"==typeof a.bias?[a.bias,a.bias,a.bias,a.bias]:[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=void 0!==t.format?t.format:"RGBA",u=void 0!==t.tensorFormat&&void 0!==t.tensorFormat?t.tensorFormat:"RGB",l=r*i,d=new Float32Array("RGBA"===u?4*l:3*l),p=4,h=0,c=1,f=2,m=3,g=0,y=l,_=2*l,b=-1;"RGB"===o&&(p=3,h=0,c=1,f=2,m=-1),"RGBA"===u?b=3*l:"RBG"===u?(g=0,_=l,y=2*l):"BGR"===u&&(_=0,y=l,g=2*l);for(let t=0;t<l;t++,h+=p,f+=p,c+=p,m+=p)d[g++]=(e[h]+n[0])/s[0],d[y++]=(e[c]+n[1])/s[1],d[_++]=(e[f]+n[2])/s[2],-1!==b&&-1!==m&&(d[b++]=(e[m]+n[3])/s[3]);return"RGBA"===u?new ee("float32",d,[1,4,r,i]):new ee("float32",d,[1,3,r,i])},N=async(e,t)=>{let r="u">typeof HTMLImageElement&&e instanceof HTMLImageElement,i="u">typeof ImageData&&e instanceof ImageData,a="u">typeof ImageBitmap&&e instanceof ImageBitmap,s="string"==typeof e,n,o=t??{},u=()=>{if("u">typeof document)return document.createElement("canvas");if("u">typeof OffscreenCanvas)return new OffscreenCanvas(1,1);throw Error("Canvas is not supported")},l=e=>"u">typeof HTMLCanvasElement&&e instanceof HTMLCanvasElement||e instanceof OffscreenCanvas?e.getContext("2d"):null;if(r){let r=u();r.width=e.width,r.height=e.height;let i=l(r);if(null!=i){let r=e.height,a=e.width;if(void 0!==t&&void 0!==t.resizedHeight&&void 0!==t.resizedWidth&&(r=t.resizedHeight,a=t.resizedWidth),void 0!==t){if(o=t,void 0!==t.tensorFormat)throw Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=r,o.width=a}else o.tensorFormat="RGBA",o.height=r,o.width=a;i.drawImage(e,0,0),n=i.getImageData(0,0,a,r).data}else throw Error("Can not access image data")}else if(i){let r,i;if(void 0!==t&&void 0!==t.resizedWidth&&void 0!==t.resizedHeight?(r=t.resizedHeight,i=t.resizedWidth):(r=e.height,i=e.width),void 0!==t&&(o=t),o.format="RGBA",o.height=r,o.width=i,void 0!==t){let t=u();t.width=i,t.height=r;let a=l(t);if(null!=a)a.putImageData(e,0,0),n=a.getImageData(0,0,i,r).data;else throw Error("Can not access image data")}else n=e.data}else if(a){if(void 0===t)throw Error("Please provide image config with format for Imagebitmap");let r=u();r.width=e.width,r.height=e.height;let i=l(r);if(null!=i){let t=e.height,r=e.width;return i.drawImage(e,0,0,r,t),n=i.getImageData(0,0,r,t).data,o.height=t,o.width=r,L(n,o)}throw Error("Can not access image data")}else{if(s)return new Promise((t,r)=>{let i=u(),a=l(i);if(!e||!a)return r();let s=new Image;s.crossOrigin="Anonymous",s.src=e,s.onload=()=>{i.width=s.width,i.height=s.height,a.drawImage(s,0,0,i.width,i.height);let e=a.getImageData(0,0,i.width,i.height);o.height=i.height,o.width=i.width,t(L(e.data,o))}});throw Error("Input data provided is not supported - aborted tensor creation")}if(void 0!==n)return L(n,o);throw Error("Input data provided is not supported - aborted tensor creation")},V=(e,t)=>{let{width:r,height:i,download:a,dispose:s}=t;return new ee({location:"texture",type:"float32",texture:e,dims:[1,i,r,4],download:a,dispose:s})},q=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new ee({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:s})},F=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:s}=t;return new ee({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:s})},G=(e,t,r)=>new ee({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Q=u(()=>{H=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),j=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),K=!1,Z=()=>{if(!K){K=!0;let e="u">typeof BigInt64Array&&BigInt64Array.from,t="u">typeof BigUint64Array&&BigUint64Array.from,r=globalThis.Float16Array,i="u">typeof r&&r.from;e&&(H.set("int64",BigInt64Array),j.set(BigInt64Array,"int64")),t&&(H.set("uint64",BigUint64Array),j.set(BigUint64Array,"uint64")),i?(H.set("float16",r),j.set(r,"float16")):H.set("float16",Uint16Array)}}}),J=u(()=>{et(),X=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if("number"!=typeof i||!Number.isSafeInteger(i))throw TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},Y=(e,t)=>{switch(e.location){case"cpu":return new ee(e.type,e.data,t);case"cpu-pinned":return new ee({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new ee({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new ee({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new ee({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),et=u(()=>{U(),W(),Q(),J(),ee=class{constructor(e,t,r){let i,a;if(Z(),"object"==typeof e&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let t=H.get(i);if(!t)throw TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof t))throw TypeError(`buffer should be of type ${t.name}`);this.cpuData=e.data;break}case"texture":if("float32"!==i)throw TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break;case"gpu-buffer":if("float32"!==i&&"float16"!==i&&"int32"!==i&&"int64"!==i&&"uint32"!==i&&"uint8"!==i&&"bool"!==i&&"uint4"!==i&&"int4"!==i)throw TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break;case"ml-tensor":if("float32"!==i&&"float16"!==i&&"int32"!==i&&"int64"!==i&&"uint32"!==i&&"uint64"!==i&&"int8"!==i&&"uint8"!==i&&"bool"!==i&&"uint4"!==i&&"int4"!==i)throw TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break;default:throw Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,n;if("string"==typeof e)if(i=e,n=r,"string"===e){if(!Array.isArray(t))throw TypeError("A string tensor's data must be a string array.");s=t}else{let r=H.get(e);if(void 0===r)throw TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if("float16"===e&&r===Uint16Array||"uint4"===e||"int4"===e)throw TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${r.name} as data.`);s="uint64"===e||"int64"===e?r.from(t,BigInt):r.from(t)}else if(t instanceof r)s=t;else if(t instanceof Uint8ClampedArray)if("uint8"===e)s=Uint8Array.from(t);else throw TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if("float16"===e&&t instanceof Uint16Array&&r!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw TypeError(`A ${i} tensor's data must be type of ${r}`)}else if(n=t,Array.isArray(e)){if(0===e.length)throw TypeError("Tensor type cannot be inferred from an empty array.");let t=typeof e[0];if("string"===t)i="string",s=e;else if("boolean"===t)i="bool",s=Uint8Array.from(e);else throw TypeError(`Invalid element type of data array: ${t}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let t=j.get(e.constructor);if(void 0===t)throw TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=t,s=e}if(void 0===n)n=[s.length];else if(!Array.isArray(n))throw TypeError("A tensor's dims must be a number array");a=n,this.cpuData=s,this.dataLocation="cpu"}let s=X(a);if(this.cpuData&&s!==this.cpuData.length&&("uint4"!==i&&"int4"!==i||Math.ceil(s/2)!==this.cpuData.length))throw Error(`Tensor's size(${s}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=s}static async fromImage(e,t){return N(e,t)}static fromTexture(e,t){return V(e,t)}static fromGpuBuffer(e,t){return q(e,t)}static fromMLTensor(e,t){return F(e,t)}static fromPinnedBuffer(e,t,r){return G(e,t,r)}toDataURL(e){return D(this,e)}toImageData(e){return P(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":if(!this.downloader)throw Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}default:throw Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if("none"===this.dataLocation)throw Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw Error("Cannot reshape a tensor that owns GPU resource.");return Y(this,e)}}}),ei=u(()=>{et(),er=ee}),es=u(()=>{_(),M(),ei(),R(),ea=class e{constructor(e,t){this.handler=e,this.backend=t}async run(e,t,r){let i;C(),A("InferenceSession.run");let a={},s={};if("object"!=typeof e||null===e||e instanceof er||Array.isArray(e))throw TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let n=!0;if("object"==typeof t){if(null===t)throw TypeError("Unexpected argument[1]: cannot be null.");if(t instanceof er)throw TypeError("'fetches' cannot be a Tensor");if(Array.isArray(t)){if(0===t.length)throw TypeError("'fetches' cannot be an empty array.");for(let e of(n=!1,t)){if("string"!=typeof e)throw TypeError("'fetches' must be a string array or an object.");if(-1===this.outputNames.indexOf(e))throw RangeError(`'fetches' contains invalid output name: ${e}.`);a[e]=null}if("object"==typeof r&&null!==r)s=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else{let e=!1,i=Object.getOwnPropertyNames(t);for(let r of this.outputNames)if(-1!==i.indexOf(r)){let i=t[r];(null===i||i instanceof er)&&(e=!0,n=!1,a[r]=i)}if(e){if("object"==typeof r&&null!==r)s=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else s=t}}else if("u">typeof t)throw TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let t of this.inputNames)if(typeof e[t]>"u")throw Error(`input '${t}' is missing in 'feeds'.`);if(n)for(let e of this.outputNames)a[e]=null;if(void 0!==s.activeLoraAdapters){if(!Array.isArray(s.activeLoraAdapters))throw TypeError("'activeLoraAdapters' must be an array.");i=s.activeLoraAdapters.map(e=>{if(!(e instanceof B))throw TypeError("'activeLoraAdapters' must be an array of LoraAdapter objects.");if(e.backend!==this.backend)throw Error("LoRA adapter was created by a different backend than the session.");return e.handler})}let o=await this.handler.run(e,a,s,i),u={};for(let e in o)if(Object.hasOwnProperty.call(o,e)){let t=o[e];t instanceof er?u[e]=t:u[e]=new er(t.type,t.data,t.dims)}return O("InferenceSession.run"),z(),u}async release(){return this.handler.dispose()}static async create(t,r,i,a){C(),A("InferenceSession.create");let s,n={};if("string"==typeof t){if(s=t,"object"==typeof r&&null!==r)n=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(s=t,"object"==typeof r&&null!==r)n=r;else if("u">typeof r)throw TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||"u">typeof SharedArrayBuffer&&t instanceof SharedArrayBuffer){let e=0,o=t.byteLength;if("object"==typeof r&&null!==r)n=r;else if("number"==typeof r){if(!Number.isSafeInteger(e=r))throw RangeError("'byteOffset' must be an integer.");if(e<0||e>=t.byteLength)throw RangeError(`'byteOffset' is out of range [0, ${t.byteLength}).`);if(o=t.byteLength-e,"number"==typeof i){if(!Number.isSafeInteger(o=i))throw RangeError("'byteLength' must be an integer.");if(o<=0||e+o>t.byteLength)throw RangeError(`'byteLength' is out of range (0, ${t.byteLength-e}].`);if("object"==typeof a&&null!==a)n=a;else if("u">typeof a)throw TypeError("'options' must be an object.")}else if("u">typeof i)throw TypeError("'byteLength' must be a number.")}else if("u">typeof r)throw TypeError("'options' must be an object.");s=new Uint8Array(t,e,o)}else throw TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await g(n),l=await o.createInferenceSessionHandler(s,u);return O("InferenceSession.create"),z(),new e(l,o)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),eo=u(()=>{es(),en=ea}),el=u(()=>{M(),eu=B}),ed=u(()=>{}),ep=u(()=>{}),eh=u(()=>{}),ec=u(()=>{}),l(ef={},{InferenceSession:()=>en,LoraAdapter:()=>eu,TRACE:()=>k,TRACE_EVENT_BEGIN:()=>A,TRACE_EVENT_END:()=>O,TRACE_FUNC_BEGIN:()=>C,TRACE_FUNC_END:()=>z,Tensor:()=>er,env:()=>T,registerBackend:()=>f}),em=u(()=>{b(),E(),eo(),el(),ei(),ed(),ep(),R(),eh(),ec()}),eg=u(()=>{}),l(ey={},{default:()=>eb}),e$=u(()=>{th(),eU(),eA(),(e_=globalThis.self?.name==="ort-wasm-proxy-worker")&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":eD(r.wasm).then(()=>{e8(r).then(()=>{postMessage({type:t})},e=>{postMessage({type:t,err:e})})},e=>{postMessage({type:t,err:e})});break;case"init-ep":{let{epName:e,env:i}=r;e5(i,e).then(()=>{postMessage({type:t})},e=>{postMessage({type:t,err:e})});break}case"copy-from":{let{buffer:e}=r,i=te(e);postMessage({type:t,out:i});break}case"create":{let{model:e,options:i}=r;tt(e,i).then(e=>{postMessage({type:t,out:e})},e=>{postMessage({type:t,err:e})});break}case"release":tr(r),postMessage({type:t});break;case"run":{let{sessionId:e,inputIndices:i,inputs:a,outputIndices:s,options:n}=r;tl(e,i,a,s,Array(s.length).fill(null),n).then(e=>{e.some(e=>"cpu"!==e[3])?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:e},tp([...a,...e]))},e=>{postMessage({type:t,err:e})});break}case"end-profiling":td(r),postMessage({type:t})}}catch(e){postMessage({type:t,err:e})}}),eb=e_?null:e=>new Worker(e??ev,{type:"classic",name:"ort-wasm-proxy-worker"})}),eA=u(()=>{eg(),ew=typeof location>"u"?void 0:location.origin,ev="u">typeof document?document.currentScript?.src:"u">typeof self?self.location?.href:void 0,ex=()=>{if(ev&&!ev.startsWith("blob:"))return ev.substring(0,ev.lastIndexOf("/")+1)},eS=(e,t)=>{try{let r=t??ev;return(r?new URL(e,r):new URL(e)).origin===ew}catch{return!1}},eT=async e=>{let t=await (await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},eE=async e=>(await import(e)).default,ek=(e$(),d(ey)).default,eI=async()=>{if(!ev)throw Error("Failed to load proxy worker: cannot determine the script source URL.");if(eS(ev))return[void 0,ek()];let e=await eT(ev);return[e,ek(e)]},eC=void 0,ez=async(e,t,r,i)=>{let a=eC&&!(e||t);if(a)if(ev)a=eS(ev)||i&&!r;else if(i&&!r)a=!0;else throw Error("cannot determine the script source URL.");if(a)return[void 0,eC];{let i,a,s="ort-wasm-simd-threaded.mjs",n=e??((e,t)=>{let r=t??ev;try{return(r?new URL(e,r):new URL(e)).href}catch{return}})(s,t),o=r&&n&&!eS(n,t),u=o?await eT(n):n??(i=s,a=t,`${a??"./"}${i}`);return[o?u:void 0,await eE(u)]}}}),eU=u(()=>{eA(),eR=!1,eB=!1,eM=!1,eD=async e=>{if(eR)return Promise.resolve();if(eB)throw Error("multiple calls to 'initializeWebAssembly()' detected.");if(eM)throw Error("previous call to 'initializeWebAssembly()' failed.");eB=!0;let t=e.initTimeout,r=e.numThreads;if(!1!==e.simd){if("relaxed"===e.simd){if(!(()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}})())throw Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!(()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}})())throw Error("WebAssembly SIMD is not supported in the current environment.")}let i=(()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return"u">typeof MessageChannel&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}})();r>1&&!i&&("u">typeof self&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,s="string"==typeof a?a:void 0,n=a?.mjs,o=n?.href??n,u=a?.wasm,l=u?.href??u,d=e.wasmBinary,[p,h]=await ez(o,s,r>1,!!d||!!l),c=!1,f=[];if(t>0&&f.push(new Promise(e=>{setTimeout(()=>{c=!0,e()},t)})),f.push(new Promise((e,t)=>{let i={numThreads:r};if(d)i.wasmBinary=d,i.locateFile=e=>e;else if(l||s)i.locateFile=e=>l??s+e;else if(o&&0!==o.indexOf("blob:"))i.locateFile=e=>new URL(e,o).href;else if(p){let e=ex();e&&(i.locateFile=t=>e+t)}h(i).then(t=>{eB=!1,eR=!0,eO=t,e(),p&&URL.revokeObjectURL(p)},e=>{eB=!1,eM=!0,t(e)})})),await Promise.race(f),c)throw Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},eP=()=>{if(eR&&eO)return eO;throw Error("WebAssembly is not initialized yet.")}}),eq=u(()=>{eU(),eL=(e,t)=>{let r=eP(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},eN=(e,t,r,i)=>{if("object"==typeof e&&null!==e){if(r.has(e))throw Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([e,a])=>{let s=t?t+e:e;if("object"==typeof a)eN(a,s+".",r,i);else if("string"==typeof a||"number"==typeof a)i(s,a.toString());else if("boolean"==typeof a)i(s,a?"1":"0");else throw Error(`Can't handle extra config type: ${typeof a}`)})},eV=e=>{let t=eP(),r=t.stackSave();try{let r=t.PTR_SIZE,i=t.stackAlloc(2*r);t._OrtGetLastError(i,i+r);let a=Number(t.getValue(i,4===r?"i32":"i64")),s=t.getValue(i+r,"*"),n=s?t.UTF8ToString(s):"";throw Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${n}`)}finally{t.stackRestore(r)}}}),eG=u(()=>{eU(),eq(),eF=(e,t)=>{let r=eP(),i=0,a=[],s=e||{};try{if(e?.logSeverityLevel===void 0)s.logSeverityLevel=2;else if("number"!=typeof e.logSeverityLevel||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)s.logVerbosityLevel=0;else if("number"!=typeof e.logVerbosityLevel||!Number.isInteger(e.logVerbosityLevel))throw Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(s.terminate=!1);let n=0;for(let o of(e?.tag!==void 0&&(n=eL(e.tag,a)),i=r._OrtCreateRunOptions(s.logSeverityLevel,s.logVerbosityLevel,!!s.terminate,n),0===i&&eV("Can't create run options."),e?.extra!==void 0&&eN(e.extra,"",new WeakSet,(e,t)=>{let s=eL(e,a),n=eL(t,a);0!==r._OrtAddRunConfigEntry(i,s,n)&&eV(`Can't set a run config entry: ${e} - ${t}.`)}),t))0!==r._OrtRunOptionsAddActiveLoraAdapter(i,o)&&eV("Can't add an active LoRA adapter.");return[i,a]}catch(e){throw 0!==i&&r._OrtReleaseRunOptions(i),a.forEach(e=>r._free(e)),e}}}),eK=u(()=>{eU(),eq(),eW=(e,t,r,i)=>{let a=eL(t,i),s=eL(r,i);0!==eP()._OrtAddSessionConfigEntry(e,a,s)&&eV(`Can't set a session config entry: ${t} - ${r}.`)},eH=async(e,t,r)=>{for(let i of t.executionProviders){let t,a="string"==typeof i?i:i.name,s=[],n;switch(a){case"webnn":if(a="WEBNN",eW(e,"session.disable_quant_qdq","1",r),eW(e,"session.disable_qdq_constant_folding","1",r),"string"!=typeof i){let t=i?.deviceType;t&&eW(e,"deviceType",t,r)}break;case"webgpu":if(a="JS","string"!=typeof i&&i?.preferredLayout){if("NCHW"!==i.preferredLayout&&"NHWC"!==i.preferredLayout)throw Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${i.preferredLayout}`);eW(e,"preferredLayout",i.preferredLayout,r)}break;case"wasm":case"cpu":continue;default:throw Error(`not supported execution provider: ${a}`)}let o=s.length,u=0,l=0;if(o>0){u=eP()._malloc(o*eP().PTR_SIZE),r.push(u),l=eP()._malloc(o*eP().PTR_SIZE),r.push(l);for(let e=0;e<o;e++)eP().setValue(u+e*eP().PTR_SIZE,s[e][0],"*"),eP().setValue(l+e*eP().PTR_SIZE,s[e][1],"*")}if(void 0!==n){let i=eP()._malloc(eP().PTR_SIZE);r.push(i),eP().setValue(i,n[0],"*"),t=await eP()._OrtAppendExecutionProviderV2(e,i,1,u,l,o)}else{let i=eL(a,r);t=await eP()._OrtAppendExecutionProvider(e,i,u,l,o)}0!==t&&eV(`Can't append execution provider: ${a}.`)}},ej=async e=>{var t;let r,i=eP(),a=0,s=[],n=e||{};(t=n).extra||(t.extra={}),t.extra.session||(t.extra.session={}),(r=t.extra.session).use_ort_model_bytes_directly||(r.use_ort_model_bytes_directly="1"),t.executionProviders&&t.executionProviders.some(e=>("string"==typeof e?e:e.name)==="webgpu")&&(t.enableMemPattern=!1);try{let e=(e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw Error(`unsupported graph optimization level: ${e}`)}})(n.graphOptimizationLevel??"all"),t=(e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw Error(`unsupported execution mode: ${e}`)}})(n.executionMode??"sequential"),r="string"==typeof n.logId?eL(n.logId,s):0,o=n.logSeverityLevel??2;if(!Number.isInteger(o)||o<0||o>4)throw Error(`log severity level is not valid: ${o}`);let u=n.logVerbosityLevel??0;if(!Number.isInteger(u)||u<0||u>4)throw Error(`log verbosity level is not valid: ${u}`);let l="string"==typeof n.optimizedModelFilePath?eL(n.optimizedModelFilePath,s):0;if(a=i._OrtCreateSessionOptions(e,!!n.enableCpuMemArena,!!n.enableMemPattern,t,!!n.enableProfiling,0,r,o,u,l),0===a&&eV("Can't create session options."),n.executionProviders&&await eH(a,n,s),void 0!==n.enableGraphCapture){if("boolean"!=typeof n.enableGraphCapture)throw Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);eW(a,"enableGraphCapture",n.enableGraphCapture.toString(),s)}if(n.freeDimensionOverrides)for(let[e,t]of Object.entries(n.freeDimensionOverrides)){if("string"!=typeof e)throw Error(`free dimension override name must be a string: ${e}`);if("number"!=typeof t||!Number.isInteger(t)||t<0)throw Error(`free dimension override value must be a non-negative integer: ${t}`);let r=eL(e,s);0!==i._OrtAddFreeDimensionOverride(a,r,t)&&eV(`Can't set a free dimension override: ${e} - ${t}.`)}return void 0!==n.extra&&eN(n.extra,"",new WeakSet,(e,t)=>{eW(a,e,t,s)}),[a,s]}catch(e){throw 0!==a&&0!==i._OrtReleaseSessionOptions(a)&&eV("Can't release session options."),s.forEach(e=>i._free(e)),e}}}),e3=u(()=>{eZ=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw Error(`unsupported data type: ${e}`)}},eQ=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw Error(`unsupported data type: ${e}`)}},eX=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i="number"==typeof t?t:t.reduce((e,t)=>e*t,1);return r>0?Math.ceil(i*r):void 0},eY=e=>{switch(e){case"float16":return"u">typeof Float16Array?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":case"bool":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw Error(`unsupported type: ${e}`)}},eJ=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw Error(`unsupported logging level: ${e}`)}},e0=e=>"float32"===e||"float16"===e||"int32"===e||"int64"===e||"uint32"===e||"uint8"===e||"bool"===e||"uint4"===e||"int4"===e,e1=e=>"float32"===e||"float16"===e||"int32"===e||"int64"===e||"uint32"===e||"uint64"===e||"int8"===e||"uint8"===e||"bool"===e||"uint4"===e||"int4"===e,e2=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw Error(`unsupported data location: ${e}`)}}}),e6=u(()=>{eg(),e4=async e=>{if("string"!=typeof e)return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e);{let t=await fetch(e);if(!t.ok)throw Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<0x40000000)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw Error(`failed to load external data file: ${e}, no response body.`);let r=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(e){if(e instanceof RangeError){let e=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:e,maximum:e}).buffer}else throw e}let s=0;for(;;){let{done:e,value:t}=await r.read();if(e)break;let i=t.byteLength;new Uint8Array(a,s,i).set(t),s+=i}return new Uint8Array(a,0,i)}}}}),th=u(()=>{em(),eG(),eK(),e3(),eU(),eq(),e6(),e8=async e=>{var t,r;t=e.wasm.numThreads,r=eJ(e.logLevel),0!==eP()._OrtInit(t,r)&&eV("Can't initialize onnxruntime.")},e5=async(e,t)=>{eP().asyncInit?.();let r=e.webgpu.adapter;if("webgpu"===t){if(typeof navigator>"u"||!navigator.gpu)throw Error("WebGPU is not supported in current environment");if(r){if("object"!=typeof r.limits||"object"!=typeof r.features||"function"!=typeof r.requestDevice)throw Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let t=e.webgpu.powerPreference;if(void 0!==t&&"low-power"!==t&&"high-performance"!==t)throw Error(`Invalid powerPreference setting: "${t}"`);let i=e.webgpu.forceFallbackAdapter;if(void 0!==i&&"boolean"!=typeof i)throw Error(`Invalid forceFallbackAdapter setting: "${i}"`);if(!(r=await navigator.gpu.requestAdapter({powerPreference:t,forceFallbackAdapter:i})))throw Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if("webnn"===t&&(typeof navigator>"u"||!navigator.ml))throw Error("WebNN is not supported in current environment")},e7=new Map,e9=(e,t)=>{let r=eP(),i=r.stackSave(),a=0;try{let i=r.PTR_SIZE,s=r.stackAlloc(2*i);0!==r._OrtGetInputOutputMetadata(e,t,s,s+i)&&eV("Can't get session input/output metadata.");let n=Number(r.getValue(s,"*"));a=Number(r.getValue(s+i,"*"));let o=r.HEAP32[a/4];if(0===o)return[n,0];let u=r.HEAPU32[a/4+1],l=[];for(let e=0;e<u;e++){let t=Number(r.getValue(a+8+e*i,"*"));l.push(0!==t?r.UTF8ToString(t):Number(r.getValue(a+8+(e+u)*i,"*")))}return[n,o,l]}finally{r.stackRestore(i),0!==a&&r._OrtFree(a)}},te=e=>{let t=eP(),r=t._malloc(e.byteLength);if(0===r)throw Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},tt=async(e,t)=>{let r,i,a=eP();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=te(e);let s=0,n=0,o=[],u=[],l=[];try{if([n,o]=await ej(t),t?.externalData&&a.mountExternalData){let e=[];for(let r of t.externalData){let t="string"==typeof r?r:r.path,i="string"==typeof r?r:r.data;e.push(e4(i).then(e=>{a.mountExternalData(t,e)}))}await Promise.all(e)}for(let e of t?.executionProviders??[])if(("string"==typeof e?e:e.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,"string"!=typeof e){let t=e?.context,r=e?.gpuDevice,i=e?.deviceType,s=e?.powerPreference;t?a.currentContext=t:r?a.currentContext=await a.webnnCreateMLContext(r):a.currentContext=await a.webnnCreateMLContext({deviceType:i,powerPreference:s})}else a.currentContext=await a.webnnCreateMLContext();break}s=await a._OrtCreateSession(r,i,n),a.webgpuOnCreateSession?.(s),0===s&&eV("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(s,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[e,d]=(e=>{let t=eP(),r=t.stackSave();try{let r=t.PTR_SIZE,i=t.stackAlloc(2*r);0!==t._OrtGetInputOutputCount(e,i,i+r)&&eV("Can't get session input/output count.");let a=4===r?"i32":"i64";return[Number(t.getValue(i,a)),Number(t.getValue(i+r,a))]}finally{t.stackRestore(r)}})(s),p=!!t?.enableGraphCapture,h=[],c=[],f=[],m=[];for(let t=0;t<e;t++){let[e,r,i]=e9(s,t);0===e&&eV("Can't get an input name."),u.push(e);let n=a.UTF8ToString(e);h.push(n),f.push(0===r?{name:n,isTensor:!1}:{name:n,isTensor:!0,type:eQ(r),shape:i})}for(let t=0;t<d;t++){let[r,i,n]=e9(s,t+e);0===r&&eV("Can't get an output name."),l.push(r);let o=a.UTF8ToString(r);c.push(o),m.push(0===i?{name:o,isTensor:!1}:{name:o,isTensor:!0,type:eQ(i),shape:n})}return e7.set(s,[s,u,l,null,p,!1]),[s,h,c,f,m]}catch(e){throw u.forEach(e=>a._OrtFree(e)),l.forEach(e=>a._OrtFree(e)),0!==s&&0!==a._OrtReleaseSession(s)&&eV("Can't release session."),e}finally{a._free(r),0!==n&&0!==a._OrtReleaseSessionOptions(n)&&eV("Can't release session options."),o.forEach(e=>a._free(e)),a.unmountExternalData?.()}},tr=e=>{let t=eP(),r=e7.get(e);if(!r)throw Error(`cannot release session. invalid session id: ${e}`);let[i,a,s,n,o]=r;n&&(o&&0!==t._OrtClearBoundOutputs(n.handle)&&eV("Can't clear bound outputs."),0!==t._OrtReleaseBinding(n.handle)&&eV("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(e=>t._OrtFree(e)),s.forEach(e=>t._OrtFree(e)),0!==t._OrtReleaseSession(i)&&eV("Can't release session."),e7.delete(e)},ti=new Map,ta=1,ts=new Map,tn=e=>{let t=eP(),r=t._malloc(e.byteLength);if(0===r)throw Error(`Can't create a LoRA adapter. failed to allocate a buffer of size ${e.byteLength}.`);try{t.HEAPU8.set(e,r);let i=t._OrtCreateLoraAdapter(r,e.byteLength);0===i&&eV("Can't create a LoRA adapter.");let a=ta++;return ti.set(a,i),a}finally{t._free(r)}},to=e=>{let t=eP(),r=ti.get(e);if(void 0===r)throw Error(`cannot release LoRA adapter. invalid adapter id: ${e}`);if(ts.has(e))throw Error(`cannot release LoRA adapter. the adapter is used by a run in progress. adapter id: ${e}`);0!==t._OrtReleaseLoraAdapter(r)&&eV("Can't release LoRA adapter."),ti.delete(e)},tu=async(e,t,r,i,a,s,n=!1)=>{if(!e)return void t.push(0);let o=eP(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],h=p,c,f;if("string"===l&&("gpu-buffer"===p||"ml-tensor"===p))throw Error("String tensor is not supported on GPU.");if(n&&"gpu-buffer"!==p)throw Error(`External buffer must be provided for input/output index ${s} when enableGraphCapture is true.`);if("gpu-buffer"===p){let t=e[2].gpuBuffer;f=eX(eZ(l),d);{let e=o.jsepRegisterBuffer;if(!e)throw Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');c=e(i,s,t,f)}}else if("ml-tensor"===p){let t=e[2].mlTensor;f=eX(eZ(l),d);let r=o.webnnRegisterMLTensor;if(!r)throw Error('Tensor location "ml-tensor" is not supported without using WebNN.');c=r(i,t,eZ(l),d)}else{let t=e[2];if(Array.isArray(t)){f=u*t.length,c=o._malloc(f),r.push(c);for(let e=0;e<t.length;e++){if("string"!=typeof t[e])throw TypeError(`tensor data at index ${e} is not a string`);o.setValue(c+e*u,eL(t[e],r),"*")}}else{let e=o.webnnIsGraphInput,s=o.webnnIsGraphOutput;if("string"!==l&&e&&s){let n=o.UTF8ToString(a);if(e(i,n)||s(i,n)){let e=eZ(l);f=eX(e,d),h="ml-tensor";let r=o.webnnCreateTemporaryTensor,a=o.webnnUploadTensor;if(!r||!a)throw Error('Tensor location "ml-tensor" is not supported without using WebNN.');let s=await r(i,e,d);a(s,new Uint8Array(t.buffer,t.byteOffset,t.byteLength)),c=s}else f=t.byteLength,c=o._malloc(f),r.push(c),o.HEAPU8.set(new Uint8Array(t.buffer,t.byteOffset,f),c)}else f=t.byteLength,c=o._malloc(f),r.push(c),o.HEAPU8.set(new Uint8Array(t.buffer,t.byteOffset,f),c)}}let m=o.stackSave(),g=o.stackAlloc(4*d.length);try{d.forEach((e,t)=>o.setValue(g+t*u,e,4===u?"i32":"i64"));let e=o._OrtCreateTensor(eZ(l),c,f,g,d.length,e2(h));0===e&&eV(`Can't create tensor for input/output. session=${i}, index=${s}.`),t.push(e)}finally{o.stackRestore(m)}},tl=async(e,t,r,i,a,s,n=[])=>{let o=eP(),u=o.PTR_SIZE,l=e7.get(e);if(!l)throw Error(`cannot run inference. invalid session id: ${e}`);let d=l[0],p=l[1],h=l[2],c=l[3],f=l[4],m=(l[5],[]);if(n.length>0){if(c)throw Error("LoRA adapters are not supported for a session that uses IO binding, e.g. when an output is preferred to be on GPU, or when the WebNN execution provider produces an output.");for(let e of n){let t=ti.get(e);if(void 0===t)throw Error(`cannot run inference. invalid LoRA adapter id: ${e}`);m.push(t)}}let g=t.length,y=i.length,_=0,b=[],$=[],w=[],v=[],x=[],S=o.stackSave(),T=o.stackAlloc(g*u),E=o.stackAlloc(g*u),k=o.stackAlloc(y*u),I=o.stackAlloc(y*u);try{let l;for(let e of n)ts.set(e,(ts.get(e)??0)+1);[_,b]=eF(s,m),A("wasm prepareInputOutputTensor");for(let i=0;i<g;i++)await tu(r[i],$,v,e,p[t[i]],t[i],f);for(let t=0;t<y;t++)await tu(a[t],w,v,e,h[i[t]],g+i[t],f);O("wasm prepareInputOutputTensor");for(let e=0;e<g;e++)o.setValue(T+e*u,$[e],"*"),o.setValue(E+e*u,p[t[e]],"*");for(let e=0;e<y;e++)o.setValue(k+e*u,w[e],"*"),o.setValue(I+e*u,h[i[e]],"*");o.jsepOnRunStart?.(d),o.webnnOnRunStart?.(d),l=await o._OrtRun(d,E,T,g,I,y,k,_),0!==l&&eV("failed to call OrtRun().");let S=[],C=[];A("wasm ProcessOutputTensor");for(let t=0;t<y;t++){let r=Number(o.getValue(k+t*u,"*"));if(r===w[t]||x.includes(w[t])){S.push(a[t]),r!==w[t]&&0!==o._OrtReleaseTensor(r)&&eV("Can't release tensor.");continue}let s=o.stackSave(),n=o.stackAlloc(4*u),l=!1,d,p=0;try{0!==o._OrtGetTensorData(r,n,n+u,n+2*u,n+3*u)&&eV(`Can't access output tensor data on index ${t}.`);let a=4===u?"i32":"i64",s=Number(o.getValue(n,a));p=o.getValue(n+u,"*");let h=o.getValue(n+2*u,"*"),f=Number(o.getValue(n+3*u,a)),m=[];for(let e=0;e<f;e++)m.push(Number(o.getValue(h+e*u,a)));0!==o._OrtFree(h)&&eV("Can't free memory for tensor dims.");let g=m.reduce((e,t)=>e*t,1);d=eQ(s);let y=c?.outputPreferredLocations[i[t]];if("string"===d){if("gpu-buffer"===y||"ml-tensor"===y)throw Error("String tensor is not supported on GPU.");let e=[];for(let t=0;t<g;t++){let r=o.getValue(p+t*u,"*"),i=o.getValue(p+(t+1)*u,"*"),a=t===g-1?void 0:i-r;e.push(o.UTF8ToString(r,a))}S.push([d,m,e,"cpu"])}else if("gpu-buffer"===y&&g>0){let e=o.jsepGetBuffer;if(!e)throw Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let t=e(p),i=eX(s,g);if(void 0===i||!e0(d))throw Error(`Unsupported data type: ${d}`);l=!0,S.push([d,m,{gpuBuffer:t,download:o.jsepCreateDownloader(t,i,d),dispose:()=>{0!==o._OrtReleaseTensor(r)&&eV("Can't release tensor.")}},"gpu-buffer"])}else if("ml-tensor"===y&&g>0){let t=o.webnnEnsureTensor,i=o.webnnIsGraphInputOutputTypeSupported;if(!t||!i)throw Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(void 0===eX(s,g)||!e1(d))throw Error(`Unsupported data type: ${d}`);if(!i(e,d,!1))throw Error(`preferredLocation "ml-tensor" for ${d} output is not supported by current WebNN Context.`);let a=await t(e,p,s,m,!1);l=!0,S.push([d,m,{mlTensor:a,download:o.webnnCreateMLTensorDownloader(p,d),dispose:()=>{o.webnnReleaseTensorId(p),o._OrtReleaseTensor(r)}},"ml-tensor"])}else if("ml-tensor-cpu-output"===y&&g>0){let e=o.webnnCreateMLTensorDownloader(p,d)(),t=S.length;l=!0,C.push((async()=>{let i=[t,await e];return o.webnnReleaseTensorId(p),o._OrtReleaseTensor(r),i})()),S.push([d,m,[],"cpu"])}else{let e=new(eY(d))(g);new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(o.HEAPU8.subarray(p,p+e.byteLength)),S.push([d,m,e,"cpu"])}}finally{o.stackRestore(s),"string"===d&&p&&o._free(p),l||o._OrtReleaseTensor(r)}}for(let[t,r]of(c&&!f&&(0!==o._OrtClearBoundOutputs(c.handle)&&eV("Can't clear bound outputs."),e7.set(e,[d,p,h,c,f,!1])),await Promise.all(C)))S[t][2]=r;return O("wasm ProcessOutputTensor"),S}finally{for(let e of(o.webnnOnRunEnd?.(d),o.stackRestore(S),$.forEach(e=>o._OrtReleaseTensor(e)),w.forEach(e=>o._OrtReleaseTensor(e)),v.forEach(e=>o._free(e)),0!==_&&o._OrtReleaseRunOptions(_),b.forEach(e=>o._free(e)),n)){let t=ts.get(e)-1;0===t?ts.delete(e):ts.set(e,t)}}},td=e=>{let t=eP(),r=e7.get(e);if(!r)throw Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);0===a&&eV("Can't get an profile file name."),t._OrtFree(a)},tp=e=>{let t=[];for(let r of e){let e=r[2];!Array.isArray(e)&&"buffer"in e&&t.push(e.buffer)}return t}}),tR=u(()=>{em(),th(),eU(),eA(),e6(),tc=()=>!!T.wasm.proxy&&"u">typeof document,tm=!1,tg=!1,ty=!1,t$=new Map,tw=(e,t)=>{let r=t$.get(e);r?r.push(t):t$.set(e,[t])},tv=()=>{if(tm||!tg||ty||!tf)throw Error("worker not ready")},tx=e=>{switch(e.data.type){case"init-wasm":tm=!1,e.data.err?(ty=!0,tb[1](e.data.err)):(tg=!0,tb[0]()),t_&&(URL.revokeObjectURL(t_),t_=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=t$.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out)}}},tS=async()=>{if(!tg){if(tm)throw Error("multiple calls to 'initWasm()' detected.");if(ty)throw Error("previous call to 'initWasm()' failed.");if(tm=!0,tc())return new Promise((e,t)=>{tf?.terminate(),eI().then(([r,i])=>{try{(tf=i).onerror=e=>t(e),tf.onmessage=tx,tb=[e,t];let a={type:"init-wasm",in:T};if(!a.in.wasm.wasmPaths&&r){let e=ex();e&&(a.in.wasm.wasmPaths=e)}tf.postMessage(a),t_=r}catch(e){t(e)}},t)});try{await eD(T.wasm),await e8(T),tg=!0}catch(e){throw ty=!0,e}finally{tm=!1}}},tT=async e=>{if(tc())return tv(),new Promise((t,r)=>{tw("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:T}};tf.postMessage(i)});await e5(T,e)},tE=async e=>tc()?(tv(),new Promise((t,r)=>{tw("copy-from",[t,r]),tf.postMessage({type:"copy-from",in:{buffer:e}},[e.buffer])})):te(e),tk=async(e,t)=>{if(!tc())return tt(e,t);if(t?.preferredOutputLocation)throw Error('session option "preferredOutputLocation" is not supported for proxy.');return tv(),new Promise((r,i)=>{tw("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},s=[];e instanceof Uint8Array&&s.push(e.buffer),tf.postMessage(a,s)})},tI=async e=>{if(tc())return tv(),new Promise((t,r)=>{tw("release",[t,r]),tf.postMessage({type:"release",in:e})});tr(e)},tC=async e=>{if(tc())throw Error("LoRA adapter is not supported for proxy.");let t="string"==typeof e?await e4(e):e;return tn(t)},tz=async e=>{if(tc())throw Error("LoRA adapter is not supported for proxy.");to(e)},tA=async(e,t,r,i,a,s,n)=>{if(!tc())return tl(e,t,r,i,a,s,n);if(n.length>0)throw Error("LoRA adapter is not supported for proxy.");if(r.some(e=>"cpu"!==e[3]))throw Error("input tensor on GPU is not supported for proxy.");if(a.some(e=>e))throw Error("pre-allocated output tensor is not supported for proxy.");return tv(),new Promise((a,n)=>{tw("run",[a,n]),tf.postMessage({type:"run",in:{sessionId:e,inputIndices:t,inputs:r,outputIndices:i,options:s}},tp(r))})},tO=async e=>{if(tc())return tv(),new Promise((t,r)=>{tw("end-profiling",[t,r]),tf.postMessage({type:"end-profiling",in:e})});td(e)}}),tM=u(()=>{em(),tR(),tB=class{async loadAdapter(e){C(),this.adapterId=await tC(e),z()}async dispose(){return tz(this.adapterId)}}}),tL=u(()=>{em(),tM(),tR(),e3(),eg(),e6(),tD=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw Error(`invalid data location: ${e.location} for ${t()}`)}},tP=e=>{switch(e[3]){case"cpu":return new er(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!e0(t))throw Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return er.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!e1(t))throw Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return er.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw Error(`invalid data location: ${e[3]}`)}},tU=class{async fetchModelAndCopyToWasmMemory(e){return tE(await e4(e))}async loadModel(e,t){let r;C(),r="string"==typeof e?await this.fetchModelAndCopyToWasmMemory(e):e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await tk(r,t),z()}async dispose(){return tI(this.sessionId)}async run(e,t,r,i=[]){C();let a=i.map(e=>{if(!(e instanceof tB))throw Error("LoRA adapter was not created by the WebAssembly backend.");return e.adapterId}),s=[],n=[];Object.entries(e).forEach(e=>{let t=e[0],r=e[1],i=this.inputNames.indexOf(t);if(-1===i)throw Error(`invalid input '${t}'`);s.push(r),n.push(i)});let o=[],u=[];Object.entries(t).forEach(e=>{let t=e[0],r=e[1],i=this.outputNames.indexOf(t);if(-1===i)throw Error(`invalid output '${t}'`);o.push(r),u.push(i)});let l=s.map((e,t)=>tD(e,()=>`input "${this.inputNames[n[t]]}"`)),d=o.map((e,t)=>e?tD(e,()=>`output "${this.outputNames[u[t]]}"`):null),p=await tA(this.sessionId,n,l,u,d,r,a),h={};for(let e=0;e<p.length;e++)h[this.outputNames[u[e]]]=o[e]??tP(p[e]);return z(),h}startProfiling(){}endProfiling(){tO(this.sessionId)}}}),tV=u(()=>{tN=e=>{if(e?.epContextDataRead)throw Error('session option "epContextDataRead" is not supported by ONNX Runtime Web')}}),l(tq={},{OnnxruntimeWebAssemblyBackend:()=>tG,initializeFlags:()=>tF,wasmBackend:()=>tW}),tH=u(()=>{em(),tM(),tR(),tL(),tV(),tF=()=>{("number"!=typeof T.wasm.initTimeout||T.wasm.initTimeout<0)&&(T.wasm.initTimeout=0);let e=T.wasm.simd;if("boolean"!=typeof e&&void 0!==e&&"fixed"!==e&&"relaxed"!==e&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),T.wasm.simd=!1),"boolean"!=typeof T.wasm.proxy&&(T.wasm.proxy=!1),"boolean"!=typeof T.wasm.trace&&(T.wasm.trace=!1),"number"!=typeof T.wasm.numThreads||!Number.isInteger(T.wasm.numThreads)||T.wasm.numThreads<=0)if("u">typeof self&&!self.crossOriginIsolated)T.wasm.numThreads=1;else{let e=typeof navigator>"u"?o("node:os").cpus().length:navigator.hardwareConcurrency;T.wasm.numThreads=Math.min(4,Math.ceil((e||1)/2))}},tW=new(tG=class{async init(e){tF(),await tS(),await tT(e)}async createInferenceSessionHandler(e,t){tN(t);let r=new tU;return await r.loadModel(e,t),r}async createLoraAdapterHandler(e){let t=new tB;return await t.loadAdapter(e),t}})}),l(tj={},{InferenceSession:()=>en,LoraAdapter:()=>eu,TRACE:()=>k,TRACE_EVENT_BEGIN:()=>A,TRACE_EVENT_END:()=>O,TRACE_FUNC_BEGIN:()=>C,TRACE_FUNC_END:()=>z,Tensor:()=>er,default:()=>tK,env:()=>T,registerBackend:()=>f}),em(),em(),em(),tK=ef,tZ=(tH(),d(tq)).wasmBackend,f("cpu",tZ,10),f("wasm",tZ,10),Object.defineProperty(T.versions,"web",{value:"1.31.1",enumerable:!0}),t.exports=d(tj)}])})();