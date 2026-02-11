import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useSelector } from 'react-redux';

export default function ProjectDetailsModal({
  open,
  onClose,
  project,
}) {

    const user = useSelector(state => state.auth.user);
  if (!project) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Project Details"
    >
      <div className="space-y-6">

        {/* BASIC INFO */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Project Name</p>
            <p className="font-medium">{project.name}</p>
          </div>

          <div>
            <p className="text-gray-500">Status</p>
            <Badge>{project.status}</Badge>
          </div>

          <div>
            <p className="text-gray-500">Owner</p>
            <p>{project.owner_name}</p>
            <p className="text-xs">{project.owner_email}</p>
          </div>

          <div>
            <p className="text-gray-500">Your Role</p>
            <Badge variant="outline">
              {project.member_role}
            </Badge>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <p className="text-gray-500 mb-1">Description</p>
          <p className="text-sm">
            {project.description || 'No description'}
          </p>
        </div>

        {/* MEMBERS */}
        <div>
          <p className="text-gray-500 mb-2">
            Members ({project.members?.length || 0})
          </p>

          <div className="space-y-2 max-h-[250px] overflow-auto">
            {project.members?.filter(m => m.user_id !== user.id).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border rounded p-2"
              >
                <div>
                  <p className="font-medium">{m.user_name}</p>

                  <p className="text-xs text-gray-500">
                    {m.user_email}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{m.role}</Badge>

                  {/* <Badge variant="ghost">
                    System: {m.system_role}
                  </Badge> */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* META */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            Created:{' '}
            {new Date(project.created_at).toLocaleString()}
          </div>

          <div>
            Updated:{' '}
            {new Date(project.updated_at).toLocaleString()}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
