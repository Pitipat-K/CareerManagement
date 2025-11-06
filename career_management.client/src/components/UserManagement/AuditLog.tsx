import { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { userManagementApi } from '../../services/userManagementApi';
import type { User as UserType } from '../../services/userManagementApi';

interface AuditLogEntry {
  auditID: number;
  userID: number;
  userName: string;
  action: string;
  targetType: string;
  targetID: number;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  actionDate: string;
  actionByName: string;
}

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedUser, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [auditData, usersData] = await Promise.all([
        userManagementApi.getPermissionAuditLog(selectedUser || undefined, dateRange),
        userManagementApi.getUsers()
      ]);
      
      setAuditLogs(auditData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading audit data:', error);
      alert('Error loading audit data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'User', 'Action', 'Target Type', 'Old Value', 'New Value', 'Reason', 'Action By'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.actionDate).toLocaleString(),
        log.userName,
        log.action,
        log.targetType,
        log.oldValue || '',
        log.newValue || '',
        log.reason || '',
        log.actionByName
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = actionFilter === '' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))].sort();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
      case 'ROLE_ASSIGNED':
      case 'PERMISSION_OVERRIDE_CREATED':
        return <User className="w-4 h-4 text-green-600" />;
      case 'USER_UPDATED':
      case 'ROLE_UPDATED':
      case 'PERMISSION_OVERRIDE_UPDATED':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'USER_DELETED':
      case 'ROLE_REMOVED':
      case 'PERMISSION_OVERRIDE_DELETED':
        return <Activity className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ASSIGNED')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('UPDATED')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('DELETED') || action.includes('REMOVED')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
          <p className="text-gray-600">Track all user management and permission changes</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* User Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.userID} value={user.userID}>
                  {user.employeeFullName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">All actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(parseInt(e.target.value))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredLogs.length} of {auditLogs.length} audit entries
          </span>
          <span>
            Date range: Last {dateRange} days
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredLogs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <li key={log.auditID}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {log.userName}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{log.targetType}</span>
                          {log.reason && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="max-w-md truncate">{log.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(log.actionDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.actionDate).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {log.actionByName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Change Details */}
                  {(log.oldValue || log.newValue) && (
                    <div className="mt-3 pl-8">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {log.oldValue && (
                            <div>
                              <span className="font-medium text-gray-700">Before:</span>
                              <p className="text-gray-600 mt-1">{log.oldValue}</p>
                            </div>
                          )}
                          {log.newValue && (
                            <div>
                              <span className="font-medium text-gray-700">After:</span>
                              <p className="text-gray-600 mt-1">{log.newValue}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {auditLogs.length === 0 
                ? 'No audit entries exist for the selected time period.'
                : 'No audit entries match your current filters.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination could be added here if needed */}
      {filteredLogs.length > 50 && (
        <div className="mt-6 flex justify-center">
          <p className="text-sm text-gray-500">
            Showing first 50 results. Use filters to narrow down your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
