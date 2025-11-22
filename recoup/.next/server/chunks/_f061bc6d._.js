module.exports=[662035,e=>e.a(async(t,i)=>{try{var n=e.i(89171),a=e.i(229822),o=e.i(868253),r=e.i(598941),l=e.i(340688),s=e.i(15776),d=e.i(169907),p=t([a,o,r]);async function c(e){try{let{invoiceId:t,paymentMethod:i,evidenceUrl:a,evidenceFileName:r}=await e.json();if(!t||!i)throw new s.BadRequestError("Missing required fields");let p=await o.db.collection("invoices").doc(t).get();if(!p.exists)throw new s.NotFoundError("Invoice not found");let c=p.data();if(!c)throw new s.NotFoundError("Invoice not found");let g=`claim_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,h=new Date;h.setHours(h.getHours()+48);let f={id:g,invoiceId:t,claimantEmail:c.clientEmail||"",claimantName:c.clientName||"",amount:c.totalAmount||0,paymentMethod:i,evidenceUrl:a||null,evidenceFileName:r||null,claimedAt:new Date().toISOString(),status:"pending",verificationDeadline:h.toISOString(),createdAt:new Date().toISOString()};return await o.db.collection("paymentClaims").doc(g).set(f),await o.db.collection("invoices").doc(t).update({paymentClaimStatus:"pending_verification",paymentClaimId:g,collectionsPaused:!0,collectionsPausedUntil:h.toISOString(),updatedAt:new Date().toISOString()}),await u({freelancerEmail:c.freelancerEmail||"",freelancerName:c.freelancerName||"there",claimantName:f.claimantName,invoiceNumber:c.invoiceNumber||t,amount:f.amount,paymentMethod:i,hasEvidence:!!a,verificationUrl:`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections/verify/${g}`}),await m({clientEmail:f.claimantEmail,clientName:f.claimantName,invoiceNumber:c.invoiceNumber||t,amount:f.amount,verificationDeadline:h}),(0,l.trackEvent)("payment_claim_submitted",{claim_id:g,invoice_id:t,paymentMethod:i,hasEvidence:!!a,amount:f.amount}),(0,d.logInfo)("Payment claim created",{claimId:g,invoiceId:t,paymentMethod:i}),n.NextResponse.json({success:!0,claimId:g,verificationDeadline:h,message:"Payment claim submitted successfully. Verification pending."})}catch(i){(0,d.logError)("Payment claim creation failed",i);let{status:e,body:t}=await (0,s.handleApiError)(i);return n.NextResponse.json(t,{status:e})}}async function u(e){let{freelancerEmail:t,freelancerName:i,claimantName:n,invoiceNumber:a,amount:o,paymentMethod:l,hasEvidence:s,verificationUrl:d}=e,p=`🔔 Payment claim for Invoice ${a} - ${n}`,c=`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💰 Payment Claim Received</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px;">Hi <strong>${i}</strong>,</p>

    <p>
      <strong>${n}</strong> has claimed they've paid invoice <strong>${a}</strong>
      for <strong>\xa3${o.toFixed(2)}</strong>.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Claim Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${l.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Proof of Payment</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">
            ${s?"✅ Provided":"❌ Not provided"}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Verification Deadline</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px; color: #dc2626;">
            48 hours
          </td>
        </tr>
      </table>
    </div>

    ${!s?`
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 24px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          ⚠️ <strong>No proof of payment was provided.</strong> You can request evidence before verifying.
        </p>
      </div>
    `:""}

    <h3 style="font-size: 16px; margin: 24px 0 12px 0;">What happens next?</h3>
    <p style="font-size: 14px; color: #6b7280;">
      Collections have been paused for this invoice. Please verify the claim within 48 hours:
    </p>

    <ul style="font-size: 14px; color: #6b7280; line-height: 1.8;">
      <li><strong>Confirm Payment:</strong> Mark invoice as paid</li>
      <li><strong>Request Evidence:</strong> Ask for proof of payment</li>
      <li><strong>Reject Claim:</strong> Resume collections if payment not received</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${d}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Verify Payment →
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
      If you don't verify within 48 hours, collections will automatically resume.
    </p>

  </div>

  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      Powered by <a href="https://relay.app" style="color: #667eea; text-decoration: none;">Relay</a>
    </p>
  </div>

</body>
</html>`;await (0,r.sendEmail)({to:t,from:{email:process.env.SENDGRID_FROM_EMAIL,name:"Relay Collections"},subject:p,html:c})}async function m(e){let{clientEmail:t,clientName:i,invoiceNumber:n,amount:a,verificationDeadline:o}=e,l=`✅ Payment claim received for Invoice ${n}`,s=`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Payment Claim Received</h1>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="font-size: 16px;">Hi <strong>${i}</strong>,</p>

    <p>
      Thank you for claiming payment on invoice <strong>${n}</strong> for <strong>\xa3${a.toFixed(2)}</strong>.
    </p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Collections have been paused</strong> while we verify your payment. You will not receive
        any further collection reminders for this invoice during the verification period.
      </p>
    </div>

    <h3 style="font-size: 16px; margin: 24px 0 12px 0;">What happens next?</h3>
    <p style="font-size: 14px; color: #6b7280;">
      Your payment claim will be verified within <strong>48 hours</strong> (by ${o.toLocaleString()}).
      You'll receive an email once the claim is verified.
    </p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">Possible Outcomes:</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
        <li><strong>Payment Confirmed:</strong> Invoice marked as paid, collections ended</li>
        <li><strong>Evidence Requested:</strong> We may ask for proof of payment</li>
        <li><strong>Claim Rejected:</strong> Payment not received, collections resume</li>
      </ul>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions, please contact us or reply to this email.
    </p>

  </div>

  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      Powered by <a href="https://relay.app" style="color: #667eea; text-decoration: none;">Relay</a>
    </p>
  </div>

</body>
</html>`;await (0,r.sendEmail)({to:t,from:{email:process.env.SENDGRID_FROM_EMAIL,name:"Relay"},subject:l,html:s})}[a,o,r]=p.then?(await p)():p,e.s(["POST",()=>c,"dynamic",0,"force-dynamic"]),i()}catch(e){i(e)}},!1),611113,e=>e.a(async(t,i)=>{try{var n=e.i(747909),a=e.i(174017),o=e.i(996250),r=e.i(759756),l=e.i(561916),s=e.i(114444),d=e.i(837092),p=e.i(869741),c=e.i(316795),u=e.i(487718),m=e.i(995169),g=e.i(47587),h=e.i(666012),f=e.i(570101),y=e.i(626937),x=e.i(10372),v=e.i(193695);e.i(52474);var b=e.i(600220),w=e.i(662035),R=t([w]);[w]=R.then?(await R)():R;let P=new n.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/payment-verification/claim/route",pathname:"/api/payment-verification/claim",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/payment-verification/claim/route.ts",nextConfigOutput:"",userland:w}),{workAsyncStorage:N,workUnitAsyncStorage:S,serverHooks:A}=P;function E(){return(0,o.patchFetch)({workAsyncStorage:N,workUnitAsyncStorage:S})}async function C(e,t,i){P.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let n="/api/payment-verification/claim/route";n=n.replace(/\/index$/,"")||"/";let o=await P.prepare(e,t,{srcPage:n,multiZoneDraftMode:!1});if(!o)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:w,params:R,nextConfig:E,parsedUrl:C,isDraftMode:N,prerenderManifest:S,routerServerContext:A,isOnDemandRevalidate:I,revalidateOnlyGenerated:_,resolvedPathname:O,clientReferenceManifest:k,serverActionsManifest:T}=o,$=(0,p.normalizeAppPath)(n),D=!!(S.dynamicRoutes[$]||S.routes[O]),z=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,C,!1):t.end("This page could not be found"),null);if(D&&!N){let e=!!S.routes[O],t=S.dynamicRoutes[$];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await z();throw new v.NoFallbackError}}let M=null;!D||P.isDev||N||(M=O,M="/index"===M?"/":M);let U=!0===P.isDev||!D,H=D&&!U;T&&k&&(0,s.setReferenceManifestsSingleton)({page:n,clientReferenceManifest:k,serverActionsManifest:T,serverModuleMap:(0,d.createServerModuleMap)({serverActionsManifest:T})});let q=e.method||"GET",F=(0,l.getTracer)(),j=F.getActiveScopeSpan(),L={params:R,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,r.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,i,n)=>P.onRequestError(e,t,n,A)},sharedContext:{buildId:w}},B=new c.NodeNextRequest(e),K=new c.NodeNextResponse(t),V=u.NextRequestAdapter.fromNodeNextRequest(B,(0,u.signalFromNodeResponse)(t));try{let o=async e=>P.handle(V,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let i=F.getRootSpanAttributes();if(!i)return;if(i.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${i.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=i.get("next.route");if(a){let t=`${q} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${n}`)}),s=!!(0,r.getRequestMeta)(e,"minimalMode"),d=async r=>{var l,d;let p=async({previousCacheEntry:a})=>{try{if(!s&&I&&_&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await o(r);e.fetchMetrics=L.renderOpts.fetchMetrics;let l=L.renderOpts.pendingWaitUntil;l&&i.waitUntil&&(i.waitUntil(l),l=void 0);let d=L.renderOpts.collectedTags;if(!D)return await (0,h.sendResponse)(B,K,n,L.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(n.headers);d&&(t[x.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let i=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=x.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,a=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=x.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:b.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:i,expire:a}}}}catch(t){throw(null==a?void 0:a.isStale)&&await P.onRequestError(e,t,{routerKind:"App Router",routePath:n,routeType:"route",revalidateReason:(0,g.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:I})},A),t}},c=await P.handleResponse({req:e,nextConfig:E,cacheKey:M,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:_,responseGenerator:p,waitUntil:i.waitUntil,isMinimalMode:s});if(!D)return null;if((null==c||null==(l=c.value)?void 0:l.kind)!==b.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(d=c.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",I?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,f.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&D||u.delete(x.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,y.getCacheControlHeader)(c.cacheControl)),await (0,h.sendResponse)(B,K,new Response(c.value.body,{headers:u,status:c.value.status||200})),null};j?await d(j):await F.withPropagatedContext(e.headers,()=>F.trace(m.BaseServerSpan.handleRequest,{spanName:`${q} ${n}`,kind:l.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},d))}catch(t){if(t instanceof v.NoFallbackError||await P.onRequestError(e,t,{routerKind:"App Router",routePath:$,routeType:"route",revalidateReason:(0,g.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:I})}),D)throw t;return await (0,h.sendResponse)(B,K,new Response(null,{status:500})),null}}e.s(["handler",()=>C,"patchFetch",()=>E,"routeModule",()=>P,"serverHooks",()=>A,"workAsyncStorage",()=>N,"workUnitAsyncStorage",()=>S]),i()}catch(e){i(e)}},!1)];

//# sourceMappingURL=_f061bc6d._.js.map