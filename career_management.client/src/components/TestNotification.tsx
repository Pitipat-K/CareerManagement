import { useState, useEffect } from 'react';
import { Send, Settings, Users, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface TestEmailRequest {
  employeeName?: string;
  managerEmail?: string;
  positionTitle?: string;
  departmentName?: string;
  assessmentPeriod?: string;
  completionDate?: string;
  totalCompetencies?: number;
  averageScore?: number;
  competenciesNeedingAttention?: number;
}

interface Employee {
  employeeID: number;
  employeeName: string;
  employeeEmail: string;
  positionTitle: string;
  departmentName: string;
  managerID?: number;
  hasManager: boolean;
}

interface Manager {
  employeeID: number;
  employeeName: string;
  email: string;
  positionTitle: string;
}

const TestNotification = () => {
  const [testData, setTestData] = useState<TestEmailRequest>({
    employeeName: 'John Doe',
    managerEmail: '',
    positionTitle: 'Software Developer',
    departmentName: 'IT Department',
    assessmentPeriod: 'Q1 2025',
    completionDate: new Date().toISOString().split('T')[0],
    totalCompetencies: 10,
    averageScore: 3.5,
    competenciesNeedingAttention: 2
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
    testConfiguration();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://localhost:7026/api/TestNotification/employees-with-managers');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('https://localhost:7026/api/TestNotification/managers');
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const testConfiguration = async () => {
    try {
      const response = await fetch('https://localhost:7026/api/TestNotification/test-config');
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
    }
  };

  const testNotificationService = async () => {
    try {
      const response = await fetch('https://localhost:7026/api/TestNotification/test-notification-service');
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const errorData = await response.json();
        setResult({ success: false, message: errorData.message || 'Test failed' });
      }
    } catch (error) {
      setResult({ success: false, message: `Error: ${error}` });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testData.managerEmail) {
      setResult({ success: false, message: 'Please enter a manager email address' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://localhost:7026/api/TestNotification/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: `Error: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TestEmailRequest, value: string | number) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectEmployee = (employee: Employee) => {
    setTestData(prev => ({
      ...prev,
      employeeName: employee.employeeName,
      positionTitle: employee.positionTitle,
      departmentName: employee.departmentName
    }));
  };

  const selectManager = (manager: Manager) => {
    setTestData(prev => ({
      ...prev,
      managerEmail: manager.email
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Test Email Notification</h2>
        <p className="text-sm text-gray-600">Use this tool to test the email notification system and debug issues.</p>
      </div>

      {/* Configuration Status */}
      {configStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-2">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Configuration Status</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Token Config:</span>
              <span className={`ml-2 ${configStatus.tokenConfigExists ? 'text-green-600' : 'text-red-600'}`}>
                {configStatus.tokenConfigExists ? '✓ Found' : '✗ Missing'}
              </span>
            </div>
            <div>
              <span className="font-medium">Notification Config:</span>
              <span className={`ml-2 ${configStatus.notificationConfigExists ? 'text-green-600' : 'text-red-600'}`}>
                {configStatus.notificationConfigExists ? '✓ Found' : '✗ Missing'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Form */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Email Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
            <input
              type="text"
              value={testData.employeeName || ''}
              onChange={(e) => handleInputChange('employeeName', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email *</label>
            <input
              type="email"
              value={testData.managerEmail || ''}
              onChange={(e) => handleInputChange('managerEmail', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="manager@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position Title</label>
            <input
              type="text"
              value={testData.positionTitle || ''}
              onChange={(e) => handleInputChange('positionTitle', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              type="text"
              value={testData.departmentName || ''}
              onChange={(e) => handleInputChange('departmentName', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Period</label>
            <input
              type="text"
              value={testData.assessmentPeriod || ''}
              onChange={(e) => handleInputChange('assessmentPeriod', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
            <input
              type="date"
              value={testData.completionDate || ''}
              onChange={(e) => handleInputChange('completionDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Competencies</label>
            <input
              type="number"
              value={testData.totalCompetencies || ''}
              onChange={(e) => handleInputChange('totalCompetencies', parseInt(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Average Score</label>
            <input
              type="number"
              step="0.1"
              value={testData.averageScore || ''}
              onChange={(e) => handleInputChange('averageScore', parseFloat(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competencies Needing Attention</label>
            <input
              type="number"
              value={testData.competenciesNeedingAttention || ''}
              onChange={(e) => handleInputChange('competenciesNeedingAttention', parseInt(e.target.value) || 0)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={testNotificationService}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Settings className="w-4 h-4 mr-2" />
          Test Notification Service
        </button>
        <button
          onClick={handleSendTestEmail}
          disabled={isLoading || !testData.managerEmail}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Test Email
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`p-4 rounded-lg mb-6 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </span>
          </div>
        </div>
      )}

      {/* Quick Select Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees */}
        <div>
          <div className="flex items-center mb-3">
            <Users className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Select Employee Data</h3>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {employees.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">No employees found</p>
            ) : (
              employees.map((employee) => (
                <button
                  key={employee.employeeID}
                  onClick={() => selectEmployee(employee)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm">{employee.employeeName}</div>
                  <div className="text-xs text-gray-500">
                    {employee.positionTitle} • {employee.departmentName}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Managers */}
        <div>
          <div className="flex items-center mb-3">
            <FileText className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Select Manager Email</h3>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {managers.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">No managers found</p>
            ) : (
              managers.map((manager) => (
                <button
                  key={manager.employeeID}
                  onClick={() => selectManager(manager)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm">{manager.employeeName}</div>
                  <div className="text-xs text-gray-500">{manager.email}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotification; 