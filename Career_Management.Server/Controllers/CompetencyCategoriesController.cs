using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class CompetencyCategoriesController : BaseAuthController
    {
        private readonly CareerManagementContext _context;

        public CompetencyCategoriesController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/CompetencyCategories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencyCategoryDto>>> GetCompetencyCategories()
        {
            var categories = await _context.CompetencyCategories
                .Include(c => c.Domain)
                .Include(c => c.ModifiedByEmployee)
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.CategoryName)
                .Select(c => new CompetencyCategoryDto
                {
                    CategoryID = c.CategoryID,
                    DomainID = c.DomainID,
                    CategoryName = c.CategoryName,
                    CategoryDescription = c.CategoryDescription,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    DomainName = c.Domain!.DomainName,
                    CreatedDate = c.CreatedDate,
                    ModifiedDate = c.ModifiedDate,
                    ModifiedBy = c.ModifiedBy,
                    ModifiedByEmployeeName = c.ModifiedByEmployee != null ? $"{c.ModifiedByEmployee.FirstName} {c.ModifiedByEmployee.LastName}" : null
                })
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/CompetencyCategories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompetencyCategoryDto>> GetCompetencyCategory(int id)
        {
            var category = await _context.CompetencyCategories
                .Include(c => c.Domain)
                .Include(c => c.ModifiedByEmployee)
                .Where(c => c.CategoryID == id && c.IsActive)
                .Select(c => new CompetencyCategoryDto
                {
                    CategoryID = c.CategoryID,
                    DomainID = c.DomainID,
                    CategoryName = c.CategoryName,
                    CategoryDescription = c.CategoryDescription,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    DomainName = c.Domain!.DomainName,
                    CreatedDate = c.CreatedDate,
                    ModifiedDate = c.ModifiedDate,
                    ModifiedBy = c.ModifiedBy,
                    ModifiedByEmployeeName = c.ModifiedByEmployee != null ? $"{c.ModifiedByEmployee.FirstName} {c.ModifiedByEmployee.LastName}" : null
                })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                return NotFound();
            }

            return Ok(category);
        }

        // POST: api/CompetencyCategories
        [HttpPost]
        public async Task<ActionResult<CompetencyCategoryDto>> CreateCompetencyCategory(CompetencyCategory category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            category.IsActive = true;
            category.CreatedDate = DateTime.Now;
            category.ModifiedDate = DateTime.Now;
            _context.CompetencyCategories.Add(category);
            await _context.SaveChangesAsync();

            var categoryDto = new CompetencyCategoryDto
            {
                CategoryID = category.CategoryID,
                DomainID = category.DomainID,
                CategoryName = category.CategoryName,
                CategoryDescription = category.CategoryDescription,
                DisplayOrder = category.DisplayOrder,
                IsActive = category.IsActive,
                CreatedDate = category.CreatedDate,
                ModifiedDate = category.ModifiedDate,
                ModifiedBy = category.ModifiedBy,
                ModifiedByEmployeeName = null // Will be populated when retrieved
            };

            return CreatedAtAction(nameof(GetCompetencyCategory), new { id = category.CategoryID }, categoryDto);
        }

        // PUT: api/CompetencyCategories/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompetencyCategory(int id, CompetencyCategory category)
        {
            if (id != category.CategoryID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCategory = await _context.CompetencyCategories.FindAsync(id);
            if (existingCategory == null)
            {
                return NotFound();
            }

            existingCategory.DomainID = category.DomainID;
            existingCategory.CategoryName = category.CategoryName;
            existingCategory.CategoryDescription = category.CategoryDescription;
            existingCategory.DisplayOrder = category.DisplayOrder;
            existingCategory.IsActive = category.IsActive;
            existingCategory.ModifiedDate = DateTime.Now;
            existingCategory.ModifiedBy = category.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompetencyCategoryExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/CompetencyCategories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetencyCategory(int id, [FromQuery] int? modifiedBy)
        {
            var category = await _context.CompetencyCategories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            // Check if category has competencies
            var hasCompetencies = await _context.Competencies
                .AnyAsync(c => c.CategoryID == id && c.IsActive);

            if (hasCompetencies)
            {
                return BadRequest("Cannot delete category that has active competencies.");
            }

            category.IsActive = false;
            category.ModifiedDate = DateTime.Now;
            category.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompetencyCategoryExists(int id)
        {
            return _context.CompetencyCategories.Any(e => e.CategoryID == id);
        }
    }
} 