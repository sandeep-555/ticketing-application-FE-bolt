import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import AgentAutoComplete from '../../components/projects/AgentAutoComplete';
import ProjectDetailsModal from './ProjectDetailsModal';

export default function ProjectsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔥 NEW STATE FOR MEMBER MODAL
  const [memberModal, setMemberModal] = useState({
    open: false,
    projectId: null,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    project: null,
  });


  const createMutation = useMutation({
    mutationFn: projectsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  // 🔥 NEW MUTATION FOR ADD MEMBER
  const addMemberMutation = useMutation({
    mutationFn: ({ projectId, data }) =>
      projectsAPI.addMember(projectId, data),

    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-members'] });

      setMemberModal({ open: false, projectId: null });
      resetMember();
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    },
  });

  const { register, handleSubmit, reset } = useForm();

  // 🔥 FORM FOR MEMBER
  const {
    register: registerMember,
    handleSubmit: handleMemberSubmit,
    reset: resetMember,
    setValue: setValueMember,

  } = useForm();

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const onAddMember = (data) => {

    console.log("Adding member with data:", data); // Debug log
    addMemberMutation.mutate({
      projectId: memberModal.projectId,
      data: {
        email: data.email,
        user_id: data.id, // 👈 ADDED USER ID
        role: 'AGENT',   // 👈 FORCED DEFAULT
      },
    });
  };


  if (isLoading) return <Loading fullScreen />;

  const projects = data?.data.projects || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Manage and organize your projects
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} glass>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <Badge variant="default">{project.status}</Badge>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500">
                    {project.project_code}
                  </span>

                  <div className="flex gap-2">
                    {/* 🔥 NEW ADD MEMBER BUTTON */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setMemberModal({
                          open: true,
                          projectId: project.id,
                        })
                      }
                    >
                      Add Member
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDetailsModal({
                          open: true,
                          project,
                        })
                      }
                    >
                      View Details
                    </Button>

                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* EXISTING CREATE PROJECT MODAL - UNTOUCHED */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Project"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="Enter project name"
            {...register('name')}
          />

          <Input
            label="Project Code"
            placeholder="e.g., PROJ"
            {...register('project_code')}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* 🔥 NEW ADD MEMBER MODAL */}
      <Modal
        isOpen={memberModal.open}
        onClose={() =>
          setMemberModal({ open: false, projectId: null })
        }
        title="Add Member to Project"
      >
        <form
          onSubmit={handleMemberSubmit(onAddMember)}
          className="space-y-4"
        >
          <AgentAutoComplete
            register={registerMember}
            setValue={setValueMember}
          />

          <input type="hidden" {...registerMember('id')} />


          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() =>
                setMemberModal({ open: false, projectId: null })
              }
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={addMemberMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      <ProjectDetailsModal
  open={detailsModal.open}
  project={detailsModal.project}
  onClose={() =>
    setDetailsModal({
      open: false,
      project: null,
    })
  }
/>

    </div>
  );
}
