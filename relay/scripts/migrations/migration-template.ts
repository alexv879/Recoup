/**
 * Migration Template
 *
 * Copy this file and rename to: vXXX-description.ts
 * Example: v004-add-referral-system.ts
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore'
import { logInfo, logError } from '@/utils/logger'

export const migration = {
  version: 'vXXX', // Update this!
  description: 'Brief description of what this migration does',
  author: 'Your Name',
  date: new Date().toISOString(),

  /**
   * Forward migration
   * Applies the schema/data changes
   */
  async up(db: Firestore): Promise<void> {
    logInfo(`[Migration ${this.version}] Starting: ${this.description}`)
    const startTime = Date.now()

    try {
      // Example: Update all documents in a collection
      const collectionRef = db.collection('your_collection')
      const snapshot = await collectionRef.get()

      let processedCount = 0
      let errorCount = 0

      // Process in batches of 500 (Firestore limit)
      const batchSize = 500
      const batches: any[][] = []
      let currentBatch: any[] = []

      for (const doc of snapshot.docs) {
        currentBatch.push(doc)

        if (currentBatch.length >= batchSize) {
          batches.push(currentBatch)
          currentBatch = []
        }
      }

      if (currentBatch.length > 0) {
        batches.push(currentBatch)
      }

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = db.batch()

        for (const doc of batches[i]) {
          try {
            // Example transformation
            const data = doc.data()

            // Add new field or transform existing data
            batch.update(doc.ref, {
              newField: 'default_value',
              updatedAt: Timestamp.now(),
            })

            processedCount++
          } catch (error) {
            logError(`[Migration ${this.version}] Error processing doc ${doc.id}:`, error)
            errorCount++
          }
        }

        await batch.commit()
        logInfo(`[Migration ${this.version}] Processed batch ${i + 1}/${batches.length}`)
      }

      const duration = Date.now() - startTime
      logInfo(`[Migration ${this.version}] Completed in ${duration}ms`)
      logInfo(`[Migration ${this.version}] Processed: ${processedCount}, Errors: ${errorCount}`)

      // Record migration
      await db.collection('migrations').doc(this.version).set({
        version: this.version,
        description: this.description,
        author: this.author,
        appliedAt: Timestamp.now(),
        duration,
        processedCount,
        errorCount,
        status: 'completed',
      })

    } catch (error) {
      logError(`[Migration ${this.version}] Failed:`, error)

      // Record failed migration
      await db.collection('migrations').doc(this.version).set({
        version: this.version,
        description: this.description,
        author: this.author,
        attemptedAt: Timestamp.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'failed',
      })

      throw error
    }
  },

  /**
   * Rollback migration
   * Reverses the changes made by up()
   */
  async down(db: Firestore): Promise<void> {
    logInfo(`[Migration ${this.version}] Rolling back: ${this.description}`)
    const startTime = Date.now()

    try {
      // Implement rollback logic
      // This should reverse the changes made in up()

      const collectionRef = db.collection('your_collection')
      const snapshot = await collectionRef.get()

      const batch = db.batch()

      for (const doc of snapshot.docs) {
        // Example: Remove the field added in up()
        batch.update(doc.ref, {
          newField: null, // Firestore removes null fields
        })
      }

      await batch.commit()

      const duration = Date.now() - startTime
      logInfo(`[Migration ${this.version}] Rollback completed in ${duration}ms`)

      // Record rollback
      await db.collection('migrations').doc(this.version).update({
        rolledBackAt: Timestamp.now(),
        status: 'rolled_back',
      })

    } catch (error) {
      logError(`[Migration ${this.version}] Rollback failed:`, error)
      throw error
    }
  },

  /**
   * Validation function
   * Checks if migration was successful
   */
  async validate(db: Firestore): Promise<boolean> {
    try {
      // Example validation
      const snapshot = await db.collection('your_collection').limit(10).get()

      for (const doc of snapshot.docs) {
        const data = doc.data()

        // Check if expected field exists
        if (!data.newField) {
          return false
        }
      }

      return true
    } catch (error) {
      logError(`[Migration ${this.version}] Validation failed:`, error)
      return false
    }
  },
}

export default migration
