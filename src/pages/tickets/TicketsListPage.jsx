import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ticketsAPI } from '@/services/api/tickets.api';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import TicketDetailModal from '@/components/tickets/TicketDetailModal';

export default function TicketsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [filters, setFilters] = useState({
    project_id: searchParams.get('project_id') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    search: searchParams.get('search') || '',
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => {
      if (filters.project_id) {
        return ticketsAPI.getAll(filters.project_id, {
          status: filters.status,
          priority: filters.priority,
          search: filters.search,
        });
      }
      return { data: [] };
    },
    enabled: !!filters.project_id,
  });
console.log("TicketsListPage rendered with filters:", ticketsData);
  const projects = projectsData?.data.projects || [];
  const tickets = ticketsData?.data.tickets || [];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleTicketClick = (ticketId) => {
    setSelectedTicketId(ticketId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage all project tickets
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Ticket
        </Button>
      </div>

      <Card glass>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Project"
              value={filters.project_id}
              onChange={(e) => handleFilterChange('project_id', e.target.value)}
              options={[
                { value: '', label: 'Select Project' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'IN_REVIEW', label: 'In Review' },
                { value: 'DONE', label: 'Done' },
              ]}
            />
            <Select
              label="Priority"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
            <Input
              label="Search"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {!filters.project_id ? (
        <Card glass>
          <CardBody>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Select a project
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a project from the dropdown to view tickets
              </p>
            </div>
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Loading fullScreen />
      ) : tickets.length === 0 ? (
        <Card glass>
          <CardBody>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No tickets found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new ticket
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>Create Ticket</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              glass
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleTicketClick(ticket.id)}
            >
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {ticket.ticket_number}
                      </span>
                      <Badge status={ticket.status}>{ticket.status}</Badge>
                      <Badge priority={ticket.priority}>{ticket.priority}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Reporter: {ticket.reporter_name}</span>
                      <span>Assignee: {ticket.assignee_name || 'Unassigned'}</span>
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.story_points && <span>{ticket.story_points} pts</span>}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}
