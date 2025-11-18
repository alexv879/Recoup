# Firestore Migration Strategy

Since Recoup uses Firebase Firestore (NoSQL), traditional SQL-style schema migrations don't apply. Instead, we use a versioned migration system for data transformations and schema evolution.

## Migration Principles

1. **Backward Compatibility**: New code must work with old data
2. **Gradual Rollout**: Migrate data in batches to avoid timeouts
3. **Idempotency**: Migrations can be run multiple times safely
4. **Versioning**: Each migration has a version number
5. **Audit Trail**: All migrations are logged

## Directory Structure

```
scripts/migrations/
├── README.md                 # This file
├── migration-template.ts     # Template for new migrations
├── run-migration.ts          # Migration runner
├── versions/
│   ├── v001-add-user-stats.ts
│   ├── v002-migrate-pricing.ts
│   └── v003-add-escalation-stage.ts
└── rollback/
    └── rollback-template.ts
```

## Creating a Migration

1. Copy `migration-template.ts`
2. Increment version number
3. Implement `up()` function
4. Test on staging first
5. Run on production

## Running Migrations

```bash
# Dry run (shows what will change)
npm run migrate:dry-run -- --version=v001

# Run migration
npm run migrate:run -- --version=v001

# Rollback migration
npm run migrate:rollback -- --version=v001
```

## Example Migration

```typescript
// v001-add-user-stats.ts
export const migration = {
  version: 'v001',
  description: 'Add user_stats collection',

  async up(db: Firestore) {
    const users = await db.collection('users').get()

    for (const userDoc of users.docs) {
      const userId = userDoc.id

      // Create user stats document
      await db.collection('user_stats').doc(userId).set({
        totalInvoices: 0,
        totalRevenue: 0,
        averagePaymentTime: 0,
        createdAt: Timestamp.now()
      })
    }
  }
}
```

## Best Practices

- Always backup before migrations
- Test on staging environment first
- Use batch operations for large datasets
- Log all changes
- Monitor error rates
- Have rollback plan ready
