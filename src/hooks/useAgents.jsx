import { useQuery } from '@tanstack/react-query';
import { projectsAPI } from '@/services/api/projects.api';
import { useState, useEffect } from 'react';

export const useAgents = (search) => {
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  return useQuery({
    queryKey: ['agents', debounced],
    queryFn: () => projectsAPI.getAgents(debounced),
    enabled: debounced.length > 1,
    staleTime: 1000 * 60 * 5,
  });
};
