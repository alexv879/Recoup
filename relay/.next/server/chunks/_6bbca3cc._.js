module.exports=[43613,e=>e.a(async(t,a)=>{try{var n=e.i(89171),o=e.i(4344),r=e.i(69907),i=e.i(10795),s=e.i(41378),l=e.i(6824),d=t([i]);[i]=d.then?(await d)():d;let u=`You are an AI collections agent calling on behalf of a freelancer to request payment for an overdue invoice.

CRITICAL RULES (UK Debt Collection Regulations):
1. Immediately identify yourself: "This is an automated call from {businessName} regarding an outstanding invoice."
2. Ask for consent to record: "This call may be recorded for training and quality purposes. Do you consent to continue?"
3. If they say NO to recording, end call politely immediately.
4. Be professional, empathetic, and non-threatening at all times.
5. NEVER be aggressive, threatening, or harassing.
6. If they request to stop calling, agree immediately and end call.
7. If they dispute the debt, note it and offer to send details in writing.
8. If they claim financial hardship, be understanding and offer payment plans.
9. Keep call under 10 minutes unless debtor is actively engaging.

YOUR GOALS (in priority order):
1. BEST: Collect full payment immediately via card payment link
2. GOOD: Negotiate payment plan with first payment today
3. ACCEPTABLE: Get promise to pay by specific date
4. MINIMUM: Understand their situation and document for follow-up

CONVERSATION FLOW:
1. Opening & Consent (30 seconds)
   - Identify yourself and purpose
   - Request recording consent
   - Confirm you're speaking to {recipientName}

2. Invoice Details (30 seconds)
   - State invoice {invoiceReference} for \xa3{amount}
   - Due date was {dueDate}
   - Now {daysPastDue} days overdue

3. Payment Request (1 minute)
   - Ask for immediate payment
   - If hesitant, explain consequences (facts, not threats)
   - Offer secure payment link via SMS

4. Negotiation (2-5 minutes if needed)
   - If can't pay full amount, ask what they CAN pay
   - Offer payment plan (50% today, 50% in 14 days)
   - Show empathy for financial hardship

5. Payment Collection (if agreed)
   - Confirm amount to be paid
   - Say: "I'm sending you a secure payment link by text message right now"
   - Wait for them to receive SMS
   - Stay on call while they complete payment

6. Closing (30 seconds)
   - Summarize agreed action
   - Confirm any follow-up date
   - Thank them

HANDLING OBJECTIONS:
- "I don't have the money": Offer smaller amount or payment plan
- "I never got the invoice": Offer to resend, payment still due
- "The work was poor": Note dispute, doesn't cancel debt
- "I'll pay next week": Get specific date and commitment
- "Stop calling me": Apologize, agree immediately, end call
- Abusive language: Stay calm, warn once, end if continues

VOICE TONE:
- Friendly but professional
- Empathetic and understanding
- Patient but persistent
- Clear and concise

REMEMBER: Maintain the freelancer's reputation. Be firm but fair.`;async function c(e){let t=(0,i.generateCorrelationId)();try{let a=await (0,l.checkWebhookRateLimit)({req:e,source:"twilio",webhookType:"voice-ai"});if(!a.allowed)return(0,r.logError)("Rate limit exceeded for Twilio voice-ai webhook",void 0,{correlationId:t}),n.NextResponse.json({error:"Too many requests"},{status:429,headers:(0,l.getRateLimitHeaders)(a)});if(!(0,s.validateWebhookOrigin)(e))return(0,r.logError)("CSRF: Invalid origin on webhook",void 0,{correlationId:t}),n.NextResponse.json({error:"Forbidden"},{status:403});if(!(0,s.validateContentType)(e,["application/x-www-form-urlencoded"]))return(0,r.logError)("CSRF: Invalid Content-Type",void 0,{correlationId:t}),n.NextResponse.json({error:"Invalid Content-Type"},{status:400});if(!await (0,o.verifyTwilioSignature)(e))return(0,r.logError)("Invalid Twilio signature on voice-ai webhook",void 0,{correlationId:t}),n.NextResponse.json({error:"Invalid signature"},{status:401});let{searchParams:i}=new URL(e.url),d=i.get("context");if(!d)return(0,r.logError)("Missing context parameter",void 0,{correlationId:t}),new n.NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Sorry, there was a technical error. Please try again later.</Say>
  <Hangup/>
</Response>`,{status:200,headers:{"Content-Type":"text/xml"}});let c=JSON.parse(decodeURIComponent(d));(0,r.logInfo)("Voice AI call connected",{invoiceId:c.invoiceId,recipientName:c.recipientName,correlationId:t});let p=u.replace("{businessName}",c.businessName).replace("{recipientName}",c.recipientName).replace("{invoiceReference}",c.invoiceReference).replace("{amount}",c.amount.toFixed(2)).replace("{dueDate}",c.dueDate).replace("{daysPastDue}",c.daysPastDue.toString()),h=encodeURIComponent(JSON.stringify({...c,aiInstructions:p,correlationId:t})),m=process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000",y=`wss://${m.replace(/^https?:\/\//,"")}/api/webhooks/twilio/voice-stream?context=${h}`,f=`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">
    Please wait while we connect you. This call may be recorded for training and quality purposes.
  </Say>
  <Connect>
    <Stream url="${y}">
      <Parameter name="context" value="${h}" />
    </Stream>
  </Connect>
</Response>`;return(0,r.logInfo)("TwiML generated with stream URL",{streamUrl:y.substring(0,100)+"...",correlationId:t}),new n.NextResponse(f,{status:200,headers:{"Content-Type":"text/xml"}})}catch(a){(0,r.logError)("Voice AI webhook error",a,{correlationId:t});try{let n=await e.formData(),o={};n.forEach((e,t)=>{o[t]=e.toString()});let r={};e.headers.forEach((e,t)=>{r[t]=e}),await (0,i.storeFailedWebhook)({source:"twilio",eventType:"voice.ai",payload:o,headers:r,url:e.url,error:a,correlationId:t})}catch(e){(0,r.logError)("Failed to store webhook for recovery",e,{correlationId:t})}return new n.NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">Sorry, there was a technical error. Please try again later.</Say>
  <Hangup/>
</Response>`,{status:200,headers:{"Content-Type":"text/xml"}})}}e.s(["POST",()=>c,"dynamic",0,"force-dynamic"]),a()}catch(e){a(e)}},!1),21080,e=>e.a(async(t,a)=>{try{var n=e.i(47909),o=e.i(74017),r=e.i(96250),i=e.i(84243),s=e.i(61916),l=e.i(14444),d=e.i(37092),c=e.i(69741),u=e.i(16795),p=e.i(87718),h=e.i(95169),m=e.i(47587),y=e.i(66012),f=e.i(70101),g=e.i(26937),v=e.i(10372),R=e.i(93695);e.i(52474);var w=e.i(220),C=e.i(43613),E=t([C]);[C]=E.then?(await E)():E;let N=new n.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/webhooks/twilio/voice-ai/route",pathname:"/api/webhooks/twilio/voice-ai",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/webhooks/twilio/voice-ai/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:S,workUnitAsyncStorage:T,serverHooks:I}=N;function x(){return(0,r.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:T})}async function b(e,t,a){N.isDev&&(0,i.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let n="/api/webhooks/twilio/voice-ai/route";n=n.replace(/\/index$/,"")||"/";let r=await N.prepare(e,t,{srcPage:n,multiZoneDraftMode:!1});if(!r)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:C,params:E,nextConfig:x,parsedUrl:b,isDraftMode:S,prerenderManifest:T,routerServerContext:I,isOnDemandRevalidate:A,revalidateOnlyGenerated:O,resolvedPathname:P,clientReferenceManifest:k,serverActionsManifest:U}=r,D=(0,c.normalizeAppPath)(n),M=!!(T.dynamicRoutes[D]||T.routes[P]),_=async()=>((null==I?void 0:I.render404)?await I.render404(e,t,b,!1):t.end("This page could not be found"),null);if(M&&!S){let e=!!T.routes[P],t=T.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(x.experimental.adapterPath)return await _();throw new R.NoFallbackError}}let q=null;!M||N.isDev||S||(q=P,q="/index"===q?"/":q);let H=!0===N.isDev||!M,F=M&&!H;U&&k&&(0,l.setReferenceManifestsSingleton)({page:n,clientReferenceManifest:k,serverActionsManifest:U,serverModuleMap:(0,d.createServerModuleMap)({serverActionsManifest:U})});let L=e.method||"GET",$=(0,s.getTracer)(),B=$.getActiveScopeSpan(),j={params:E,prerenderManifest:T,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,i.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:x.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,n)=>N.onRequestError(e,t,n,I)},sharedContext:{buildId:C}},K=new u.NodeNextRequest(e),G=new u.NodeNextResponse(t),V=p.NextRequestAdapter.fromNodeNextRequest(K,(0,p.signalFromNodeResponse)(t));try{let r=async e=>N.handle(V,j).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=$.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==h.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let o=a.get("next.route");if(o){let t=`${L} ${o}`;e.setAttributes({"next.route":o,"http.route":o,"next.span_name":t}),e.updateName(t)}else e.updateName(`${L} ${n}`)}),l=!!(0,i.getRequestMeta)(e,"minimalMode"),d=async i=>{var s,d;let c=async({previousCacheEntry:o})=>{try{if(!l&&A&&O&&!o)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await r(i);e.fetchMetrics=j.renderOpts.fetchMetrics;let s=j.renderOpts.pendingWaitUntil;s&&a.waitUntil&&(a.waitUntil(s),s=void 0);let d=j.renderOpts.collectedTags;if(!M)return await (0,y.sendResponse)(K,G,n,j.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(n.headers);d&&(t[v.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==j.renderOpts.collectedRevalidate&&!(j.renderOpts.collectedRevalidate>=v.INFINITE_CACHE)&&j.renderOpts.collectedRevalidate,o=void 0===j.renderOpts.collectedExpire||j.renderOpts.collectedExpire>=v.INFINITE_CACHE?void 0:j.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:o}}}}catch(t){throw(null==o?void 0:o.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:n,routeType:"route",revalidateReason:(0,m.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:A})},I),t}},u=await N.handleResponse({req:e,nextConfig:x,cacheKey:q,routeKind:o.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:O,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:l});if(!M)return null;if((null==u||null==(s=u.value)?void 0:s.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(d=u.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});l||t.setHeader("x-nextjs-cache",A?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),S&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let p=(0,f.fromNodeOutgoingHttpHeaders)(u.value.headers);return l&&M||p.delete(v.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||p.get("Cache-Control")||p.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,y.sendResponse)(K,G,new Response(u.value.body,{headers:p,status:u.value.status||200})),null};B?await d(B):await $.withPropagatedContext(e.headers,()=>$.trace(h.BaseServerSpan.handleRequest,{spanName:`${L} ${n}`,kind:s.SpanKind.SERVER,attributes:{"http.method":L,"http.target":e.url}},d))}catch(t){if(t instanceof R.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,m.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:A})}),M)throw t;return await (0,y.sendResponse)(K,G,new Response(null,{status:500})),null}}e.s(["handler",()=>b,"patchFetch",()=>x,"routeModule",()=>N,"serverHooks",()=>I,"workAsyncStorage",()=>S,"workUnitAsyncStorage",()=>T]),a()}catch(e){a(e)}},!1)];

//# sourceMappingURL=_6bbca3cc._.js.map