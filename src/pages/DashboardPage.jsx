import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { projectsAPI } from '@/services/api/projects.api';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  console.log("DashboardPage rendered")
  const user = useSelector(selectCurrentUser);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.getAll(),
  });
console.log("in dashboard")
  if (isLoading) return <Loading fullScreen text="Loading dashboard..." />;

  const projects = projectsData?.data.projects || [];
console.log("Projects loaded:", projects);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glass>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold text-primary mt-2">{projects.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card glass>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Tickets</p>
                <p className="text-3xl font-bold text-secondary mt-2">--</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <svg
                  className="w-8 h-8 text-secondary"
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
              </div>
            </div>
          </CardBody>
        </Card>

        <Card glass>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">My Role</p>
                <Badge variant="primary" className="mt-2 text-sm px-3 py-1">
                  {user?.role}
                </Badge>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Projects</h2>
        </CardHeader>
        <CardBody>
          {projects.length === 0 || projects === undefined ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No projects found. Create your first project!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.slice(0, 6).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {project.description}
                  </p>
                  <Badge variant="default" className="mt-2">
                    {project.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
