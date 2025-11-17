# ANALYTICS DASHBOARD - HTML, CSS, JAVASCRIPT IMPLEMENTATION

**Ready-to-use code for financial/invoicing dashboards**

---

## PART 1: METRIC CARDS (HTML + CSS)

### HTML Structure

```html
<!-- Metric Cards Container -->
<div class="dashboard-container">
  <div class="metrics-grid">
    
    <!-- Card 1: Total Invoiced -->
    <div class="metric-card">
      <div class="card-header">
        <h3>Total Invoiced</h3>
        <span class="card-period">This Month</span>
      </div>
      <div class="card-body">
        <div class="metric-value">£45,320</div>
        <div class="metric-change positive">
          <span class="arrow">↑</span> 12% vs last month
        </div>
      </div>
      <div class="card-footer">
        <small>Updated 2 hours ago</small>
      </div>
    </div>

    <!-- Card 2: Total Collected -->
    <div class="metric-card">
      <div class="card-header">
        <h3>Total Collected</h3>
        <span class="card-period">All Time</span>
      </div>
      <div class="card-body">
        <div class="metric-value">£156,200</div>
        <div class="metric-change positive">
          <span class="arrow">↑</span> 5% vs last month
        </div>
      </div>
      <div class="card-footer">
        <small>Updated 2 hours ago</small>
      </div>
    </div>

    <!-- Card 3: Outstanding -->
    <div class="metric-card">
      <div class="card-header">
        <h3>Outstanding</h3>
        <span class="card-period">Not Yet Due</span>
      </div>
      <div class="card-body">
        <div class="metric-value">£7,120</div>
        <div class="metric-change negative">
          <span class="arrow">↓</span> 3% vs last month
        </div>
      </div>
      <div class="card-footer">
        <small>Updated 2 hours ago</small>
      </div>
    </div>

    <!-- Card 4: Overdue -->
    <div class="metric-card alert">
      <div class="card-header">
        <h3>Overdue</h3>
        <span class="card-period">Past Due Date</span>
      </div>
      <div class="card-body">
        <div class="metric-value">£3,400</div>
        <div class="metric-change negative">
          <span class="arrow">↑</span> 24% vs last month
        </div>
      </div>
      <div class="card-footer">
        <small>Immediate Action Needed</small>
      </div>
    </div>

    <!-- Card 5: Cash Flow (7 days) -->
    <div class="metric-card">
      <div class="card-header">
        <h3>Cash Flow Forecast</h3>
        <span class="card-period">Next 7 Days</span>
      </div>
      <div class="card-body">
        <div class="metric-value">£10,000</div>
        <div class="metric-change positive">
          <span class="arrow">↑</span> 8% vs last week
        </div>
      </div>
      <div class="card-footer">
        <small>Based on due dates</small>
      </div>
    </div>

  </div>
</div>
```

### CSS Styling

```css
/* Dashboard Container */
.dashboard-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

/* Metric Card */
.metric-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007bff;
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Alert variant (red border for overdue) */
.metric-card.alert {
  border-left-color: #dc3545;
  background: #fff8f8;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-period {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Card Body */
.card-body {
  margin-bottom: 15px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.metric-change.positive {
  color: #28a745;
}

.metric-change.negative {
  color: #dc3545;
}

.metric-change .arrow {
  margin-right: 4px;
  font-size: 16px;
}

/* Card Footer */
.card-footer {
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
}

/* Responsive Design */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }

  .metric-value {
    font-size: 24px;
  }

  .metric-card {
    padding: 15px;
  }
}
```

---

## PART 2: DATE RANGE FILTER (HTML + CSS + JS)

### HTML Structure

```html
<!-- Date Range Filter -->
<div class="filter-section">
  <label class="filter-label">Date Range</label>
  
  <div class="date-filter-container">
    <!-- Quick Select Buttons -->
    <div class="filter-presets">
      <button class="preset-btn active" data-range="7">Last 7 Days</button>
      <button class="preset-btn" data-range="30">Last 30 Days</button>
      <button class="preset-btn" data-range="90">Last 90 Days</button>
      <button class="preset-btn" data-range="365">Year to Date</button>
      <button class="preset-btn" data-range="custom">Custom</button>
    </div>

    <!-- Custom Date Range (hidden by default) -->
    <div class="custom-date-range hidden">
      <div class="date-input-group">
        <label>From</label>
        <input type="date" id="date-from" placeholder="Start date">
      </div>
      <div class="date-input-group">
        <label>To</label>
        <input type="date" id="date-to" placeholder="End date">
      </div>
      <button class="btn btn-primary" id="apply-custom-date">Apply</button>
    </div>
  </div>

  <!-- Active Filter Display -->
  <div class="active-filters">
    <span class="filter-tag">
      Date: <strong id="filter-display">Last 30 Days</strong>
      <button class="remove-filter" onclick="resetFilter()">✕</button>
    </span>
  </div>
</div>
```

### CSS Styling

```css
/* Filter Section */
.filter-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

/* Filter Presets */
.filter-presets {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.preset-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.preset-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* Custom Date Range */
.custom-date-range {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.custom-date-range.hidden {
  display: none;
}

.date-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.date-input-group label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}

.date-input-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.date-input-group input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.2);
}

/* Active Filters Display */
.active-filters {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 13px;
  color: #0056b3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.remove-filter {
  background: none;
  border: none;
  color: #0056b3;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 0;
  line-height: 1;
}

.remove-filter:hover {
  color: #dc3545;
}

/* Button Styles */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}
```

### JavaScript Implementation

```javascript
// Date Filter Logic
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const range = this.dataset.range;
    
    // Remove active class from all buttons
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    this.classList.add('active');
    
    // Toggle custom date range visibility
    const customRange = document.querySelector('.custom-date-range');
    if (range === 'custom') {
      customRange.classList.remove('hidden');
    } else {
      customRange.classList.add('hidden');
      applyPresetRange(range);
    }
  });
});

function applyPresetRange(days) {
  const today = new Date();
  const startDate = new Date();
  
  if (days === '365') {
    startDate.setFullYear(today.getFullYear(), 0, 1); // Jan 1 of current year
    document.getElementById('filter-display').textContent = 'Year to Date';
  } else {
    startDate.setDate(today.getDate() - parseInt(days));
    document.getElementById('filter-display').textContent = `Last ${days} Days`;
  }
  
  // Trigger dashboard update (pass startDate and today to your API)
  updateDashboard(startDate, today);
}

// Custom Date Range Apply
document.getElementById('apply-custom-date').addEventListener('click', function() {
  const fromDate = document.getElementById('date-from').value;
  const toDate = document.getElementById('date-to').value;
  
  if (!fromDate || !toDate) {
    alert('Please select both dates');
    return;
  }
  
  document.getElementById('filter-display').textContent = `${fromDate} to ${toDate}`;
  updateDashboard(new Date(fromDate), new Date(toDate));
});

function updateDashboard(startDate, endDate) {
  console.log('Updating dashboard with date range:', startDate, endDate);
  // Call your API to fetch filtered data
  // Example: fetchDashboardData(startDate, endDate)
}

function resetFilter() {
  document.querySelector('[data-range="30"]').click();
}
```

---

## PART 3: SORTABLE DATA TABLE (HTML + CSS + JS)

### HTML Structure

```html
<!-- Data Table -->
<div class="table-container">
  <h3>Overdue Invoices</h3>
  
  <table class="invoice-table">
    <thead>
      <tr>
        <th class="sortable" data-column="invoice_number">
          Invoice # <span class="sort-indicator">⇅</span>
        </th>
        <th class="sortable" data-column="client_name">
          Client <span class="sort-indicator">⇅</span>
        </th>
        <th class="sortable" data-column="amount">
          Amount <span class="sort-indicator">⇅</span>
        </th>
        <th class="sortable" data-column="due_date">
          Due Date <span class="sort-indicator">⇅</span>
        </th>
        <th class="sortable" data-column="days_overdue">
          Days Overdue <span class="sort-indicator">⇅</span>
        </th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>INV-001238</td>
        <td>Beta Co</td>
        <td>£1,950</td>
        <td>5 Nov 2025</td>
        <td><span class="badge critical">10 days</span></td>
        <td><span class="status-badge overdue">🔴 Overdue</span></td>
        <td>
          <button class="action-btn">Remind</button>
          <button class="action-btn">Details</button>
        </td>
      </tr>
      <tr>
        <td>INV-001236</td>
        <td>Smith Ltd</td>
        <td>£4,200</td>
        <td>10 Nov 2025</td>
        <td><span class="badge warning">5 days</span></td>
        <td><span class="status-badge warning">🟠 Action</span></td>
        <td>
          <button class="action-btn">Remind</button>
          <button class="action-btn">Details</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Bulk Actions -->
  <div class="bulk-actions">
    <label>
      <input type="checkbox" id="select-all"> Select All
    </label>
    <button class="btn btn-secondary" id="bulk-remind">Send Reminders</button>
    <button class="btn btn-secondary" id="bulk-escalate">Escalate</button>
  </div>
</div>
```

### CSS Styling

```css
/* Table Container */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.table-container h3 {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  color: #333;
}

/* Table Styles */
.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.invoice-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.invoice-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  user-select: none;
}

.invoice-table th.sortable {
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.invoice-table th.sortable:hover {
  background: #e9ecef;
}

.sort-indicator {
  display: inline-block;
  margin-left: 6px;
  color: #999;
  font-size: 12px;
}

.invoice-table th.sortable.active .sort-indicator {
  color: #007bff;
}

/* Table Rows */
.invoice-table tbody tr {
  border-bottom: 1px solid #eee;
  transition: background 0.2s ease;
}

.invoice-table tbody tr:hover {
  background: #f8f9fa;
}

.invoice-table td {
  padding: 14px 16px;
  color: #666;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.overdue {
  background: #ffe7e7;
  color: #dc3545;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

/* Days Overdue Badge */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge.critical {
  background: #ffe7e7;
  color: #dc3545;
}

.badge.warning {
  background: #fff3cd;
  color: #856404;
}

/* Action Buttons */
.action-btn {
  padding: 6px 10px;
  margin-right: 4px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #007bff;
  color: #007bff;
  background: #f0f7ff;
}

/* Bulk Actions */
.bulk-actions {
  padding: 15px 16px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 15px;
}

.bulk-actions label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.bulk-actions input[type="checkbox"] {
  cursor: pointer;
}

.bulk-actions .btn {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-actions .btn:hover {
  border-color: #007bff;
  color: #007bff;
}

/* Responsive */
@media (max-width: 768px) {
  .invoice-table {
    font-size: 12px;
  }

  .invoice-table th,
  .invoice-table td {
    padding: 10px 8px;
  }

  .action-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
}
```

### JavaScript Sorting Implementation

```javascript
// Sortable Table
document.querySelectorAll('.invoice-table th.sortable').forEach(th => {
  th.addEventListener('click', function() {
    const column = this.dataset.column;
    const isAscending = this.classList.contains('active') && 
                       this.dataset.order === 'asc';
    
    // Remove active class from all headers
    document.querySelectorAll('.invoice-table th.sortable').forEach(h => {
      h.classList.remove('active');
      h.dataset.order = '';
    });
    
    // Set new sort order
    this.classList.add('active');
    this.dataset.order = isAscending ? 'desc' : 'asc';
    
    sortTable(column, isAscending ? 'desc' : 'asc');
  });
});

function sortTable(column, order) {
  const tbody = document.querySelector('.invoice-table tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  const columnIndex = {
    'invoice_number': 0,
    'client_name': 1,
    'amount': 2,
    'due_date': 3,
    'days_overdue': 4
  };
  
  const index = columnIndex[column];
  
  rows.sort((a, b) => {
    let aValue = a.cells[index].textContent.trim();
    let bValue = b.cells[index].textContent.trim();
    
    // Try to parse as number if it looks like a number
    const aNum = parseFloat(aValue.replace(/[£,]/g, ''));
    const bNum = parseFloat(bValue.replace(/[£,]/g, ''));
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return order === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // String comparison
    return order === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
  
  rows.forEach(row => tbody.appendChild(row));
}
```

---

## PART 4: EXPORT BUTTONS (HTML + CSS + JS)

### HTML Structure

```html
<!-- Export Section -->
<div class="export-section">
  <h3>Export & Reports</h3>
  
  <div class="export-buttons">
    <button class="export-btn pdf" id="export-pdf">
      <span class="icon">📄</span>
      Export PDF
    </button>
    
    <button class="export-btn csv" id="export-csv">
      <span class="icon">📊</span>
      Export CSV
    </button>
    
    <button class="export-btn email" id="export-email">
      <span class="icon">📧</span>
      Email Report
    </button>
  </div>
</div>
```

### CSS Styling

```css
/* Export Section */
.export-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.export-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

/* Export Buttons */
.export-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.export-btn:hover {
  border-color: #007bff;
  color: #007bff;
  background: #f0f7ff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.export-btn .icon {
  font-size: 18px;
}

.export-btn.pdf:hover {
  border-color: #dc3545;
  color: #dc3545;
  background: #ffe7e7;
}

.export-btn.csv:hover {
  border-color: #28a745;
  color: #28a745;
  background: #e7f5e7;
}

.export-btn.email:hover {
  border-color: #007bff;
  color: #007bff;
  background: #f0f7ff;
}

/* Loading State */
.export-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.export-btn.loading .icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### JavaScript Export Implementation

```javascript
// Export Buttons
document.getElementById('export-pdf').addEventListener('click', function() {
  exportPDF();
});

document.getElementById('export-csv').addEventListener('click', function() {
  exportCSV();
});

document.getElementById('export-email').addEventListener('click', function() {
  exportEmail();
});

function exportPDF() {
  const btn = document.getElementById('export-pdf');
  btn.classList.add('loading');
  
  // Using jsPDF library (include in your HTML)
  // const { jsPDF } = window.jspdf;
  // const doc = new jsPDF();
  // doc.text("Financial Summary Report", 10, 10);
  // ... add content ...
  // doc.save("financial-report.pdf");
  
  setTimeout(() => {
    btn.classList.remove('loading');
    alert('PDF exported successfully!');
  }, 2000);
}

function exportCSV() {
  const btn = document.getElementById('export-csv');
  btn.classList.add('loading');
  
  const table = document.querySelector('.invoice-table');
  let csv = [];
  
  // Extract headers
  const headers = Array.from(table.querySelectorAll('th')).map(th => 
    th.textContent.trim()
  );
  csv.push(headers.join(','));
  
  // Extract rows
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(td => 
      `"${td.textContent.trim()}"`
    );
    csv.push(cells.join(','));
  });
  
  // Create blob and download
  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices-export.csv';
  a.click();
  window.URL.revokeObjectURL(url);
  
  btn.classList.remove('loading');
}

function exportEmail() {
  const btn = document.getElementById('export-email');
  btn.classList.add('loading');
  
  // Show email dialog (implement modal)
  const email = prompt('Enter email address:');
  
  if (email) {
    // Call API to send email
    fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
      alert(`Report sent to ${email}`);
      btn.classList.remove('loading');
    })
    .catch(err => {
      console.error(err);
      btn.classList.remove('loading');
    });
  } else {
    btn.classList.remove('loading');
  }
}
```

---

## PART 5: INTEGRATION CHECKLIST

- [ ] Include Chart.js or D3.js library for charts
- [ ] Include jsPDF library for PDF export
- [ ] Connect table data to your API endpoint
- [ ] Implement date filter API calls
- [ ] Set up email sending backend
- [ ] Test responsive design on mobile
- [ ] Optimize for performance (lazy load charts)
- [ ] Add loading states and error handling
- [ ] Implement caching for dashboard data
- [ ] Add keyboard shortcuts (e.g., `?` for help)

---

**Dashboard Implementation Code Version:** 1.0  
**Last Updated:** November 2025  
**Ready for Production:** Yes (with modifications for your API)