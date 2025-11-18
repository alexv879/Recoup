/**
 * Streaming CSV Export Utility
 *
 * Efficiently exports large datasets to CSV without loading everything into memory
 */

import { Readable } from 'stream';
import { logPerformance } from '@/utils/logger';

/**
 * Create a streaming CSV writer
 */
export class StreamingCSVWriter {
  private headers: string[];
  private rowCount = 0;
  private startTime: number;

  constructor(headers: string[]) {
    this.headers = headers;
    this.startTime = Date.now();
  }

  /**
   * Create a readable stream from an async iterator
   */
  createStream<T>(
    dataIterator: AsyncIterableIterator<T>,
    formatter: (item: T) => string[]
  ): Readable {
    const headers = this.headers;
    let isFirstChunk = true;
    let rowCount = 0;
    const startTime = this.startTime;

    return new Readable({
      async read() {
        try {
          // Write headers on first read
          if (isFirstChunk) {
            this.push(headers.map(escapeCSVField).join(',') + '\n');
            isFirstChunk = false;
          }

          // Get next item from iterator
          const { value, done } = await dataIterator.next();

          if (done) {
            // End of data
            const duration = Date.now() - startTime;
            logPerformance({
              operation: 'csv-stream-export',
              duration,
              metadata: {
                rowCount,
                rowsPerSecond: Math.round((rowCount / duration) * 1000),
              },
            });

            this.push(null);
            return;
          }

          // Format and write row
          const row = formatter(value);
          this.push(row.map(escapeCSVField).join(',') + '\n');
          rowCount++;
        } catch (error) {
          this.destroy(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  /**
   * Create a stream from an array in chunks
   */
  async *chunkArray<T>(items: T[], chunkSize: number = 100): AsyncIterableIterator<T> {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      for (const item of chunk) {
        yield item;
      }
    }
  }

  /**
   * Create a stream from a Firestore query with pagination
   */
  async *firestoreIterator<T>(
    query: any,
    pageSize: number = 500
  ): AsyncIterableIterator<T> {
    let lastDoc: any = null;
    let hasMore = true;

    while (hasMore) {
      // Build paginated query
      let paginatedQuery = query.limit(pageSize);

      if (lastDoc) {
        paginatedQuery = paginatedQuery.startAfter(lastDoc);
      }

      // Fetch page
      const snapshot = await paginatedQuery.get();

      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      // Yield each document
      for (const doc of snapshot.docs) {
        yield doc.data() as T;
      }

      // Update pagination cursor
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.docs.length === pageSize;
    }
  }
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Helper to format common data types
 */
export const CSVFormatters = {
  date(date: Date | null | undefined): string {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  datetime(date: Date | null | undefined): string {
    if (!date) return '';
    return date.toISOString();
  },

  currency(amount: number | null | undefined, currency: string = 'USD'): string {
    if (amount === null || amount === undefined) return '';
    return `${currency} ${amount.toFixed(2)}`;
  },

  boolean(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  },

  truncate(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  },
};
