YUI.add("yui-log",function(A){(function(){var D=A,F="yui:log",B="undefined",C={debug:1,info:1,warn:1,error:1},E;D.log=function(I,Q,G,O){var H=D,P=H.config,K=false,N,L,J,M;if(P.debug){if(G){N=P.logExclude;L=P.logInclude;if(L&&!(G in L)){K=1;}else{if(N&&(G in N)){K=1;}}}if(!K){if(P.useBrowserConsole){J=(G)?G+": "+I:I;if(typeof console!=B&&console.log){M=(Q&&console[Q]&&(Q in C))?Q:"log";console[M](J);}else{if(typeof opera!=B){opera.postError(J);}}}if(H.fire&&!O){if(!E){H.publish(F,{broadcast:2,emitFacade:1});E=1;}H.fire(F,{msg:I,cat:Q,src:G});}}}return H;};D.message=function(){return D.log.apply(D,arguments);};})();},"3.0.0",{requires:["yui-base"]});