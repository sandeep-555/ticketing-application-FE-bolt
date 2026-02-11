import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportAPI } from '@/services/api/board.api';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [exportType, setExportType] = useState('tickets');
  const [format, setFormat] = useState('excel');
  const [filters, setFilters] = useState({});

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });

  const { data: velocityData, isLoading: velocityLoading } = useQuery({
    queryKey: ['velocity', selectedProject],
    queryFn: () => projectsAPI.getVelocity(selectedProject),
    enabled: !!selectedProject,
  });

  const { data: monthlySplitData, isLoading: monthlySplitLoading } = useQuery({
    queryKey: ['monthly-split', selectedProject],
    queryFn: () => projectsAPI.getMonthlySplit(selectedProject),
    enabled: !!selectedProject,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      let response;
      const params = { format, ...filters };

      if (exportType === 'tickets') {
        response = await exportAPI.exportTickets(params);
      } else if (exportType === 'time-logs') {
        response = await exportAPI.exportTimeLogs(params);
      } else {
        response = await exportAPI.exportReports(exportType, params);
      }

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      window.URL.revokeObjectURL(url);

      return response;
    },
    onSuccess: () => {
      toast.success('Export downloaded successfully');
    },
    onError: () => {
      toast.error('Export failed');
    },
  });

  const projects = projectsData?.data?.projects || [];
  const velocity = velocityData?.data || [];
  const monthlySplit = monthlySplitData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View project metrics and export reports
          </p>
        </div>
        <div className="w-64">
          <Select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { value: '', label: 'Select Project' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
      </div>

      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card glass>
            <CardHeader>
              <h2 className="text-xl font-bold">Sprint Velocity</h2>
            </CardHeader>
            <CardBody>
              {velocityLoading ? (
                <Loading />
              ) : velocity.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No velocity data available</p>
              ) : (
                <div className="space-y-4">
                  {velocity.map((sprint, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sprint.sprint_name || `Sprint ${index + 1}`}
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {sprint.completed_points || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Planned: {sprint.planned_points || 0} pts</span>
                        <span>Completed: {sprint.completed_tickets || 0} tickets</span>
                      </div>
                      <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              ((sprint.completed_points || 0) / (sprint.planned_points || 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card glass>
            <CardHeader>
              <h2 className="text-xl font-bold">Monthly Ticket Distribution</h2>
            </CardHeader>
            <CardBody>
              {monthlySplitLoading ? (
                <Loading />
              ) : monthlySplit.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No monthly data available</p>
              ) : (
                <div className="space-y-4">
                  {monthlySplit.map((month, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {month.month_name || month.month}
                        </span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {month.total_tickets || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Open:</span>
                          <span className="font-medium">{month.open_tickets || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                          <span className="font-medium">{month.in_progress_tickets || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Done:</span>
                          <span className="font-medium">{month.done_tickets || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Closed:</span>
                          <span className="font-medium">{month.closed_tickets || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card glass>
          <CardHeader>
            <h2 className="text-xl font-bold">Export Configuration</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Export Type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              options={[
                { value: 'tickets', label: 'Tickets' },
                { value: 'time-logs', label: 'Time Logs' },
                { value: 'monthly-effort', label: 'Monthly Effort Report' },
                { value: 'dev-vs-bau', label: 'DEV vs BAU Report' },
                { value: 'developer-breakdown', label: 'Developer Breakdown' },
              ]}
            />

            <Select
              label="Format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={[
                { value: 'excel', label: 'Excel (.xlsx)' },
                { value: 'csv', label: 'CSV (.csv)' },
              ]}
            />

            {exportType === 'monthly-effort' && (
              <>
                <Input
                  label="Month"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="1-12"
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                />
                <Input
                  label="Year"
                  type="number"
                  placeholder="2024"
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                />
              </>
            )}

            {(exportType === 'dev-vs-bau' || exportType === 'developer-breakdown') && (
              <>
                <Input
                  label="Start Date"
                  type="date"
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
                <Input
                  label="End Date"
                  type="date"
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </>
            )}

            <Button
              onClick={() => exportMutation.mutate()}
              className="w-full"
              loading={exportMutation.isPending}
            >
              Download Export
            </Button>
          </CardBody>
        </Card>

        <Card glass>
          <CardHeader>
            <h2 className="text-xl font-bold">Export Info</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Tickets Export
                </h3>
                <p>Export all tickets with details including status, priority, and assignments.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Time Logs Export
                </h3>
                <p>Export time tracking data for billing and productivity analysis.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Reports</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Monthly Effort - Time spent by category</li>
                  <li>DEV vs BAU - Development vs Business As Usual breakdown</li>
                  <li>Developer Breakdown - Individual developer performance</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
