import { cn } from '@/utils/cn';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/config/constants';

export default function Badge({ children, variant = 'default', status, priority, className }) {
  const getColor = () => {
    if (status) return STATUS_COLORS[status];
    if (priority) return PRIORITY_COLORS[priority];

    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200',
    };
    return variants[variant];
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        getColor(),
        className
      )}
    >
      {children}
    </span>
  );
}
