#!/usr/bin/env node

/**
 * Migration Runner
 *
 * Usage:
 *   npm run migrate:run -- --version=v001
 *   npm run migrate:dry-run -- --version=v001
 *   npm run migrate:rollback -- --version=v001
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logInfo, logError } from '@/utils/logger'
import * as fs from 'fs'
import * as path from 'path'

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

initializeApp({
  credential: cert(serviceAccount as any),
})

const db = getFirestore()

interface MigrationModule {
  migration: {
    version: string
    description: string
    up: (db: any) => Promise<void>
    down: (db: any) => Promise<void>
    validate?: (db: any) => Promise<boolean>
  }
}

async function loadMigration(version: string): Promise<MigrationModule> {
  const migrationPath = path.join(__dirname, 'versions', `${version}.ts`)

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration ${version} not found at ${migrationPath}`)
  }

  return require(migrationPath)
}

async function runMigration(version: string, dryRun = false) {
  logInfo(`Loading migration ${version}...`)

  const { migration } = await loadMigration(version)

  logInfo(`Migration: ${migration.description}`)

  if (dryRun) {
    logInfo('[DRY RUN] Migration would execute but no changes will be made')
    return
  }

  // Check if already applied
  const migrationDoc = await db.collection('migrations').doc(version).get()

  if (migrationDoc.exists && migrationDoc.data()?.status === 'completed') {
    const confirm = process.env.FORCE_RERUN === 'true'

    if (!confirm) {
      throw new Error(
        `Migration ${version} already applied. Use FORCE_RERUN=true to run again.`
      )
    }

    logInfo('[WARNING] Re-running already applied migration')
  }

  // Run migration
  logInfo('Executing migration...')
  await migration.up(db)

  // Validate if validation function exists
  if (migration.validate) {
    logInfo('Validating migration...')
    const isValid = await migration.validate(db)

    if (!isValid) {
      throw new Error('Migration validation failed')
    }

    logInfo('Migration validation passed')
  }

  logInfo(`Migration ${version} completed successfully`)
}

async function rollbackMigration(version: string) {
  logInfo(`Rolling back migration ${version}...`)

  const { migration } = await loadMigration(version)

  // Check if migration was applied
  const migrationDoc = await db.collection('migrations').doc(version).get()

  if (!migrationDoc.exists || migrationDoc.data()?.status !== 'completed') {
    throw new Error(`Migration ${version} was not applied, cannot rollback`)
  }

  // Run rollback
  logInfo('Executing rollback...')
  await migration.down(db)

  logInfo(`Migration ${version} rolled back successfully`)
}

async function listMigrations() {
  const migrationsSnapshot = await db
    .collection('migrations')
    .orderBy('appliedAt', 'desc')
    .get()

  console.log('\nApplied Migrations:')
  console.log('===================')

  for (const doc of migrationsSnapshot.docs) {
    const data = doc.data()
    console.log(
      `${data.version} - ${data.description} (${data.status}) - ${data.appliedAt.toDate().toISOString()}`
    )
  }
}

// Main execution
const args = process.argv.slice(2)
const command = args[0]
const versionArg = args.find(arg => arg.startsWith('--version='))
const version = versionArg?.split('=')[1]

async function main() {
  try {
    switch (command) {
      case 'list':
        await listMigrations()
        break

      case 'run':
        if (!version) {
          throw new Error('--version required')
        }
        await runMigration(version, false)
        break

      case 'dry-run':
        if (!version) {
          throw new Error('--version required')
        }
        await runMigration(version, true)
        break

      case 'rollback':
        if (!version) {
          throw new Error('--version required')
        }
        await rollbackMigration(version)
        break

      default:
        console.log(`
Usage:
  npm run migrate:run -- --version=vXXX       # Run migration
  npm run migrate:dry-run -- --version=vXXX   # Dry run
  npm run migrate:rollback -- --version=vXXX  # Rollback
  npm run migrate:list                        # List migrations
        `)
    }
  } catch (error) {
    logError('Migration failed:', error)
    process.exit(1)
  }
}

main()
