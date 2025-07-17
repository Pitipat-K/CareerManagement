import { User, Mail, Phone, Calendar, Building } from 'lucide-react';

interface Employee {
  employeeID: number;
  firstName: string;
  lastName: string;
  positionTitle: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  employeeCode?: string;
  dateOfBirth?: string;
  gender?: string;
  positionDescription?: string;
  managerName?: string;
  departmentName?: string;
  jobGroup?: string;
  jobGrade?: string;
  companyName?: string;
}

interface EmployeeProfileProps {
  employee: Employee | null;
}

const EmployeeProfile = ({ employee }: EmployeeProfileProps) => {
  if (!employee) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Employee data not available</p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border text-left">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 text-left">
        <h2 className="text-xl font-semibold text-gray-900 text-left">Employee Profile</h2>
        <p className="text-sm text-gray-600 text-left">Personal and professional information</p>
      </div>

      <div className="p-6 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          {/* Personal Information */}
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center text-left">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Personal Information
            </h3>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left">Full Name</label>
                <p className="mt-1 text-sm text-gray-900 text-left">
                  {employee.firstName} {employee.lastName}
                </p>
              </div>
              
              {employee.employeeCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Employee Code</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.employeeCode}</p>
                </div>
              )}

              {employee.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Email</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center text-left">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {employee.email}
                  </p>
                </div>
              )}

              {employee.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center text-left">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {employee.phone}
                  </p>
                </div>
              )}

              {employee.dateOfBirth && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center text-left">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(employee.dateOfBirth)}
                  </p>
                </div>
              )}

              {employee.gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Gender</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.gender}</p>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center text-left">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Professional Information
            </h3>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left">Position</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center text-left">
                  {employee.positionTitle}
                </p>
              </div>

              {/* New fields */}
              {employee.positionDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Position Description</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.positionDescription}</p>
                </div>
              )}
              {employee.managerName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Manager</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.managerName}</p>
                </div>
              )}
              {employee.departmentName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Department</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.departmentName}</p>
                </div>
              )}
              {employee.jobGroup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Job Group</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.jobGroup}</p>
                </div>
              )}
              {employee.jobGrade && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Job Grade</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.jobGrade}</p>
                </div>
              )}
              {employee.companyName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Company</label>
                  <p className="mt-1 text-sm text-gray-900 text-left">{employee.companyName}</p>
                </div>
              )}

              {employee.hireDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Hire Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center text-left">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(employee.hireDate)}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-left">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Additional Information</h3>
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 text-left">
              This profile contains the employee's basic information. For detailed competency assessments 
              and development plans, please use the Competency Assessment section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile; 