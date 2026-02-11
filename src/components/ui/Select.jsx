import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const Select = forwardRef(({ className, error, label, options = [], ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border-gray-300 dark:border-gray-600',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
