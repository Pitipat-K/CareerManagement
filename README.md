# Career Management System

A comprehensive career management application built with React frontend and ASP.NET Core backend.

## Features

- **Organization Management**: Manage employees, positions, departments, and companies
- **Employee Management**: Add, view, edit, and delete employee records
- **Position Management**: Manage job positions and their requirements
- **Department Management**: Organize departments within companies
- **Company Management**: Manage multiple companies and their structures
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Real-time Data**: Live data updates with RESTful API

## Technology Stack

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- SQL Server
- RESTful API

### Frontend
- React 19
- TypeScript
- React Router DOM
- Tailwind CSS
- Lucide React Icons
- Axios for API calls

## Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- SQL Server (Azure SQL Database or local)

## Database Setup

The application uses the following database connection:
- Server: alt-sql01.database.windows.net
- Database: CareerManagementDB
- User: altazureadmin

The database schema is defined in `Career_Management.Server/Database_info/Data_Structure.txt`.

## Getting Started

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Career_Management.Server
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Run Entity Framework migrations (if needed):
   ```bash
   dotnet ef database update
   ```

4. Start the backend server:
   ```bash
   dotnet run
   ```

The backend will be available at `https://localhost:7001`

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd career_management.client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
Career_Management/
├── Career_Management.Server/          # ASP.NET Core Backend
│   ├── Controllers/                   # API Controllers
│   ├── Data/                         # Entity Framework Context
│   ├── Models/                       # Entity Models
│   ├── Database_info/                # Database configuration
│   └── Program.cs                    # Application entry point
├── career_management.client/         # React Frontend
│   ├── src/
│   │   ├── components/               # React Components
│   │   ├── pages/                    # Page Components
│   │   ├── App.tsx                   # Main App Component
│   │   └── main.tsx                  # Application entry point
│   ├── package.json                  # Frontend dependencies
│   └── tailwind.config.js           # Tailwind CSS configuration
└── README.md                         # This file
```

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies
- `GET /api/companies/{id}` - Get company by ID
- `POST /api/companies` - Create new company
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/{id}` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Positions
- `GET /api/positions` - Get all positions
- `GET /api/positions/{id}` - Get position by ID
- `POST /api/positions` - Create new position
- `PUT /api/positions/{id}` - Update position
- `DELETE /api/positions/{id}` - Delete position

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

## Usage

1. **Home Page**: Navigate to the home page to see the main dashboard
2. **Organization Management**: Click on "Organization Management" to access the management interface
3. **Sidebar Navigation**: Use the sidebar to switch between Employees, Positions, Departments, and Companies
4. **CRUD Operations**: Each section supports Create, Read, Update, and Delete operations
5. **Search**: Use the search functionality to filter records
6. **Responsive Design**: The application works on desktop and mobile devices

## Development

### Adding New Features

1. **Backend**: Add new models, controllers, and update the DbContext
2. **Frontend**: Create new components and update routing
3. **Database**: Update the database schema if needed

### Code Style

- Follow C# coding conventions for backend
- Use TypeScript for frontend development
- Follow React best practices
- Use Tailwind CSS for styling

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure the database is accessible and credentials are correct
2. **CORS Issues**: The backend is configured to allow requests from the frontend development server
3. **Port Conflicts**: Make sure ports 7001 (backend) and 5173 (frontend) are available

### Logs

- Backend logs are available in the console when running `dotnet run`
- Frontend logs are available in the browser developer tools

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 