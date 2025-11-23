# Firestore Deployment Guide

**Purpose**: Deploy Firestore security rules and database indexes to production

**Task 1.4 - Production Readiness Refactoring**

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase**:
   ```bash
   firebase login
   ```

3. **Project configured**:
   ```bash
   firebase use --add
   # Select your Firebase project from the list
   # Choose an alias (e.g., "production", "staging")
   ```

4. **Verify current project**:
   ```bash
   firebase projects:list
   firebase use
   ```

---

## 🔒 Part 1: Deploy Security Rules

### Step 1: Review Security Rules

**File**: `firestore.rules` (380 lines)

**Key Protections**:
- ✅ Default deny-all for unknown collections
- ✅ User data isolation (users can only read/write their own data)
- ✅ Server-only collections (transactions, webhooks, events)
- ✅ Client read-only access to their own invoices
- ✅ SMS opt-out compliance (server-only writes)

**Review checklist**:
```bash
# Check syntax
firebase deploy --only firestore:rules --dry-run

# View current rules (before deployment)
firebase firestore:rules
```

### Step 2: Test Rules Locally (RECOMMENDED)

**Option A: Firebase Emulator Suite**

```bash
# Start emulators
firebase emulators:start

# In another terminal, run your tests
npm test
```

**Option B: Manual Testing**

Create a test file `test-firestore-rules.js`:

```javascript
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'recoup-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('User can read their own data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(alice.firestore().collection('users').doc('alice').get());
  });

  test('User cannot read other users data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(alice.firestore().collection('users').doc('bob').get());
  });
});
```

Run tests:
```bash
npm test -- test-firestore-rules.js
```

### Step 3: Deploy Rules to Production

**⚠️ CRITICAL: This will affect live production data access!**

```bash
# Dry run first (recommended)
firebase deploy --only firestore:rules --dry-run

# Deploy to production
firebase deploy --only firestore:rules
```

**Expected output**:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/recoup-prod/firestore/rules
```

### Step 4: Verify Rules Deployment

1. **Firebase Console**: Visit the [Firestore Rules tab](https://console.firebase.google.com/project/recoup-prod/firestore/rules)
2. **Check publish date**: Ensure it matches your deployment timestamp
3. **Test access**: Try accessing Firestore from your app to ensure nothing broke

**Quick verification test**:
```bash
# Should succeed (authenticated user reading own data)
curl -H "Authorization: Bearer $USER_TOKEN" \
  https://firestore.googleapis.com/v1/projects/recoup-prod/databases/(default)/documents/users/$USER_ID

# Should fail with 403 (unauthenticated)
curl https://firestore.googleapis.com/v1/projects/recoup-prod/databases/(default)/documents/users/test
```

---

## 📊 Part 2: Deploy Database Indexes

### Step 1: Review Indexes

**File**: `firestore.indexes.json` (447 lines)

**Critical indexes for Pricing V3**:
- `(subscriptionTier, collectionsEnabled, status)` - Dashboard filtering
- `(freelancerId, subscriptionTier, status)` - User tier queries
- `(status, dueDate ASC)` - Overdue invoice scanning

**Review current indexes**:
```bash
# List indexes
firebase firestore:indexes

# Check index file syntax
cat firestore.indexes.json | jq .
```

### Step 2: Deploy Indexes

**Note**: Index creation is **non-destructive** and takes time (5-60 minutes for large collections)

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**Expected output**:
```
i  firestore: reading indexes from firestore.indexes.json...
✔  firestore: deployed indexes in firestore.indexes.json successfully

Indexes:
[CREATE] https://console.firebase.google.com/project/recoup-prod/firestore/indexes?create_composite=...
```

### Step 3: Monitor Index Building

**Firebase Console**: Visit [Firestore Indexes tab](https://console.firebase.google.com/project/recoup-prod/firestore/indexes)

**Index states**:
- 🟡 **Building**: Index is being created (can take 5-60 minutes)
- 🟢 **Enabled**: Index is live and serving queries
- 🔴 **Error**: Index creation failed (check console for details)

**Check index status via CLI**:
```bash
firebase firestore:indexes --project recoup-prod

# Example output:
# ┌───────────┬────────────────┬────────────┬────────────────────────────┬───────────┐
# │ Name      │ Collection     │ State      │ Fields                      │ Type      │
# ├───────────┼────────────────┼────────────┼────────────────────────────┼───────────┤
# │ index_1   │ invoices       │ ENABLED    │ freelancerId, status        │ COMPOSITE │
# │ index_2   │ invoices       │ BUILDING   │ status, dueDate             │ COMPOSITE │
# └───────────┴────────────────┴────────────┴────────────────────────────┴───────────┘
```

### Step 4: Verify Indexes Are Working

**Test a query that requires an index**:

```typescript
// This query requires composite index: (freelancerId, status, dueDate)
const overdueInvoices = await db
  .collection('invoices')
  .where('freelancerId', '==', userId)
  .where('status', '==', 'overdue')
  .orderBy('dueDate', 'asc')
  .get();
```

**Expected behavior**:
- ✅ **Before index**: Query throws error "requires an index"
- ✅ **While building**: Query may be slow or fail
- ✅ **After index enabled**: Query returns results quickly

---

## 🚨 Rollback Procedures

### Rollback Security Rules

If rules break production:

1. **Quick fix**: Restore previous rules from Firebase Console
   - Go to [Firestore Rules](https://console.firebase.google.com/project/recoup-prod/firestore/rules)
   - Click "View History"
   - Select previous version
   - Click "Publish"

2. **CLI rollback**:
   ```bash
   # Get previous rules from git
   git checkout HEAD~1 firestore.rules

   # Deploy old rules
   firebase deploy --only firestore:rules

   # Restore current file
   git checkout - firestore.rules
   ```

### Rollback Indexes

**Note**: You cannot "rollback" indexes, but you can delete problematic ones.

```bash
# Delete a specific index
firebase firestore:indexes:delete <index-name>

# Or via Firebase Console
# Go to Indexes tab → Click trash icon next to index
```

---

## 📝 Post-Deployment Checklist

After deploying both rules and indexes:

- [ ] **Security Rules**
  - [ ] Published successfully
  - [ ] Timestamp matches deployment time
  - [ ] App can still read/write data correctly
  - [ ] Unauthorized access is blocked
  - [ ] No spike in 403 errors in logs

- [ ] **Indexes**
  - [ ] All indexes show "ENABLED" status (after build completes)
  - [ ] No "requires an index" errors in logs
  - [ ] Query performance is acceptable
  - [ ] Dashboard loads quickly

- [ ] **Monitoring**
  - [ ] Check Sentry for new errors
  - [ ] Review Firebase Firestore usage metrics
  - [ ] Monitor query costs (should decrease with good indexes)

---

## 🔧 Troubleshooting

### Problem: "Permission denied" errors after deploying rules

**Cause**: Rules are too restrictive or app code doesn't match new structure

**Solution**:
1. Check Firebase Console → Firestore → Rules → Simulator
2. Test the failing query with user's auth token
3. Adjust rules or app code as needed

### Problem: "The query requires an index" error

**Cause**: Index not yet built or missing from `firestore.indexes.json`

**Solution**:
1. Check index status: `firebase firestore:indexes`
2. If "BUILDING", wait for completion (check console)
3. If missing, click the error link to auto-generate index config
4. Add to `firestore.indexes.json` and redeploy

### Problem: Index building stuck at 0%

**Cause**: Large collection or Firebase infrastructure issue

**Solution**:
1. Wait up to 24 hours (large collections can take time)
2. Delete and recreate index if stuck > 24h
3. Contact Firebase support if persistent

---

## 🎯 Best Practices

### Security Rules

1. **Test first**: Always use emulators or test environment before production
2. **Review changes**: Have another developer review rule changes
3. **Document exceptions**: Add comments explaining why rules allow certain access
4. **Monitor logs**: Check for spikes in permission errors after deployment

### Indexes

1. **Start small**: Create indexes incrementally, not all at once
2. **Monitor costs**: Indexes increase storage costs (~1.5x per index)
3. **Delete unused**: Remove indexes for queries you no longer run
4. **Use field exemptions**: Mark fields you'll never query on as excluded

---

## 📚 Additional Resources

- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Index Best Practices](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)

---

## 🔐 Environment Variables Required

Ensure these are set in your deployment environment:

```bash
# Firebase Project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=recoup-prod
FIREBASE_STORAGE_BUCKET=recoup-prod.appspot.com

# Firebase Admin SDK
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@recoup-prod.iam.gserviceaccount.com
```

---

**Deployment complete! Your Firestore security rules and indexes are now live.** 🚀
