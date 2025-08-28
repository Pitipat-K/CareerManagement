using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Models;

namespace Career_Management.Server.Data
{
    public class CareerManagementContext : DbContext
    {
        public CareerManagementContext(DbContextOptions<CareerManagementContext> options)
            : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<LeadershipLevel> LeadershipLevels { get; set; }
        public DbSet<CompetencyDomain> CompetencyDomains { get; set; }
        public DbSet<CompetencyCategory> CompetencyCategories { get; set; }
        public DbSet<Competency> Competencies { get; set; }
        public DbSet<PositionCompetencyRequirement> PositionCompetencyRequirements { get; set; }
        public DbSet<Assessment> Assessments { get; set; }
        public DbSet<AssessmentCycle> AssessmentCycles { get; set; }
        public DbSet<CompetencyScore> CompetencyScores { get; set; }
        public DbSet<EmployeeDevelopmentPlan> EmployeeDevelopmentPlans { get; set; }
        public DbSet<JobGrade> JobGrades { get; set; }
        public DbSet<JobFunction> JobFunctions { get; set; }
        public DbSet<CompetencySet> CompetencySets { get; set; }
        public DbSet<CompetencySetItem> CompetencySetItems { get; set; }
        
        // View for Competency Progress
        public DbSet<CompetencyProgress> CompetencyProgress { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure CompetencyProgress as a keyless entity (view)
            modelBuilder.Entity<CompetencyProgress>()
                .HasNoKey()
                .ToView("vw_CompetencyProgress");

            // Configure relationships
            modelBuilder.Entity<Company>()
                .HasMany(c => c.Departments)
                .WithOne(d => d.Company)
                .HasForeignKey(d => d.CompanyID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Department>()
                .HasMany(d => d.Positions)
                .WithOne(p => p.DepartmentNavigation)
                .HasForeignKey(p => p.DepartmentID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Department>()
                .HasMany(d => d.JobFunctions)
                .WithOne(jf => jf.Department)
                .HasForeignKey(jf => jf.DepartmentID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Position>()
                .HasMany(p => p.Employees)
                .WithOne(e => e.Position)
                .HasForeignKey(e => e.PositionID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Position>()
                .HasOne(p => p.JobGrade)
                .WithMany()
                .HasForeignKey(p => p.JobGradeID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Position>()
                .HasOne(p => p.JobFunction)
                .WithMany(jf => jf.Positions)
                .HasForeignKey(p => p.JobFunctionID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Position>()
                .HasOne(p => p.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(p => p.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(e => e.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<LeadershipLevel>()
                .HasMany(l => l.Positions)
                .WithOne(p => p.LeadershipLevel)
                .HasForeignKey(p => p.LeadershipID)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure indexes
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique()
                .HasFilter("[EmployeeCode] IS NOT NULL");

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Email)
                .IsUnique()
                .HasFilter("[Email] IS NOT NULL");

            // Competency relationships
            modelBuilder.Entity<CompetencyDomain>()
                .HasMany(d => d.Categories)
                .WithOne(c => c.Domain)
                .HasForeignKey(c => c.DomainID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CompetencyDomain>()
                .HasOne(d => d.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(d => d.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CompetencyCategory>()
                .HasMany(c => c.Competencies)
                .WithOne(comp => comp.Category)
                .HasForeignKey(comp => comp.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CompetencyCategory>()
                .HasOne(c => c.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(c => c.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Competency>()
                .HasOne(c => c.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(c => c.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // PositionCompetencyRequirement relationships
            modelBuilder.Entity<PositionCompetencyRequirement>()
                .HasOne(r => r.Position)
                .WithMany(p => p.CompetencyRequirements)
                .HasForeignKey(r => r.PositionID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PositionCompetencyRequirement>()
                .HasOne(r => r.Competency)
                .WithMany(c => c.PositionRequirements)
                .HasForeignKey(r => r.CompetencyID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PositionCompetencyRequirement>()
                .HasOne(r => r.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(r => r.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Assessment relationships
            modelBuilder.Entity<Assessment>()
                .HasOne(a => a.Employee)
                .WithMany()
                .HasForeignKey(a => a.EmployeeID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Assessment>()
                .HasOne(a => a.Assessor)
                .WithMany()
                .HasForeignKey(a => a.AssessorID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<CompetencyScore>()
                .HasOne(s => s.Assessment)
                .WithMany(a => a.CompetencyScores)
                .HasForeignKey(s => s.AssessmentID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CompetencyScore>()
                .HasOne(s => s.Competency)
                .WithMany()
                .HasForeignKey(s => s.CompetencyID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CompetencyScore>()
                .HasOne(s => s.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(s => s.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Company>()
                .HasOne(c => c.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(c => c.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Department>()
                .HasOne(d => d.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(d => d.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<EmployeeDevelopmentPlan>()
                .HasOne(edp => edp.ModifiedByEmployee)
                .WithMany()
                .HasForeignKey(edp => edp.ModifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // AssessmentCycle relationships
            modelBuilder.Entity<AssessmentCycle>()
                .HasOne(ac => ac.Employee)
                .WithMany()
                .HasForeignKey(ac => ac.EmployeeID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AssessmentCycle>()
                .HasOne(ac => ac.SelfAssessment)
                .WithMany()
                .HasForeignKey(ac => ac.SelfAssessmentID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<AssessmentCycle>()
                .HasOne(ac => ac.ManagerAssessment)
                .WithMany()
                .HasForeignKey(ac => ac.ManagerAssessmentID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<AssessmentCycle>()
                .HasOne(ac => ac.CreatedByEmployee)
                .WithMany()
                .HasForeignKey(ac => ac.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // CompetencySet relationships
            modelBuilder.Entity<CompetencySet>()
                .HasOne(cs => cs.CreatedByEmployee)
                .WithMany()
                .HasForeignKey(cs => cs.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CompetencySetItem>()
                .HasOne(csi => csi.CompetencySet)
                .WithMany(cs => cs.CompetencySetItems)
                .HasForeignKey(csi => csi.SetID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CompetencySetItem>()
                .HasOne(csi => csi.Competency)
                .WithMany()
                .HasForeignKey(csi => csi.CompetencyID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
} 