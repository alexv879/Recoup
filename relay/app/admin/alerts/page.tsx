/**
 * Admin Alerts Management Page
 * View and manage system alerts
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface SystemAlert {
  alertId: string;
  severity: string;
  type: string;
  title: string;
  message: string;
  status: string;
  source: string;
  createdAt: any;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(severityFilter && { severity: severityFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/alerts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.data.alerts);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      critical: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
      high: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
      medium: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
      low: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      info: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' },
    };
    return colors[severity] || colors.info;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and manage system health alerts</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total Alerts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600">Critical</p>
            <p className="text-2xl font-bold text-red-900">{stats.bySeverity.critical}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-600">High</p>
            <p className="text-2xl font-bold text-orange-900">{stats.bySeverity.high}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-600">Medium</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.bySeverity.medium}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600">Active</p>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 flex gap-4">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const colors = getSeverityColor(alert.severity);

          return (
            <div
              key={alert.alertId}
              className={`${colors.bg} ${colors.border} border-l-4 rounded-r-lg p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${colors.text}`}>{alert.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {alert.type}
                      </span>
                    </div>
                    <p className={`text-sm ${colors.text} mb-2`}>{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Source: {alert.source}</span>
                      <span>Status: {alert.status}</span>
                      <span>
                        {new Date(alert.createdAt?.seconds * 1000 || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateAlertStatus(alert.alertId, 'acknowledged')}
                      className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => updateAlertStatus(alert.alertId, 'resolved')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>
                )}

                {alert.status === 'acknowledged' && (
                  <button
                    onClick={() => updateAlertStatus(alert.alertId, 'resolved')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 ml-4"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No alerts found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
