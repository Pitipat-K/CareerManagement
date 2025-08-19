import { useState, useEffect } from 'react';
import { TrendingUp, Users, Building, Target, ArrowRight, CheckCircle, AlertCircle, X } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface CareerNavigatorProps {
  employeeId: number | null;
}

interface Position {
  positionID: number;
  positionTitle: string;
  positionDescription?: string;
  departmentName?: string;
  jobGrade?: string;
  jobGradeLevel?: number;
  leadershipLevel?: string;
  experienceRequirement?: number;
  requiredCompetencies?: CompetencyRequirement[];
}

interface CompetencyRequirement {
  competencyID: number;
  competencyName: string;
  requiredLevel: number;
  isMandatory: boolean;
}

interface EmployeeCompetency {
  competencyID: number;
  competencyName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
}

interface CareerPath {
  currentPosition: Position;
  verticalOpportunities: Position[];
  lateralOpportunities: Position[];
  crossDepartmentOpportunities: Position[];
  skillGaps: EmployeeCompetency[];
}

const CareerNavigator = ({ employeeId }: CareerNavigatorProps) => {
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Position | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchCareerPathData();
    }
  }, [employeeId]);

  const fetchCareerPathData = async () => {
    try {
      setLoading(true);
      
      // Fetch employee's current position and related data
      const employeeResponse = await fetch(getApiUrl(`Employees/${employeeId}`));
      const employeeData = await employeeResponse.json();
      
      // Get current position with competency requirements
      const allPositionsResponse = await fetch(getApiUrl('Positions/career-navigator'));
      const allPositions = await allPositionsResponse.json();
      const currentPosition = allPositions.find((p: any) => p.positionID === employeeData.positionID);
      
      if (!currentPosition) {
        throw new Error('Current position not found');
      }
      
      // Fetch employee's competency scores
      const competencyScoresResponse = await fetch(getApiUrl(`CompetencyScores/employee/${employeeId}`));
      const competencyScores = await competencyScoresResponse.json();
      
      // Analyze career opportunities
      const opportunities = analyzeCareerOpportunities(currentPosition, allPositions, competencyScores);
      
      setCareerPath(opportunities);
    } catch (error) {
      console.error('Error fetching career path data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCareerOpportunities = (
    currentPosition: Position, 
    allPositions: any[], 
    competencyScores: any[]
  ): CareerPath => {
    // Filter out current position
    const otherPositions = allPositions.filter((p: any) => p.positionID !== currentPosition.positionID);
    
    // Vertical opportunities (same department, higher level)
    const verticalOpportunities = otherPositions.filter((p: any) => 
      p.departmentName === currentPosition.departmentName && 
      p.jobGradeLevel && currentPosition.jobGradeLevel &&
      p.jobGradeLevel > currentPosition.jobGradeLevel
    );
    
    // Lateral opportunities (same department, similar level)
    const lateralOpportunities = otherPositions.filter((p: any) => 
      p.departmentName === currentPosition.departmentName && 
      p.jobGradeLevel === currentPosition.jobGradeLevel
    );
    
    // Cross-department opportunities
    const crossDepartmentOpportunities = otherPositions.filter((p: any) => 
      p.departmentName !== currentPosition.departmentName
    );
    
    // Analyze skill gaps based on current position requirements
    const currentPositionRequirements = currentPosition.requiredCompetencies || [];
    const skillGaps = currentPositionRequirements.map((req: any) => {
      const employeeScore = competencyScores.find((score: any) => score.competencyID === req.competencyID);
      const currentLevel = employeeScore ? employeeScore.currentLevel : 0;
      return {
        competencyID: req.competencyID,
        competencyName: req.competencyName,
        currentLevel: currentLevel,
        requiredLevel: req.requiredLevel,
        gap: Math.max(0, req.requiredLevel - currentLevel)
      };
    });
    
    return {
      currentPosition,
      verticalOpportunities,
      lateralOpportunities,
      crossDepartmentOpportunities,
      skillGaps
    };
  };

  const getGapColor = (gap: number) => {
    if (gap === 0) return 'text-green-600';
    if (gap <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGapIcon = (gap: number) => {
    if (gap === 0) return <CheckCircle className="w-4 h-4" />;
    if (gap <= 2) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!careerPath) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load career path data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Position */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-left text-gray-900">Current Position</h2>
            <p className="text-sm text-left text-gray-600">Your current role and responsibilities</p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">{careerPath.currentPosition.positionTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Department:</span>
              <span className="ml-2 text-gray-600">{careerPath.currentPosition.departmentName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Job Grade:</span>
              <span className="ml-2 text-gray-600">{careerPath.currentPosition.jobGrade}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Leadership Level:</span>
              <span className="ml-2 text-gray-600">{careerPath.currentPosition.leadershipLevel}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Experience Required:</span>
              <span className="ml-2 text-gray-600">{careerPath.currentPosition.experienceRequirement} years</span>
            </div>
          </div>
          {careerPath.currentPosition.positionDescription && (
            <div className="mt-3">
              <span className="font-medium text-gray-700">Description:</span>
              <p className="mt-1 text-gray-600">{careerPath.currentPosition.positionDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Career Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Growth */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Vertical Growth</h3>
              <p className="text-xs text-gray-600">Promotion opportunities</p>
            </div>
          </div>
          
          {careerPath.verticalOpportunities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#86efac #f1f5f9' }}>
              {careerPath.verticalOpportunities.map((position) => (
                <div 
                  key={position.positionID}
                  className="p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => setSelectedOpportunity(position)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-left text-green-900">{position.positionTitle}</h4>
                      <p className="text-xs text-left text-green-700">{position.departmentName}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No immediate promotion opportunities available.</p>
          )}
        </div>

        {/* Lateral Moves */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Lateral Moves</h3>
              <p className="text-xs text-gray-600">Same level opportunities</p>
            </div>
          </div>
          
          {careerPath.lateralOpportunities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#93c5fd #f1f5f9' }}>
              {careerPath.lateralOpportunities.map((position) => (
                <div 
                  key={position.positionID}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => setSelectedOpportunity(position)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-left text-blue-900">{position.positionTitle}</h4>
                      <p className="text-xs text-left text-blue-700">{position.departmentName}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No lateral opportunities available.</p>
          )}
        </div>

        {/* Cross-Department */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Building className="w-4 h-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Cross-Department</h3>
              <p className="text-xs text-gray-600">Other departments</p>
            </div>
          </div>
          
          {careerPath.crossDepartmentOpportunities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c4b5fd #f1f5f9' }}>
              {careerPath.crossDepartmentOpportunities.map((position) => (
                <div 
                  key={position.positionID}
                  className="p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => setSelectedOpportunity(position)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-left text-purple-900">{position.positionTitle}</h4>
                      <p className="text-xs text-left text-purple-700">{position.departmentName}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No cross-department opportunities available.</p>
          )}
        </div>
      </div>

      {/* Skill Gap Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">Skill Gap Analysis</h2>
            <p className="text-sm text-gray-600">Areas for development</p>
          </div>
        </div>
        
        {careerPath.skillGaps.length > 0 ? (
          <div className="space-y-3">
            {careerPath.skillGaps
              .filter(gap => gap.gap > 0)
              .sort((a, b) => b.gap - a.gap)
              .slice(0, 5)
              .map((gap) => (
                <div key={gap.competencyID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getGapIcon(gap.gap)}
                    <span className="ml-2 font-medium text-gray-900">{gap.competencyName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Current: {gap.currentLevel}
                    </span>
                    <span className="text-sm text-gray-600">
                      Required: {gap.requiredLevel}
                    </span>
                    <span className={`text-sm font-medium ${getGapColor(gap.gap)}`}>
                      Gap: {gap.gap}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No skill gaps identified.</p>
        )}
      </div>

      {/* Selected Opportunity Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Position Details</h3>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedOpportunity.positionTitle}</h4>
                  <p className="text-sm text-gray-600">{selectedOpportunity.departmentName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Job Grade:</span>
                    <span className="ml-2 text-gray-600">{selectedOpportunity.jobGrade}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Leadership Level:</span>
                    <span className="ml-2 text-gray-600">{selectedOpportunity.leadershipLevel}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Experience Required:</span>
                    <span className="ml-2 text-gray-600">{selectedOpportunity.experienceRequirement} years</span>
                  </div>
                </div>
                
                {selectedOpportunity.positionDescription && (
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="mt-1 text-gray-600">{selectedOpportunity.positionDescription}</p>
                  </div>
                )}
                
                {selectedOpportunity.requiredCompetencies && selectedOpportunity.requiredCompetencies.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Required Competencies:</span>
                    <div className="mt-2 space-y-2">
                      {selectedOpportunity.requiredCompetencies.map((comp) => (
                        <div key={comp.competencyID} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{comp.competencyName}</span>
                          <span className="font-medium text-gray-900">Level {comp.requiredLevel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerNavigator;
