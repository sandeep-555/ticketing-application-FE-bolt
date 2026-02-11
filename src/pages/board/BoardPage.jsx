import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { boardAPI } from '@/services/api/board.api';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { socketService } from '@/services/socket/socket';

const ITEM_TYPE = 'TICKET';

function TicketCard({ ticket, status }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { ticketId: ticket.id, fromStatus: status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow ${
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
        {ticket.story_points && <span>{ticket.story_points} pts</span>}
      </div>
    </div>
  );
}

function Column({ status, tickets, onDrop }) {
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
  };

  return (
    <div
      ref={drop}
      className={`rounded-xl p-4 min-h-[500px] ${statusColors[status]} ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {status.replace('_', ' ')}
        </h3>
        <Badge variant="default">{tickets.length}</Badge>
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} status={status} />
        ))}
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['board', selectedProject],
    queryFn: () => boardAPI.getProjectBoard(selectedProject),
    enabled: !!selectedProject,
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => boardAPI.bulkUpdateStatus(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
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
        queryClient.invalidateQueries({ queryKey: ['board', selectedProject] });
      };

      socketService.on('board_updated', handleBoardUpdate);
      socketService.on('bulk_status_changed', handleBoardUpdate);

      return () => {
        socketService.off('board_updated', handleBoardUpdate);
        socketService.off('bulk_status_changed', handleBoardUpdate);
        socketService.leaveProject(selectedProject);
      };
    }
  }, [selectedProject, queryClient]);

  const handleDrop = (ticketId, fromStatus, toStatus) => {
    if (fromStatus === toStatus) return;

    updateMutation.mutate({
      project_id: selectedProject,
      updates: [{ ticket_id: ticketId, status: toStatus }],
    });
  };

  const projects = projectsData?.data?.projects || [];
  const board = boardData?.data?.columns || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Drag and drop tickets to update status
          </p>
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
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Column status="TODO" tickets={board.TODO || []} onDrop={handleDrop} />
            <Column status="IN_PROGRESS" tickets={board.IN_PROGRESS || []} onDrop={handleDrop} />
            <Column status="IN_REVIEW" tickets={board.IN_REVIEW || []} onDrop={handleDrop} />
            <Column status="DONE" tickets={board.DONE || []} onDrop={handleDrop} />
          </div>
        </DndProvider>
      )}
    </div>
  );
}
