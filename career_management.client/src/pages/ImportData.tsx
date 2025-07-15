import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download, Info } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

interface Position {
  positionID: number;
  positionTitle: string;
}

const ImportData = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('Please select a valid Excel file (.xlsx, .xls, .xlsm)');
        event.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('https://localhost:7026/api/Employees/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message,
          importedCount: result.importedCount,
        });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setImportResult({
          success: false,
          message: result.message || 'Import failed',
          errors: result.errors,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'An error occurred during import. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Fetch available positions
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('https://localhost:7026/api/Employees/positions');
        if (response.ok) {
          const data = await response.json();
          setPositions(data);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        setLoadingPositions(false);
      }
    };

    fetchPositions();
  }, []);

  const downloadTemplate = () => {
    // Create CSV template with headers
    const headers = ['EmployeeCode', 'FirstName', 'LastName', 'PositionName', 'DateOfBirth', 'Gender', 'Phone', 'Email', 'HireDate'];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link 
              to="/home"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Import Data
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Employee Data</h2>
            <p className="text-gray-600 mb-6">
              Upload an Excel file to import employee data into the system. The file should contain the following columns:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Required Excel Columns:</h3>
                             <ul className="text-sm text-blue-800 space-y-1">
                 <li><strong>EmployeeCode</strong> - Employee identification code (optional)</li>
                 <li><strong>FirstName</strong> - Employee's first name (required)</li>
                 <li><strong>LastName</strong> - Employee's last name (required)</li>
                 <li><strong>PositionName</strong> - Position name from the system (required)</li>
                 <li><strong>DateOfBirth</strong> - Date of birth (YYYY-MM-DD format, optional)</li>
                 <li><strong>Gender</strong> - Gender (optional)</li>
                 <li><strong>Phone</strong> - Phone number (optional)</li>
                 <li><strong>Email</strong> - Email address (optional)</li>
                 <li><strong>HireDate</strong> - Hire date (YYYY-MM-DD format, optional)</li>
               </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
                             <ul className="text-sm text-yellow-800 space-y-1">
                 <li>• The first row should contain column headers</li>
                 <li>• PositionName must match exactly with positions in the system</li>
                 <li>• Dates should be in YYYY-MM-DD format</li>
                 <li>• Duplicate EmployeeCode entries will be skipped</li>
                 <li>• Supported file formats: .xlsx, .xls, .xlsm</li>
               </ul>
            </div>

            {/* Available Positions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">Available Positions</h3>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>
              {loadingPositions ? (
                <div className="flex items-center space-x-2 text-blue-800">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading positions...</span>
                </div>
                             ) : positions.length > 0 ? (
                 <div className="max-h-40 overflow-y-auto">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                     {positions.map((position) => (
                       <div key={position.positionID} className="flex justify-between items-center bg-white p-2 rounded border">
                         <span className="text-left text-blue-900 font-medium">{position.positionTitle}</span>
                         
                       </div>
                     ))}
                   </div>
                 </div>
              ) : (
                <div className="flex items-center space-x-2 text-blue-800">
                  <Info className="w-4 h-4" />
                  <span>No positions available. Please create positions first.</span>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroEnabled.12"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedFile ? (
              <div>
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Excel file to import
                </h3>
                <p className="text-gray-500 mb-4">
                  Click the button below to browse and select your Excel file
                </p>
                <button
                  onClick={handleBrowseClick}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Browse Files</span>
                </button>
              </div>
            ) : (
              <div>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  File Selected
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Import Data</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Import Results */}
          {importResult && (
            <div className={`mt-6 p-4 rounded-lg ${
              importResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {importResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    importResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResult.success ? 'Import Successful' : 'Import Failed'}
                  </h3>
                  <p className={`text-sm ${
                    importResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importResult.message}
                  </p>
                  {importResult.importedCount !== undefined && (
                    <p className="text-sm text-green-800 mt-1">
                      Successfully imported {importResult.importedCount} employee(s).
                    </p>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-red-500">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportData; 