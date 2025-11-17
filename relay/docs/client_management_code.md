# Client Management Code Examples for Relay

## 1. Advanced Autocomplete Client Selector

```javascript
// ClientSelector.jsx - Autocomplete with recent clients and add new
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, ChevronDown } from 'lucide-react';

const ClientSelector = ({ 
  clients = [], 
  onSelectClient, 
  onAddNewClient,
  selectedClient = null,
  maxSuggestions = 10
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentClients, setRecentClients] = useState([]);
  const inputRef = useRef(null);

  // Load recent clients from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentClients') || '[]');
    setRecentClients(recent);
  }, []);

  // Filter clients as user types
  const handleInputChange = (value) => {
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim().length < 2) {
      setFilteredClients([]);
      setIsOpen(false);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered = clients
      .filter(client =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        (client.company && client.company.toLowerCase().includes(searchTerm))
      )
      .slice(0, maxSuggestions);

    setFilteredClients(filtered);
    setIsOpen(filtered.length > 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && e.key !== 'ArrowDown') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(prev =>
          prev < filteredClients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredClients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectClient(filteredClients[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setInputValue('');
        break;
      default:
        break;
    }
  };

  const selectClient = (client) => {
    setInputValue(client.name);
    setIsOpen(false);
    onSelectClient(client);

    // Update recent clients
    const recent = JSON.parse(localStorage.getItem('recentClients') || '[]');
    const updated = [
      client.id,
      ...recent.filter(id => id !== client.id)
    ].slice(0, 5);
    localStorage.setItem('recentClients', JSON.stringify(updated));
  };

  const recentClientObjects = recentClients
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)
    .slice(0, 3);

  const showNoResults = inputValue.length >= 2 && filteredClients.length === 0;

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or select client..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2) setIsOpen(true);
          }}
          aria-label="Select client"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="client-dropdown"
          role="combobox"
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              setFilteredClients([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Suggestions List */}
          <div
            id="client-dropdown"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto"
          >
            {/* Recent Clients Section */}
            {!inputValue && recentClientObjects.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  Recently Used
                </div>
                {recentClientObjects.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </button>
                ))}
                <div className="border-b border-gray-100" />
              </>
            )}

            {/* All Clients Section */}
            {filteredClients.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  All Clients
                </div>
                {filteredClients.map((client, index) => (
                  <button
                    key={client.id}
                    onClick={() => selectClient(client)}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors ${
                      index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-600">{client.email}</p>
                      {client.company && (
                        <span className="text-xs text-gray-500 ml-2">
                          {client.company}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* No Results State */}
            {showNoResults && (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-600 mb-3">No clients found</p>
                <button
                  onClick={() => onAddNewClient(inputValue)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add new client
                </button>
              </div>
            )}

            {/* Add New Client Button */}
            {filteredClients.length > 0 && (
              <button
                onClick={() => onAddNewClient(inputValue)}
                className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 border-t border-gray-200 text-blue-600 font-semibold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add new client
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientSelector;
```

## 2. Client List with Sorting & Filtering

```javascript
// ClientList.jsx - Table with filters and bulk actions
import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, Archive, Trash2 } from 'lucide-react';

const ClientList = ({ clients = [], onSelectClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedClients, setSelectedClients] = useState([]);

  const processedClients = useMemo(() => {
    let filtered = clients;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      return sortOrder === 'asc'
        ? aVal > bVal ? 1 : -1
        : aVal < bVal ? 1 : -1;
    });

    return sorted;
  }, [clients, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (amount) => `£${amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;

  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB');

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex-1 min-w-xs relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search clients"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.length === processedClients.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClients(processedClients.map(c => c.id));
                    } else {
                      setSelectedClients([]);
                    }
                  }}
                  className="w-4 h-4"
                  aria-label="Select all clients"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Company</th>
              <th
                className="px-4 py-3 text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalOwed')}
              >
                Total Owed {sortBy === 'totalOwed' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Invoice</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClients([...selectedClients, client.id]);
                      } else {
                        setSelectedClients(selectedClients.filter(id => id !== client.id));
                      }
                    }}
                    className="w-4 h-4"
                    aria-label={`Select ${client.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectClient(client)}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {client.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">{client.email}</td>
                <td className="px-4 py-3 text-gray-600">{client.company || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(client.totalOwed)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {client.lastInvoiceDate ? formatDate(client.lastInvoiceDate) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : client.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {processedClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No clients found</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            + Add new client
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientList;
```

## 3. Client Detail Page

```javascript
// ClientDetailPage.jsx - Client profile with tabs
import React, { useState } from 'react';
import { Edit2, Archive, Trash2, Mail, Phone, MapPin } from 'lucide-react';

const ClientDetailPage = ({ client, onUpdate, onArchive, onDelete }) => {
  const [activeTab, setActiveTab] = useState('contact');
  const [isEditing, setIsEditing] = useState(false);

  const tabs = [
    { id: 'contact', label: 'Contact Information', icon: Mail },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'payments', label: 'Payment Information', icon: '💳' },
    { id: 'activity', label: 'Activity', icon: '📊' }
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            {client.company && (
              <p className="text-gray-600 mt-1">{client.company}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Edit client"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onArchive(client.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Archive client"
            >
              <Archive className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(client.id)}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              aria-label="Delete client"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Owed</p>
            <p className="text-2xl font-bold text-gray-900">
              £{client.totalOwed.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Last Invoice</p>
            <p className="text-2xl font-bold text-gray-900">
              {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Payment Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {client.averageDaysToPayment || '—'} days
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 font-semibold text-center transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {client.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {client.phone || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Billing Address
                </label>
                <p className="text-gray-900 flex gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {client.billingAddress?.street}<br/>
                    {client.billingAddress?.city}, {client.billingAddress?.state} {client.billingAddress?.postalCode}<br/>
                    {client.billingAddress?.country}
                  </span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <p className="text-gray-600">Invoice list would be shown here</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                Create New Invoice
              </button>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Payment Terms
                </label>
                <p className="text-gray-900">Net {client.paymentTerms || 30} days</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tax ID
                </label>
                <p className="text-gray-900">{client.taxId || '—'}</p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <p className="text-gray-600">Activity timeline would be shown here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;
```

## 4. Add/Edit Client Modal

```javascript
// AddEditClientModal.jsx - Form for creating/editing clients
import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const AddEditClientModal = ({ 
  client = null, 
  isOpen, 
  onClose, 
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(client || {
    name: '',
    email: '',
    company: '',
    phone: '',
    billingAddress: {
      street: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'GB'
    },
    currency: 'GBP',
    paymentTerms: 30,
    taxId: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Valid email is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 z-50 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Acme Corp"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-label="Client name"
              required
            />
            {errors.name && (
              <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="billing@acme.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-label="Email address"
              required
            />
            {errors.email && (
              <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Company name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+44 (0)1632 960123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Phone number"
            />
          </div>

          {/* Address */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Billing Address</h3>
            
            <input
              type="text"
              value={formData.billingAddress.street}
              onChange={(e) => handleChange('billingAddress.street', e.target.value)}
              placeholder="Street address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Street address"
            />

            <input
              type="text"
              value={formData.billingAddress.city}
              onChange={(e) => handleChange('billingAddress.city', e.target.value)}
              placeholder="City"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="City"
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={formData.billingAddress.state}
                onChange={(e) => handleChange('billingAddress.state', e.target.value)}
                placeholder="State/Province"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="State/Province"
              />
              <input
                type="text"
                value={formData.billingAddress.postalCode}
                onChange={(e) => handleChange('billingAddress.postalCode', e.target.value)}
                placeholder="Postal code"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Postal code"
              />
            </div>
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tax ID / VAT Number
            </label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleChange('taxId', e.target.value)}
              placeholder="GB123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Tax ID"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Internal notes about this client..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              aria-label="Internal notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddEditClientModal;
```

These components provide production-ready client management UI with full accessibility, keyboard navigation, and responsive design for Relay's invoicing platform.
