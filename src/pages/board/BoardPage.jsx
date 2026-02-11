import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ticketsAPI } from '@/services/api/tickets.api';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { socketService } from '@/services/socket/socket';
import TicketDetailModal from '@/components/tickets/TicketDetailModal';

const ITEM_TYPE = 'TICKET';

function TicketCard({ ticket, status, onClick }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { ticketId: ticket.id, fromStatus: status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const subtaskCount = ticket.subtasks?.length || 0;
  const completedSubtasks = ticket.subtasks?.filter(st => st.status === 'DONE').length || 0;

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{ticket.ticket_number}</span>
        <Badge priority={ticket.priority}>{ticket.priority}</Badge>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{ticket.title}</h4>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{ticket.assignee_name || 'Unassigned'}</span>
        <div className="flex items-center gap-2">
          {subtaskCount > 0 && (
            <span className="text-xs">
              {completedSubtasks}/{subtaskCount}
            </span>
          )}
          {ticket.story_points && <span>{ticket.story_points} pts</span>}
        </div>
      </div>
    </div>
  );
}

function Column({ status, tickets, onDrop, onTicketClick }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item) => onDrop(item.ticketId, item.fromStatus, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const statusColors = {
    TODO: 'bg-gray-100 dark:bg-gray-800',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900',
    IN_REVIEW: 'bg-yellow-100 dark:bg-yellow-900',
    DONE: 'bg-green-100 dark:bg-green-900',
    OPEN: 'bg-gray-100 dark:bg-gray-800',
    CLOSED: 'bg-gray-400 dark:bg-gray-700',
  };

  const statusLabels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    OPEN: 'Open',
    CLOSED: 'Closed',
  };

  return (
    <div
      ref={drop}
      className={`rounded-xl p-4 min-h-[500px] ${statusColors[status]} ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {statusLabels[status] || status}
        </h3>
        <Badge variant="default">{tickets.length}</Badge>
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            status={status}
            onClick={() => onTicketClick(ticket)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', selectedProject],
    queryFn: () => ticketsAPI.getAll(selectedProject),
    enabled: !!selectedProject,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => ticketsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', selectedProject] });
      toast.success('Ticket updated successfully');
    },
    onError: () => {
      toast.error('Failed to update ticket');
    },
  });

  useEffect(() => {
    if (selectedProject) {
      socketService.joinProject(selectedProject);

      const handleBoardUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['tickets', selectedProject] });
      };

      socketService.on('ticket_created', handleBoardUpdate);
      socketService.on('ticket_updated', handleBoardUpdate);
      socketService.on('ticket_deleted', handleBoardUpdate);

      return () => {
        socketService.off('ticket_created', handleBoardUpdate);
        socketService.off('ticket_updated', handleBoardUpdate);
        socketService.off('ticket_deleted', handleBoardUpdate);
        socketService.leaveProject(selectedProject);
      };
    }
  }, [selectedProject, queryClient]);

  const handleDrop = (ticketId, fromStatus, toStatus) => {
    if (fromStatus === toStatus) return;

    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: toStatus }
    });
  };

  const projects = projectsData?.data?.projects || [];
  const tickets = ticketsData?.data?.tickets || [];

  const groupedTickets = tickets.reduce((acc, ticket) => {
    const status = ticket.status || 'OPEN';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(ticket);
    return acc;
  }, {});

  const statuses = ['OPEN', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED'];
  const board = statuses.reduce((acc, status) => {
    acc[status] = groupedTickets[status] || [];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Board</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {viewMode === 'kanban' ? 'Drag and drop tickets to update status' : 'View all tickets in a list'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          <div className="w-64">
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              options={[
                { value: '', label: 'Select Project' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {!selectedProject ? (
        <Card glass>
          <CardBody>
            <p className="text-center text-gray-600 dark:text-gray-400 py-12">
              Please select a project to view the board
            </p>
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Loading fullScreen />
      ) : viewMode === 'kanban' ? (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Column status="OPEN" tickets={board.OPEN || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="TODO" tickets={board.TODO || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="IN_PROGRESS" tickets={board.IN_PROGRESS || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="IN_REVIEW" tickets={board.IN_REVIEW || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="DONE" tickets={board.DONE || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="CLOSED" tickets={board.CLOSED || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
          </div>
        </DndProvider>
      ) : (
        <Card glass>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Ticket</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Title</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Priority</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Assignee</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {ticket.ticket_number}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {ticket.title}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{ticket.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge priority={ticket.priority}>{ticket.priority}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {ticket.assignee_name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {ticket.story_points || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          projectId={selectedProject}
        />
      )}
    </div>
  );
}
