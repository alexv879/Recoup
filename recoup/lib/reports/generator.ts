/**
 * Report Generator
 * Generates PDF, Excel, and CSV reports for collections, invoices, revenue, and performance
 * Uses PDFKit for PDF generation
 */

import PDFDocument from 'pdfkit';

export interface ReportOptions {
  type: 'collections' | 'invoices' | 'revenue' | 'performance';
  format: 'pdf' | 'excel' | 'csv';
  data: any;
  userId: string;
}

export interface ReportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Generate report file
 * @param options - Report generation options
 * @returns Report buffer
 */
export async function generateReport(options: ReportOptions): Promise<Buffer> {
  const { type, format, data } = options;

  switch (format) {
    case 'pdf':
      return await generatePDF(data, type);
    case 'excel':
      return await generateExcel(data, type);
    case 'csv':
      return Buffer.from(await generateCSV(data, type));
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Generate PDF report
 * @param data - Report data
 * @param reportType - Type of report
 * @returns PDF buffer
 */
export async function generatePDF(data: any, reportType: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .text(`${reportType.toUpperCase()} REPORT`, { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' })
        .moveDown(2);

      // Report content based on type
      if (data.period) {
        doc.fontSize(12).text(`Period: ${formatDate(data.period.start)} - ${formatDate(data.period.end)}`);
        doc.moveDown();
      }

      // Add summary statistics
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);

      const summaryItems = extractSummaryItems(data, reportType);
      summaryItems.forEach(({ label, value }) => {
        doc.fontSize(10).text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value);
      });

      doc.moveDown(2);

      // Add detailed data if available
      if (data.recentActivities || data.recentInvoices) {
        doc.fontSize(14).text('Recent Activity', { underline: true });
        doc.moveDown(0.5);

        const items = data.recentActivities || data.recentInvoices || [];
        items.slice(0, 10).forEach((item: any, index: number) => {
          doc.fontSize(9).text(`${index + 1}. ${formatItemSummary(item, reportType)}`);
        });
      }

      // Footer
      doc
        .fontSize(8)
        .text('Recoup - Automated Invoice Collections', 50, doc.page.height - 50, {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report (simplified - returns CSV-like format)
 * @param data - Report data
 * @param reportType - Type of report
 * @returns Excel buffer (as CSV for now)
 */
export async function generateExcel(data: any, reportType: string): Promise<Buffer> {
  // For production, use 'exceljs' library to generate proper .xlsx files
  // For now, return CSV format as Buffer
  const csv = await generateCSV(data, reportType);
  return Buffer.from(csv);
}

/**
 * Generate CSV report
 * @param data - Report data
 * @param reportType - Type of report
 * @returns CSV string
 */
export async function generateCSV(data: any, reportType: string): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push(`${reportType.toUpperCase()} REPORT`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Period
  if (data.period) {
    lines.push(`Period,${formatDate(data.period.start)} - ${formatDate(data.period.end)}`);
    lines.push('');
  }

  // Summary statistics
  lines.push('SUMMARY');
  const summaryItems = extractSummaryItems(data, reportType);
  summaryItems.forEach(({ label, value }) => {
    lines.push(`${label},${value}`);
  });
  lines.push('');

  // Detailed data
  if (data.recentActivities) {
    lines.push('RECENT ACTIVITIES');
    lines.push('Date,Type,Status,Amount,Invoice');

    data.recentActivities.forEach((activity: any) => {
      lines.push(
        `${formatDate(activity.timestamp)},${activity.activityType || 'N/A'},${activity.outcome || 'N/A'},${activity.amountCollected || 0},${activity.invoiceReference || 'N/A'}`
      );
    });
  } else if (data.recentInvoices) {
    lines.push('RECENT INVOICES');
    lines.push('Date,Reference,Status,Amount,Client');

    data.recentInvoices.forEach((invoice: any) => {
      lines.push(
        `${formatDate(invoice.createdAt)},${invoice.reference || 'N/A'},${invoice.status || 'N/A'},${invoice.amount || 0},${invoice.clientName || 'N/A'}`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Extract summary items from data
 */
function extractSummaryItems(data: any, reportType: string): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];

  switch (reportType) {
    case 'collections':
      if (data.totalAttempts !== undefined) items.push({ label: 'Total Attempts', value: String(data.totalAttempts) });
      if (data.successfulCollections !== undefined)
        items.push({ label: 'Successful Collections', value: String(data.successfulCollections) });
      if (data.totalCollected !== undefined)
        items.push({ label: 'Total Collected', value: `£${(data.totalCollected / 100).toFixed(2)}` });
      break;

    case 'invoices':
      if (data.totalInvoices !== undefined) items.push({ label: 'Total Invoices', value: String(data.totalInvoices) });
      if (data.totalValue !== undefined)
        items.push({ label: 'Total Value', value: `£${(data.totalValue / 100).toFixed(2)}` });
      if (data.paidInvoices !== undefined) items.push({ label: 'Paid Invoices', value: String(data.paidInvoices) });
      if (data.overdueInvoices !== undefined) items.push({ label: 'Overdue Invoices', value: String(data.overdueInvoices) });
      break;

    case 'revenue':
      if (data.totalRevenue !== undefined)
        items.push({ label: 'Total Revenue', value: `£${(data.totalRevenue / 100).toFixed(2)}` });
      if (data.invoiceCount !== undefined) items.push({ label: 'Invoice Count', value: String(data.invoiceCount) });
      if (data.averageInvoiceValue !== undefined)
        items.push({ label: 'Average Invoice', value: `£${(data.averageInvoiceValue / 100).toFixed(2)}` });
      break;

    case 'performance':
      if (data.totalInvoiced !== undefined)
        items.push({ label: 'Total Invoiced', value: `£${(data.totalInvoiced / 100).toFixed(2)}` });
      if (data.totalCollected !== undefined)
        items.push({ label: 'Total Collected', value: `£${(data.totalCollected / 100).toFixed(2)}` });
      if (data.onTimePercentage !== undefined)
        items.push({ label: 'On-Time Payment %', value: `${data.onTimePercentage.toFixed(1)}%` });
      if (data.averagePaymentDays !== undefined)
        items.push({ label: 'Avg Payment Days', value: String(Math.round(data.averagePaymentDays)) });
      break;
  }

  return items;
}

/**
 * Format date for display
 */
function formatDate(date: any): string {
  if (!date) return 'N/A';

  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-GB');
}

/**
 * Format item summary for display
 */
function formatItemSummary(item: any, reportType: string): string {
  switch (reportType) {
    case 'collections':
      return `${formatDate(item.timestamp)} - ${item.activityType || 'Activity'} - ${item.outcome || 'Pending'} - £${((item.amountCollected || 0) / 100).toFixed(2)}`;

    case 'invoices':
    case 'revenue':
      return `${formatDate(item.createdAt)} - ${item.reference} - ${item.status} - £${((item.amount || 0) / 100).toFixed(2)}`;

    default:
      return JSON.stringify(item);
  }
}
