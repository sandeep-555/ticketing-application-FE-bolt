import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { ticketsAPI } from '@/services/api/tickets.api';
import { projectsAPI } from '@/services/api/projects.api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { TICKET_PRIORITY, WORK_CATEGORY, WORK_TYPE } from '@/config/constants';
import { WORK_TYPE_MAP } from '../../config/constants';
import AgentAutoComplete from '../projects/AgentAutoComplete';

const ticketSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  work_category: z.enum(['DEVELOPMENT', 'BAU', 'SUPPORT']),
  work_type: z.enum(['NEW_FEATURE', 'BUG_FIX', 'ENHANCEMENT', 'MAINTENANCE', 'INCIDENT']),
  story_points: z.string().optional(),
  assignee_id: z.string().optional(),
});

export default function CreateTicketModal({ isOpen, onClose }) {
  const user = useSelector(selectCurrentUser);
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
    enabled: isOpen,
  });

const {
  register,
  handleSubmit,
  watch,
  reset,
  setValue,        // 👈 ADD THIS
  formState: { errors },
} = useForm({
  resolver: zodResolver(ticketSchema),
  defaultValues: {
    priority: 'MEDIUM',
    work_category: 'SUPPORT',
    work_type: 'INCIDENT',
  },
});


  const workCategory = watch('work_category');
  const projects = projectsData?.data.projects || [];

  const createMutation = useMutation({
    mutationFn: ticketsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Ticket created successfully');
      reset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    },
  });

const onSubmit = (data) => {

  console.log("Form data before mutation:", data); // Debug log
  const payload = {
    ...data,
    reporter_id: user?.id,

    story_points:
      workCategory === 'DEVELOPMENT' && data.story_points
        ? parseInt(data.story_points)
        : null,

    assignee_id: data.assignee_id || null,   // 👈 FROM AUTOCOMPLETE
  };

  createMutation.mutate(payload);
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Ticket" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Project *"
            error={errors.project_id?.message}
            {...register('project_id')}
            options={[
              { value: '', label: 'Select Project' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />

          <Select
            label="Priority *"
            error={errors.priority?.message}
            {...register('priority')}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'CRITICAL', label: 'Critical' },
            ]}
          />
        </div>

        <Input
          label="Title *"
          placeholder="Brief description of the issue"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows="4"
            placeholder="Detailed description of the ticket"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Work Category *"
            error={errors.work_category?.message}
            {...register('work_category')}
            options={[
              { value: 'DEVELOPMENT', label: 'Development' },
              { value: 'BAU', label: 'BAU' },
              { value: 'SUPPORT', label: 'Support' },
            ]}
          />

       <Select
  label="Work Type *"
  error={errors.work_type?.message}
  {...register('work_type')}
  options={[
    { value: '', label: 'Select Type' },
    ...(WORK_TYPE_MAP[workCategory] || []),
  ]}
/>

        </div>

        {workCategory === 'DEVELOPMENT' && (
          <Input
            label="Story Points"
            type="number"
            min="1"
            max="13"
            placeholder="1, 2, 3, 5, 8, 13"
            error={errors.story_points?.message}
            {...register('story_points')}
          />
        )}
        {/* 🔥 ASSIGNEE SELECTION */}
<div className="border-t pt-4 border-gray-200 dark:border-gray-700">
  <AgentAutoComplete
    register={register}
    setValue={setValue}
    inputLabel="Assignee"
  />
</div>


        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
