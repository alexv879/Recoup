# Troubleshooting Guide

Common issues and their solutions when developing or deploying Recoup.

## Table of Contents
- [Development Issues](#development-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Authentication Issues](#authentication-issues)
- [Database Issues](#database-issues)
- [API & Integration Issues](#api--integration-issues)
- [Performance Issues](#performance-issues)
- [Production Issues](#production-issues)

---

## Development Issues

### Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use a different port:**
   ```bash
   PORT=3001 npm run dev
   ```

3. **Check for zombie processes:**
   ```bash
   # Kill all node processes
   pkill -9 node
   ```

---

### Module Not Found Errors

**Error:**
```
Module not found: Can't resolve '@/lib/firebase-admin'
```

**Solutions:**

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   ```

2. **Check TypeScript paths:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

3. **Restart TypeScript server in VS Code:**
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

---

### Hot Reload Not Working

**Issue:** Changes not reflecting in browser

**Solutions:**

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Disable browser cache:**
   - Open DevTools → Network tab
   - Check "Disable cache"

3. **Check file watcher limits (Linux):**
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

4. **Try hard refresh:**
   - Cmd/Ctrl + Shift + R

---

### TypeScript Errors Not Showing

**Issue:** VS Code not showing TypeScript errors

**Solutions:**

1. **Check TypeScript version:**
   ```bash
   # Should match version in package.json
   npx tsc --version
   ```

2. **Select correct TypeScript version in VS Code:**
   - Open any .ts file
   - Bottom right corner → Click TypeScript version
   - Select "Use Workspace Version"

3. **Restart TS Server:**
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

---

### Environment Variables Not Loading

**Issue:** `process.env.MY_VAR` is undefined

**Solutions:**

1. **Check file name:**
   - Must be `.env.local` not `.env`
   - Must be in the `relay/` directory

2. **Restart dev server:**
   ```bash
   # Environment variables are loaded on server start
   npm run dev
   ```

3. **Check variable prefix:**
   ```bash
   # Client-side variables need NEXT_PUBLIC_ prefix
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Verify file is not gitignored:**
   ```bash
   git check-ignore .env.local
   # Should return nothing if file is tracked
   ```

---

## Build & Deployment Issues

### Build Fails with Memory Error

**Error:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node memory:**
   ```bash
   # package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

2. **On Vercel, upgrade plan** (Pro plan has more memory)

3. **Reduce bundle size:**
   ```bash
   # Analyze bundle
   npm run build
   npx @next/bundle-analyzer
   ```

---

### Vercel Build Fails

**Error:**
```
Error: Command "npm run build" exited with 1
```

**Solutions:**

1. **Check build logs in Vercel dashboard**

2. **Test build locally:**
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Check environment variables:**
   - All required variables set in Vercel dashboard
   - No typos in variable names

4. **Check Node version:**
   ```json
   // package.json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

5. **Clear Vercel cache:**
   - Settings → General → Clear Cache

---

### Deployment Succeeds but Site Broken

**Issue:** Build succeeds but site shows 500 error

**Solutions:**

1. **Check Vercel function logs:**
   - Dashboard → Project → Logs
   - Filter by "Errors"

2. **Check Sentry for errors:**
   - Go to Sentry dashboard
   - Look for recent errors

3. **Verify environment variables:**
   - Missing variables will cause runtime errors
   - Check all required vars are set

4. **Test production build locally:**
   ```bash
   npm run build
   npm start
   ```

---

## Authentication Issues

### Clerk Authentication Failing

**Error:**
```
ClerkError: Invalid Clerk publishable key
```

**Solutions:**

1. **Check environment variables:**
   ```bash
   # .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

2. **Verify keys are for correct environment:**
   - Development: `pk_test_` and `sk_test_`
   - Production: `pk_live_` and `sk_live_`

3. **Check Clerk middleware:**
   ```typescript
   // middleware.ts
   import { clerkMiddleware } from '@clerk/nextjs/server';

   export default clerkMiddleware();

   export const config = {
     matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
   };
   ```

4. **Clear browser cookies:**
   - Clerk stores session in cookies
   - Clear cookies and try again

---

### User Not Authenticated After Sign In

**Issue:** `auth()` returns null after successful sign in

**Solutions:**

1. **Check redirect URLs in Clerk:**
   - Dashboard → Paths
   - After sign in: `/dashboard`
   - After sign up: `/dashboard`

2. **Verify middleware is running:**
   ```typescript
   // middleware.ts should be in root directory
   export default clerkMiddleware();
   ```

3. **Check protected routes:**
   ```typescript
   // Use auth() in server components/API routes
   import { auth } from '@clerk/nextjs/server';

   export default async function Page() {
     const { userId } = await auth();
     if (!userId) redirect('/sign-in');
     // ...
   }
   ```

---

### Webhook Signature Verification Failing

**Error:**
```
Webhook signature verification failed
```

**Solutions:**

1. **Check webhook secret:**
   ```bash
   # .env.local
   CLERK_WEBHOOK_SECRET=whsec_xxxxx
   ```

2. **Get correct secret from Clerk:**
   - Dashboard → Webhooks → Your endpoint
   - Copy "Signing Secret"

3. **Verify endpoint URL:**
   - Should match exactly: `https://yourdomain.com/api/webhooks/clerk`
   - No trailing slash

4. **Test with Clerk CLI:**
   ```bash
   clerk listen --forward-to localhost:3000/api/webhooks/clerk
   ```

---

## Database Issues

### Firestore Permission Denied

**Error:**
```
FirebaseError: Missing or insufficient permissions
```

**Solutions:**

1. **Check authentication:**
   ```typescript
   const { userId } = await auth();
   if (!userId) {
     throw new Error('Not authenticated');
   }
   ```

2. **Check security rules:**
   ```javascript
   // firestore.rules
   match /invoices/{invoiceId} {
     allow read, write: if request.auth.uid == resource.data.userId;
   }
   ```

3. **Verify userId in query:**
   ```typescript
   // Always filter by userId
   const invoices = await db
     .collection('invoices')
     .where('userId', '==', userId)  // Required!
     .get();
   ```

4. **Check test mode vs production mode:**
   - Test mode: Open to all (development only)
   - Production mode: Requires security rules

---

### Firestore Query Returns Empty

**Issue:** Query returns no results despite data existing

**Solutions:**

1. **Check indexes:**
   - Error message will say "requires an index"
   - Click the link to create index
   - Or deploy indexes: `firebase deploy --only firestore:indexes`

2. **Verify query matches data:**
   ```typescript
   // Check exact field names and values
   const snapshot = await db.collection('invoices')
     .where('userId', '==', userId)
     .where('status', '==', 'overdue')  // Must match exactly
     .get();
   ```

3. **Check Firestore emulator:**
   ```bash
   # If using emulator, check data at:
   # http://localhost:4000/firestore
   ```

4. **Use console.log to debug:**
   ```typescript
   const snapshot = await db.collection('invoices').get();
   console.log('Total docs:', snapshot.size);
   snapshot.forEach(doc => console.log(doc.id, doc.data()));
   ```

---

### Firebase Admin Initialization Error

**Error:**
```
Error: Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token
```

**Solutions:**

1. **Check environment variables:**
   ```bash
   FIREBASE_PROJECT_ID=your-project
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key\n-----END PRIVATE KEY-----\n"
   ```

2. **Verify private key format:**
   - Must be wrapped in double quotes
   - Must contain `\n` for newlines
   - Don't remove or modify the newlines

3. **Download new service account key:**
   - Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Replace environment variables

4. **Check for extra whitespace:**
   ```bash
   # Remove any trailing spaces or newlines
   ```

---

## API & Integration Issues

### Stripe Webhook Not Triggering

**Issue:** Stripe events not being received

**Solutions:**

1. **Check webhook URL:**
   - Stripe Dashboard → Developers → Webhooks
   - URL: `https://yourdomain.com/api/webhook/stripe`
   - Should show "Succeeded" status

2. **Verify webhook secret:**
   ```bash
   # .env.local
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

3. **Test locally with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   stripe trigger payment_intent.succeeded
   ```

4. **Check logs in Stripe Dashboard:**
   - Webhooks → Select endpoint → Recent deliveries
   - View request and response

5. **Verify signature:**
   ```typescript
   import Stripe from 'stripe';

   const sig = req.headers.get('stripe-signature');
   const event = stripe.webhooks.constructEvent(
     body,
     sig,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

---

### SendGrid Emails Not Sending

**Issue:** Emails not being delivered

**Solutions:**

1. **Check API key:**
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

2. **Verify sender email:**
   - SendGrid → Settings → Sender Authentication
   - Email must be verified

3. **Check email logs:**
   - SendGrid Dashboard → Activity
   - Look for bounces, blocks, or drops

4. **Test with simple email:**
   ```typescript
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   await sgMail.send({
     to: 'test@example.com',
     from: 'verified@yourdomain.com',
     subject: 'Test',
     text: 'Test email',
   });
   ```

5. **Check spam folder** (obvious but often forgotten!)

---

### Twilio SMS Not Sending

**Error:**
```
TwilioError: Unable to create record: The 'To' number is not a valid phone number
```

**Solutions:**

1. **Verify phone number format (E.164):**
   ```typescript
   // ✅ Correct
   "+447700900123"

   // ❌ Wrong
   "07700900123"
   "447700900123"
   ```

2. **Check Twilio credentials:**
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Verify phone number is purchased:**
   - Twilio Dashboard → Phone Numbers
   - Number should be active

4. **Check trial account restrictions:**
   - Trial accounts can only send to verified numbers
   - Upgrade to send to any number

5. **Test with Twilio Console:**
   - Dashboard → Try it out → Send an SMS

---

### OpenAI API Rate Limit

**Error:**
```
OpenAIError: Rate limit exceeded
```

**Solutions:**

1. **Check quota:**
   - OpenAI Dashboard → Usage
   - View current usage and limits

2. **Implement exponential backoff:**
   ```typescript
   async function transcribeWithRetry(audio: Buffer, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await openai.audio.transcriptions.create({
           file: audio,
           model: 'gpt-4o-mini-transcribe',
         });
       } catch (error) {
         if (error.status === 429 && i < maxRetries - 1) {
           await new Promise(r => setTimeout(r, 2 ** i * 1000));
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Upgrade OpenAI plan** for higher limits

4. **Add rate limiting:**
   ```typescript
   import { rateLimit } from '@/lib/rate-limit';

   const { success } = await rateLimit.ai(userId);
   if (!success) {
     throw new Error('Rate limit exceeded');
   }
   ```

---

## Performance Issues

### Slow Page Load

**Issue:** Pages taking >3 seconds to load

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build
   # Look for large bundles (>100kb)
   ```

2. **Implement code splitting:**
   ```typescript
   // Use dynamic imports
   import dynamic from 'next/dynamic';

   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Spinner />,
   });
   ```

3. **Optimize images:**
   ```tsx
   import Image from 'next/image';

   <Image
     src="/invoice.png"
     width={500}
     height={300}
     alt="Invoice"
     loading="lazy"
   />
   ```

4. **Check database queries:**
   ```typescript
   // Add .limit() to queries
   const invoices = await db
     .collection('invoices')
     .where('userId', '==', userId)
     .limit(20)  // Don't fetch all invoices!
     .get();
   ```

5. **Use Vercel Analytics:**
   - Dashboard → Analytics → Web Vitals
   - Identify slow pages

---

### High Memory Usage

**Issue:** Node process using excessive memory

**Solutions:**

1. **Check for memory leaks:**
   ```bash
   node --inspect npm run dev
   # Use Chrome DevTools Memory Profiler
   ```

2. **Limit data fetching:**
   ```typescript
   // Don't load entire collections into memory
   const snapshot = await db.collection('invoices')
     .where('userId', '==', userId)
     .limit(100)
     .get();
   ```

3. **Use streaming for large responses:**
   ```typescript
   // For CSV export
   return new Response(
     createReadStream('export.csv'),
     {
       headers: {
         'Content-Type': 'text/csv',
       },
     }
   );
   ```

4. **Increase Node memory limit:**
   ```bash
   NODE_OPTIONS='--max-old-space-size=4096' npm run dev
   ```

---

### Slow API Responses

**Issue:** API routes taking >1 second

**Solutions:**

1. **Add caching:**
   ```typescript
   import { redis } from '@/lib/redis';

   const cached = await redis.get(`user:${userId}:stats`);
   if (cached) return JSON.parse(cached);

   const stats = await calculateStats(userId);
   await redis.set(`user:${userId}:stats`, JSON.stringify(stats), 'EX', 3600);
   return stats;
   ```

2. **Optimize database queries:**
   ```typescript
   // Use select() to fetch only needed fields
   const invoices = await db.collection('invoices')
     .where('userId', '==', userId)
     .select('id', 'amount', 'status')  // Don't fetch everything!
     .get();
   ```

3. **Parallel requests:**
   ```typescript
   // Use Promise.all for independent queries
   const [invoices, clients, stats] = await Promise.all([
     getInvoices(userId),
     getClients(userId),
     getStats(userId),
   ]);
   ```

4. **Add indexes:**
   - Check Firestore console for index suggestions
   - Deploy missing indexes

---

## Production Issues

### 500 Internal Server Error

**Error:** Generic 500 error in production

**Solutions:**

1. **Check Vercel function logs:**
   - Dashboard → Project → Logs
   - Filter by "Errors"

2. **Check Sentry:**
   - Sentry dashboard should capture all errors
   - Look for stack traces

3. **Enable verbose logging:**
   ```typescript
   console.error('Error details:', {
     userId,
     error: error.message,
     stack: error.stack,
   });
   ```

4. **Check environment variables:**
   - Missing env vars cause runtime errors
   - Verify all required vars are set in Vercel

5. **Test with production build locally:**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

---

### Cron Jobs Not Running

**Issue:** Scheduled jobs not executing

**Solutions:**

1. **Check Vercel Cron configuration:**
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/my-job",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

2. **Verify cron secret:**
   ```typescript
   const authHeader = req.headers.get('authorization');
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

3. **Check execution logs:**
   - Vercel Dashboard → Project → Cron
   - View logs for each execution

4. **Test cron endpoint manually:**
   ```bash
   curl -X POST https://yourdomain.com/api/cron/my-job \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

5. **Verify timezone:**
   - Vercel Cron uses UTC
   - Adjust schedule accordingly

---

### High Function Execution Time

**Issue:** Vercel functions timing out (10s limit on Hobby, 60s on Pro)

**Solutions:**

1. **Optimize slow operations:**
   - Move to background jobs
   - Use caching
   - Reduce database queries

2. **Upgrade to Pro plan** (60s timeout)

3. **Split into multiple functions:**
   ```typescript
   // Instead of one big function
   // Split into smaller functions
   async function processBatch(items: any[]) {
     const chunks = chunkArray(items, 10);
     for (const chunk of chunks) {
       await processChunk(chunk);
     }
   }
   ```

4. **Use Edge Functions for fast responses:**
   ```typescript
   export const runtime = 'edge';

   export async function GET() {
     // Fast edge function
   }
   ```

---

### Database Connection Limit Reached

**Error:**
```
Firestore: Too many concurrent requests
```

**Solutions:**

1. **Implement connection pooling:**
   ```typescript
   // Use singleton pattern for Firebase Admin
   let adminInstance: admin.app.App;

   export function getFirebaseAdmin() {
     if (!adminInstance) {
       adminInstance = admin.initializeApp({...});
     }
     return adminInstance;
   }
   ```

2. **Add rate limiting:**
   ```typescript
   import { rateLimit } from '@/lib/rate-limit';

   await rateLimit.general(userId);
   ```

3. **Batch operations:**
   ```typescript
   // Instead of individual writes
   const batch = db.batch();
   invoices.forEach(invoice => {
     batch.set(db.collection('invoices').doc(), invoice);
   });
   await batch.commit();
   ```

4. **Upgrade Firebase plan** for higher limits

---

## Getting Additional Help

### Check Logs

1. **Vercel Logs:**
   - Dashboard → Project → Logs
   - Filter by errors, warnings

2. **Sentry:**
   - Detailed error tracking with stack traces

3. **Browser Console:**
   - F12 → Console
   - Check for client-side errors

4. **Network Tab:**
   - F12 → Network
   - Check failed requests

### Documentation Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Community Support

- [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
- [Firebase Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Clerk Discord](https://clerk.com/discord)
- [Vercel Discord](https://vercel.com/discord)

### Contact

For Recoup-specific issues:
- GitHub Issues: https://github.com/alexv879/Recoup/issues
- Email: support@relaysoftware.co.uk

---

**Pro Tip:** When reporting issues, always include:
- Error message (full text)
- Steps to reproduce
- Expected vs actual behavior
- Environment (development/production)
- Relevant code snippets
- Screenshots if UI-related
