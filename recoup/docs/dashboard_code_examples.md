# Dashboard Code Examples for Invoice Management SaaS

## 1. Metric Card Component (React)

```javascript
// MetricCard.jsx - Displays key financial metrics with trend indicators
import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  currency = '£', 
  trend, 
  trendValue, 
  icon: Icon,
  backgroundColor = 'bg-blue-50',
  borderColor = 'border-blue-200'
}) => {
  const isTrendUp = trend === 'up';
  
  return (
    <div className={`p-6 rounded-lg border ${borderColor} ${backgroundColor} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">
            {currency}{value.toLocaleString()}
          </h3>
        </div>
        {Icon && <Icon className="w-8 h-8 text-gray-400" />}
      </div>
      
      {trendValue && (
        <div className="flex items-center text-sm">
          {isTrendUp ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={isTrendUp ? 'text-green-600' : 'text-red-600'}>
            {isTrendUp ? '+' : '-'}{trendValue}%
          </span>
          <span className="text-gray-600 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
};

// Usage
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <MetricCard 
    title="Total Owed" 
    value={12500}
    trend="up"
    trendValue={8}
    backgroundColor="bg-purple-50"
    borderColor="border-purple-200"
  />
  <MetricCard 
    title="Overdue" 
    value={3200}
    trend="down"
    trendValue={12}
    backgroundColor="bg-red-50"
    borderColor="border-red-200"
  />
  <MetricCard 
    title="Collections in Progress" 
    value={8300}
    trend="up"
    trendValue={5}
    backgroundColor="bg-green-50"
    borderColor="border-green-200"
  />
</div>
```

## 2. Invoice Table Component with Filtering & Sorting

```javascript
// InvoiceTable.jsx - Invoice list with sorting, filtering, and actions
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal } from 'lucide-react';

const InvoiceTable = ({ invoices = [] }) => {
  const [sortKey, setSortKey] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort logic
  const processedInvoices = useMemo(() => {
    let filtered = invoices;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inv => 
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNumber.includes(searchQuery)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      return sortOrder === 'asc' 
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });
  }, [invoices, sortKey, sortOrder, filterStatus, searchQuery]);

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client or invoice #"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer"
                  onClick={() => {
                    setSortKey('invoiceNumber');
                    setSortOrder(sortKey === 'invoiceNumber' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                  }}>
                Invoice #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer"
                  onClick={() => {
                    setSortKey('clientName');
                    setSortOrder(sortKey === 'clientName' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                  }}>
                Client
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer"
                  onClick={() => {
                    setSortKey('amount');
                    setSortOrder(sortKey === 'amount' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                  }}>
                Amount
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer"
                  onClick={() => {
                    setSortKey('dueDate');
                    setSortOrder(sortKey === 'dueDate' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                  }}>
                Due Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedInvoices.length > 0 ? (
              processedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{invoice.clientName}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    £{invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{invoice.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
```

## 3. Cash Flow Visualization Component

```javascript
// CashFlowChart.jsx - Line chart for cash flow trends
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const CashFlowChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Cash Flow Projection</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
            formatter={(value) => `£${value.toLocaleString()}`}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorRevenue)"
            name="Actual Cash Flow"
          />
          <Area 
            type="monotone" 
            dataKey="projected" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorProjected)"
            name="Projected Cash Flow"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Sample data
const sampleData = [
  { month: 'Jan', actual: 4000, projected: 4500 },
  { month: 'Feb', actual: 3000, projected: 4200 },
  { month: 'Mar', actual: 2000, projected: 4000 },
  { month: 'Apr', actual: 2780, projected: 4500 },
  { month: 'May', actual: 1890, projected: 3800 },
  { month: 'Jun', actual: 2390, projected: 4300 },
];

export default CashFlowChart;
```

## 4. Empty State with Onboarding Checklist

```javascript
// EmptyState.jsx - First-time user experience
import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, FileText } from 'lucide-react';

const EmptyStateChecklist = ({ onStartInvoice }) => {
  const [checklist, setChecklist] = useState([
    { id: 1, title: 'Add your first client', completed: false, desc: 'Build your client database' },
    { id: 2, title: 'Create your first invoice', completed: false, desc: 'Send your first invoice in minutes' },
    { id: 3, title: 'Track payment status', completed: false, desc: 'Monitor collections and cash flow' }
  ]);

  const toggleChecklistItem = (id) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Illustration/Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-100 rounded-full p-4">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Welcome to Relay
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Get your first invoice sent in 3 simple steps
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-blue-600">{completedCount}/{checklist.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3 mb-8">
          {checklist.map((item, index) => (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                item.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50 hover:border-blue-200'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="text-left">
                <p className={`font-semibold ${item.completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                  {index + 1}. {item.title}
                </p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onStartInvoice}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          Start Your First Invoice
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Secondary CTA */}
        <button className="w-full mt-3 text-gray-600 hover:text-gray-900 font-medium py-2">
          Watch 2-min tutorial
        </button>
      </div>
    </div>
  );
};

export default EmptyStateChecklist;
```

## 5. Actionable Insights Component

```javascript
// ActionableInsights.jsx - Smart notifications based on data
import React from 'react';
import { AlertTriangle, TrendingDown, Clock, ArrowRight } from 'lucide-react';

const ActionableInsights = ({ insights = [] }) => {
  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 flex items-start justify-between gap-4 ${
            insight.type === 'warning'
              ? 'bg-red-50 border-red-500'
              : insight.type === 'info'
              ? 'bg-blue-50 border-blue-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className={`flex-shrink-0 mt-0.5 ${
              insight.type === 'warning'
                ? 'text-red-600'
                : insight.type === 'info'
                ? 'text-blue-600'
                : 'text-yellow-600'
            }`}>
              {insight.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {insight.type === 'info' && <Clock className="w-5 h-5" />}
              {insight.type === 'trend' && <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <p className={`font-semibold ${
                insight.type === 'warning'
                  ? 'text-red-900'
                  : insight.type === 'info'
                  ? 'text-blue-900'
                  : 'text-yellow-900'
              }`}>
                {insight.title}
              </p>
              <p className={`text-sm mt-1 ${
                insight.type === 'warning'
                  ? 'text-red-700'
                  : insight.type === 'info'
                  ? 'text-blue-700'
                  : 'text-yellow-700'
              }`}>
                {insight.description}
              </p>
            </div>
          </div>
          
          {insight.action && (
            <button className={`flex-shrink-0 px-3 py-1 rounded font-semibold text-sm whitespace-nowrap flex items-center gap-1 ${
              insight.type === 'warning'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : insight.type === 'info'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}>
              {insight.action}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// Example usage
const exampleInsights = [
  {
    type: 'warning',
    title: '3 invoices overdue',
    description: 'You have invoices overdue by more than 30 days worth £2,450',
    action: 'Send reminders',
  },
  {
    type: 'info',
    title: 'Cash flow forecast',
    description: 'You\'re projected to receive £4,200 in the next 7 days from pending invoices',
    action: 'View details',
  },
  {
    type: 'trend',
    title: 'Collection rate dropped',
    description: 'Your average collection time increased from 25 to 32 days this month',
    action: null,
  },
];

export default ActionableInsights;
```

## 6. Mobile-Optimized Dashboard Navigation

```javascript
// MobileBottomNav.jsx - Bottom tab navigation for mobile
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings,
  ChevronUp
} from 'lucide-react';

const MobileBottomNav = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
```

## 7. Onboarding Modal with Product Tour

```javascript
// OnboardingTour.jsx - Interactive walkthrough
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const OnboardingTour = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Relay',
      description: 'Manage your invoices, track payments, and grow your business effortlessly.',
      highlightElement: null,
      cta: 'Next'
    },
    {
      title: 'Create Invoices',
      description: 'Click here to create a new invoice. Fill in client details and services, then send with one click.',
      highlightElement: '.create-invoice-btn',
      cta: 'Next'
    },
    {
      title: 'Track Payments',
      description: 'View all your invoices here and see payment status at a glance.',
      highlightElement: '.invoices-table',
      cta: 'Next'
    },
    {
      title: 'Dashboard Insights',
      description: 'Get actionable insights about your cash flow and overdue invoices automatically.',
      highlightElement: '.metrics-section',
      cta: 'Got it!'
    }
  ];

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onClose} />
      
      {/* Tour Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 z-50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'bg-blue-600 w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{step.description}</p>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          <button
            onClick={isLastStep ? onClose : () => setCurrentStep(currentStep + 1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            {step.cta}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
        >
          Skip Tour
        </button>
      </div>
    </>
  );
};

export default OnboardingTour;
```

---

## Integration Notes

### Setting Up the Full Dashboard

```javascript
// Dashboard.jsx - Main dashboard container
import React, { useState } from 'react';
import MetricCard from './components/MetricCard';
import InvoiceTable from './components/InvoiceTable';
import CashFlowChart from './components/CashFlowChart';
import ActionableInsights from './components/ActionableInsights';
import EmptyStateChecklist from './components/EmptyStateChecklist';

const Dashboard = () => {
  const [hasInvoices, setHasInvoices] = useState(false);
  
  // Mock data
  const metrics = {
    totalOwed: 12500,
    overdue: 3200,
    collectionsInProgress: 8300
  };

  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-001',
      clientName: 'Acme Corp',
      amount: 2500,
      dueDate: '2025-12-15',
      status: 'paid'
    },
    // ... more invoices
  ];

  if (!hasInvoices) {
    return <EmptyStateChecklist onStartInvoice={() => setHasInvoices(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard title="Total Owed" value={metrics.totalOwed} trend="up" trendValue={8} />
        <MetricCard title="Overdue" value={metrics.overdue} trend="down" trendValue={12} />
        <MetricCard title="Collections" value={metrics.collectionsInProgress} trend="up" trendValue={5} />
      </div>

      {/* Insights */}
      <ActionableInsights insights={[
        {
          type: 'warning',
          title: '3 invoices overdue',
          description: 'You have invoices overdue by more than 30 days worth £2,450',
          action: 'Send reminders'
        }
      ]} />

      {/* Cash Flow Chart */}
      <CashFlowChart data={[/* chart data */]} />

      {/* Invoice Table */}
      <InvoiceTable invoices={invoices} />
    </div>
  );
};

export default Dashboard;
```

These code examples follow React best practices with hooks, proper state management, and accessibility considerations. Customize colors, copy, and data structures based on your Relay application needs.
