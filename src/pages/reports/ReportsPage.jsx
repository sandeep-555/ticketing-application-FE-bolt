import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { exportAPI } from '@/services/api/board.api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [exportType, setExportType] = useState('tickets');
  const [format, setFormat] = useState('excel');
  const [filters, setFilters] = useState({});

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Exports</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Export tickets, reports, and time logs
        </p>
      </div>

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
