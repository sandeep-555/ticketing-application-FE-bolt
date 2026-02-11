import { useState } from 'react';
import Input from '@/components/ui/Input';
import { useAgents } from '../../hooks/useAgents';

export default function AgentAutoComplete({ register, setValue, inputLabel = "Agent Email" }) {
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);

  const { data, isLoading } = useAgents(search);

  const agents = data?.data || [];

  // 🔥 THIS IS THE MISSING PART
  const onSelect = (agent) => {

    console.log("Selected agent:", agent); 
    setValue('name', agent.name);
    setValue('email', agent.email);
    setValue('id', agent.id);      // 👈 important
    setSearch(agent.email);
    setShow(false);
  };

  return (
    <div className="relative">
      <Input
        label={inputLabel}
        placeholder="Search agent email..."
        {...register('email')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShow(true);
        }}
      />

      {show && search && (
        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border rounded-lg mt-1 shadow-lg max-h-60 overflow-auto">
          
          {isLoading && (
            <div className="p-2 text-sm">Searching...</div>
          )}

          {!isLoading && agents.length === 0 && (
            <div className="p-2 text-sm text-gray-500">
              No agents found
            </div>
          )}

          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => onSelect(agent)}   // 👈 HERE
            >
              <div className="text-sm font-medium">
                {agent.name}
              </div>
              <div className="text-xs text-gray-500">
                {agent.email}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
