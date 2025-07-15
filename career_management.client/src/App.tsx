import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import OrganizationManagement from './pages/OrganizationManagement';
import CompetencyManagement from './pages/CompetencyManagement';
import EmployeeDevelopment from './pages/EmployeeDevelopment';
import ImportData from './pages/ImportData';
import TestNotification from './components/TestNotification';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/organization-management/*" element={<OrganizationManagement />} />
          <Route path="/competency-management/*" element={<CompetencyManagement />} />
          <Route path="/employee-development/*" element={<EmployeeDevelopment />} />
          <Route path="/import-data" element={<ImportData />} />
          <Route path="/test-notification" element={<TestNotification />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;