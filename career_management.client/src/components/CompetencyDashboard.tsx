import { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { getApiUrl } from '../config/api';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface CompetencyAssessmentDto {
  competencyID: number;
  competencyName: string;
  categoryName: string;
  domainName: string;
  requiredLevel: number;
  selfLevel?: number;
  managerLevel?: number;
}

interface AssessmentWithCompetenciesDto {
  assessmentID: number;
  employeeID: number;
  assessmentPeriod?: string;
  status: string;
  competencies: CompetencyAssessmentDto[];
}

interface CompetencyDashboardProps {
  employeeId: number | null;
}

const CompetencyDashboard = ({ employeeId }: CompetencyDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerAssessment, setManagerAssessment] = useState<AssessmentWithCompetenciesDto | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    fetchAssessments();
    // eslint-disable-next-line
  }, [employeeId]);

  const fetchAssessments = async () => {
    try {
      // Fetch assessment cycles for the employee
      const cyclesRes = await fetch(getApiUrl(`AssessmentCycles/employee/${employeeId}`));
      if (!cyclesRes.ok) throw new Error('Failed to fetch assessment cycles');
      const cycles = await cyclesRes.json();
      // Find the latest completed cycle
      const completedCycles = cycles.filter((c: any) => c.status === 'Completed');
      const latestCycle = completedCycles.length > 0 ? completedCycles[0] : null;
      if (!latestCycle) {
        setError('No completed assessment cycles found.');
        setLoading(false);
        return;
      }
      // Fetch combined assessment data for the cycle
      const combinedRes = await fetch(getApiUrl(`Assessments/cycle/${latestCycle.cycleID}/combined`));
      if (!combinedRes.ok) throw new Error('Failed to fetch combined assessment data');
      const combinedData = await combinedRes.json();
      setManagerAssessment({
        ...combinedData,
        competencies: combinedData.competencies.map((c: any) => ({ ...c })),
      });
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Group competencies by domain
  const groupByDomain = (competencies: CompetencyAssessmentDto[]) => {
    const domains: { [domain: string]: CompetencyAssessmentDto[] } = {};
    competencies.forEach((c) => {
      if (!domains[c.domainName]) domains[c.domainName] = [];
      domains[c.domainName].push(c);
    });
    return domains;
  };

  // Group competencies by category

  // Get competencies for specific domain or category
  const getCompetenciesForChart = (competencies: CompetencyAssessmentDto[], filterType: 'domain' | 'category', filterValue: string) => {
    return competencies.filter(c => 
      filterType === 'domain' ? c.domainName === filterValue : c.categoryName === filterValue
    );
  };

  // Utility to wrap text for radar chart labels
  const wrapLabel = (label: string, maxLen: number) => {
    if (label.length <= maxLen) return label;
    const words = label.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + (currentLine ? ' ' : '') + word).length > maxLen) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Prepare radar chart data
  const getRadarData = (
    competencies: CompetencyAssessmentDto[],
    valueKey: 'selfLevel' | 'managerLevel',
  ) => {
    const labels = competencies.map((c) => wrapLabel(c.competencyName, 30));
    const values = competencies.map((c) => (c[valueKey] ?? 0));
    const targets = competencies.map((c) => c.requiredLevel);
    return {
      labels,
      datasets: [
        {
          label: 'Score',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        {
          label: 'Target',
          data: targets,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }
  if (!managerAssessment) {
    return <div className="text-center py-12 text-gray-500">No assessment data available.</div>;
  }

  const domains = groupByDomain(managerAssessment.competencies);

  // Debug: Log what's in each domain
  console.log('All domains:', domains);
  console.log('Knowledge domain competencies:', domains['Knowledge'] || []);
  console.log('Attributes domain competencies:', domains['Attributes'] || []);



  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl text-left font-semibold text-gray-900">Competency Dashboard</h2>
        <p className="text-sm text-left text-gray-600">Manager assessment scores for different competency areas</p>
      </div>
      

      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Knowledge (Domain) */}
          <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Knowledge (Domain)</h3>
            <Radar
              data={getRadarData(
                getCompetenciesForChart(managerAssessment.competencies, 'domain', 'Knowledge'),
                'managerLevel'
              )}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  r: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } },
                  },
                },
                plugins: {
                  legend: { position: 'bottom' as const },
                },
              }}
              style={{ width: '100%', maxWidth: 350, height: 350 }}
            />
          </div>

          {/* 2. Technical Knowledge (Category) */}
          <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Technical Knowledge (Category)</h3>
            <Radar
              data={getRadarData(
                getCompetenciesForChart(managerAssessment.competencies, 'category', 'Technical knowledge'),
                'managerLevel'
              )}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  r: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } },
                  },
                },
                plugins: {
                  legend: { position: 'bottom' as const },
                },
              }}
              style={{ width: '100%', maxWidth: 350, height: 350 }}
            />
          </div>

          {/* 3. Core Skills (Category) */}
          <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Core Skills (Category)</h3>
            <Radar
              data={getRadarData(
                getCompetenciesForChart(managerAssessment.competencies, 'category', 'Core skills'),
                'managerLevel'
              )}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  r: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } },
                  },
                },
                plugins: {
                  legend: { position: 'bottom' as const },
                },
              }}
              style={{ width: '100%', maxWidth: 350, height: 350 }}
            />
          </div>

          {/* 4. English Language Skills (Category) */}
          <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">English Language Skills (Category)</h3>
            <Radar
              data={getRadarData(
                getCompetenciesForChart(managerAssessment.competencies, 'category', 'English language skill'),
                'managerLevel'
              )}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  r: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } },
                  },
                },
                plugins: {
                  legend: { position: 'bottom' as const },
                },
              }}
              style={{ width: '100%', maxWidth: 350, height: 350 }}
            />
          </div>

          {/* 5. Attributes (Domain) */}
          <div className="bg-gray-50 rounded-lg border p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Attributes (Domain)</h3>
            <Radar
              data={getRadarData(
                getCompetenciesForChart(managerAssessment.competencies, 'domain', 'Attributes'),
                'managerLevel'
              )}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  r: {
                    min: 0,
                    max: 4,
                    ticks: { stepSize: 1, display: false },
                    pointLabels: { font: { size: 10 } },
                  },
                },
                plugins: {
                  legend: { position: 'bottom' as const },
                },
              }}
              style={{ width: '100%', maxWidth: 350, height: 350 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetencyDashboard; 