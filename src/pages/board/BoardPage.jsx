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

function TicketCard({ ticket, status, onClick, isSubtask = false }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { ticketId: ticket.id, fromStatus: status, isSubtask },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const subtaskCount = ticket.subtask_count || 0;
  const completedSubtasks = ticket.completed_subtasks || 0;

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${isSubtask ? 'ml-4 border-l-4 border-l-purple-500' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSubtask && (
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          <span className="text-xs font-mono text-gray-500">{ticket.ticket_number}</span>
        </div>
        <Badge priority={ticket.priority}>{ticket.priority}</Badge>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
        {isSubtask && <span className="text-purple-600 dark:text-purple-400 mr-2">SUB:</span>}
        {ticket.title}
      </h4>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{ticket.assignee_name || 'Unassigned'}</span>
        <div className="flex items-center gap-2">
          {!isSubtask && subtaskCount > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
              {completedSubtasks}/{subtaskCount}
            </span>
          )}
          {ticket.story_points && <span>{ticket.story_points} pts</span>}
        </div>
      </div>
    </div>
  );
}

function Column({ status, tickets, subtasks, onDrop, onTicketClick }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item) => onDrop(item.ticketId, item.fromStatus, status, item.isSubtask),
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

  const totalCount = tickets.length + subtasks.length;

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
        <Badge variant="default">{totalCount}</Badge>
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            status={status}
            onClick={() => onTicketClick(ticket)}
            isSubtask={false}
          />
        ))}
        {subtasks.map((subtask) => (
          <TicketCard
            key={`sub-${subtask.id}`}
            ticket={subtask}
            status={status}
            onClick={() => onTicketClick(subtask)}
            isSubtask={true}
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
  const [expandedTickets, setExpandedTickets] = useState({});
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

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, data }) => ticketsAPI.updateSubTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', selectedProject] });
      toast.success('Subtask updated successfully');
    },
    onError: () => {
      toast.error('Failed to update subtask');
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

  const handleDrop = (ticketId, fromStatus, toStatus, isSubtask) => {
    if (fromStatus === toStatus) return;

    if (isSubtask) {
      updateSubtaskMutation.mutate({
        id: ticketId,
        data: { status: toStatus }
      });
    } else {
      updateTicketMutation.mutate({
        id: ticketId,
        data: { status: toStatus }
      });
    }
  };

  const toggleTicketExpansion = (ticketId) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const projects = projectsData?.data?.projects || [];
  const tickets = ticketsData?.data?.tickets || [];

  const allSubtasks = tickets.flatMap(ticket =>
    (ticket.subtasks || []).map(subtask => ({
      ...subtask,
      parent_ticket_id: ticket.id,
      parent_ticket_number: ticket.ticket_number
    }))
  );

  const groupedTickets = tickets.reduce((acc, ticket) => {
    const status = ticket.status || 'OPEN';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(ticket);
    return acc;
  }, {});

  const groupedSubtasks = allSubtasks.reduce((acc, subtask) => {
    const status = subtask.status || 'TODO';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(subtask);
    return acc;
  }, {});

  const statuses = ['OPEN', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED'];
  const board = statuses.reduce((acc, status) => {
    acc[status] = groupedTickets[status] || [];
    return acc;
  }, {});

  const subtasksBoard = statuses.reduce((acc, status) => {
    acc[status] = groupedSubtasks[status] || [];
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
            <Column status="OPEN" tickets={board.OPEN || []} subtasks={subtasksBoard.OPEN || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="TODO" tickets={board.TODO || []} subtasks={subtasksBoard.TODO || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="IN_PROGRESS" tickets={board.IN_PROGRESS || []} subtasks={subtasksBoard.IN_PROGRESS || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="IN_REVIEW" tickets={board.IN_REVIEW || []} subtasks={subtasksBoard.IN_REVIEW || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="DONE" tickets={board.DONE || []} subtasks={subtasksBoard.DONE || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
            <Column status="CLOSED" tickets={board.CLOSED || []} subtasks={subtasksBoard.CLOSED || []} onDrop={handleDrop} onTicketClick={setSelectedTicket} />
          </div>
        </DndProvider>
      ) : (
        <Card glass>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 w-8"></th>
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
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => {
                      const ticketSubtasks = ticket.subtasks || [];
                      const isExpanded = expandedTickets[ticket.id];

                      return (
                        <>
                          <tr
                            key={ticket.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="py-3 px-4">
                              {ticketSubtasks.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTicketExpansion(ticket.id);
                                  }}
                                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                  <svg
                                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400 cursor-pointer"
                            >
                              {ticket.ticket_number}
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 text-gray-900 dark:text-white cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                {ticket.title}
                                {ticketSubtasks.length > 0 && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                    {ticketSubtasks.filter(st => st.status === 'DONE').length}/{ticketSubtasks.length}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 cursor-pointer"
                            >
                              <Badge variant="default">{ticket.status}</Badge>
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 cursor-pointer"
                            >
                              <Badge priority={ticket.priority}>{ticket.priority}</Badge>
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              {ticket.assignee_name || 'Unassigned'}
                            </td>
                            <td
                              onClick={() => setSelectedTicket(ticket)}
                              className="py-3 px-4 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              {ticket.story_points || '-'}
                            </td>
                          </tr>
                          {isExpanded && ticketSubtasks.map((subtask) => (
                            <tr
                              key={`sub-${subtask.id}`}
                              onClick={() => setSelectedTicket(subtask)}
                              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer bg-purple-50 dark:bg-purple-950"
                            >
                              <td className="py-3 px-4"></td>
                              <td className="py-3 px-4 text-sm font-mono text-purple-600 dark:text-purple-400 pl-8">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  {subtask.ticket_number || 'SUB'}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-900 dark:text-white pl-8">
                                {subtask.title}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="default">{subtask.status}</Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge priority={subtask.priority}>{subtask.priority}</Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                {subtask.assignee_name || 'Unassigned'}
                              </td>
                              <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                {subtask.story_points || '-'}
                              </td>
                            </tr>
                          ))}
                        </>
                      );
                    })
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
