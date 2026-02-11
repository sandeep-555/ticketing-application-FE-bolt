import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { ticketsAPI } from '@/services/api/tickets.api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ClientPortalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsAPI.getAll('all', { reporter_id: user?.id }),
  });

  const createMutation = useMutation({
    mutationFn: ticketsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Ticket created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    },
  });

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    createMutation.mutate({ ...data, reporter_id: user?.id });
  };

  if (isLoading) return <Loading fullScreen />;

  const tickets = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage your support tickets
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Ticket</Button>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card glass>
            <CardBody>
              <p className="text-center text-gray-600 dark:text-gray-400 py-12">
                No tickets found. Create your first ticket!
              </p>
            </CardBody>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id} glass>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {ticket.ticket_number}
                      </span>
                      <Badge status={ticket.status}>{ticket.status}</Badge>
                      <Badge priority={ticket.priority}>{ticket.priority}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.assignee_name && <span>Assigned to: {ticket.assignee_name}</span>}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Ticket">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Brief description of the issue" {...register('title')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows="4"
              placeholder="Detailed description of your issue"
              {...register('description')}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
